const express=require('express');
const router=express.Router();
const UserSchema=require('../models/User.js')
const jwt=require('jsonwebtoken');
const supabase=require('./supabase.js')
require('dotenv').config()
const JWT_SECRET=process.env.JWT_SECRET


// router.post('/login', async (req, res) => {
//     try {
//         const { email, password } = req.body;
        
//         // Validate input
//         if (!email || !password) {
//             return res.status(400).json({ error: "Please enter both email and password." });
//         }
        
//         // Find user by email
//         const user = await UserSchema.findByEmail(email);
//         if (!user) {
//             console.log("User not found:", email);
//             return res.status(401).json({ error: "User not found" });
//         }
        
//         // Check if this user was created with Google OAuth
//         if (user.auth_type === "GOOGLE") {
//             return res.status(401).json({ error: "This account was registered using Google. Please sign in with Google.", "auth_type": user.auth_type });
//           }
        
//         // Compare password for regular accounts
//         try {
//             const isPasswordValid = await UserSchema.validatePassword(password, user.password);
//             console.log("Password validation result:", isPasswordValid);
            
//             if (!isPasswordValid) {
//                 return res.status(401).json({ error: "Invalid password" });
//             }
//         } catch (error) {
//             console.error("Password validation error:", error);
//             return res.status(500).json({ error: "Something went wrong while checking your password. Please try again later." });
//         }
        
//         // Don't send the password and photo in response
//         // const { password: _, photo: __, ...userWithoutSensitiveInfo } = user;

//         const { password: _, ...userWithoutSensitiveInfo } = user;

// // If photo exists, send it. If not, send null
// userWithoutSensitiveInfo.photo = user.photo || null;
//         const token = jwt.sign(
//             {
//                 id: user.id,
//                 email: user.email,
//                  username: user.username,
//                 auth_type: user.auth_type,
//             },
            
//             JWT_SECRET
//         );
//     //   res.status(200).json(console.log("User logged in:", userWithoutSensitiveInfo),
        
//     //         {
//     //         message: "Login successful",
//     //         user: userWithoutSensitiveInfo
//     //     });
//     return res.status(200).json({message:"Login successfull..",user: userWithoutSensitiveInfo,token})
//     } catch (error) {
//         console.error("Login error:", error);
//         res.status(500).json({ error: "Server error" });
//     }
// });

// module.exports=router


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Please enter both email and password." });
    }

    // Fetch user by email from Supabase
    const { data: userArray, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (error || !userArray || userArray.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const user = userArray[0];

    // Google account check
    if (user.auth_type === "GOOGLE") {
      return res.status(401).json({ error: "This account was registered using Google. Please sign in with Google.", auth_type: user.auth_type });
    }

    // Validate password (compare plain text or hashed, depending on your setup)
    const isPasswordValid = await UserSchema.validatePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        auth_type: user.auth_type,
      },
      JWT_SECRET
    );

    // Build response user object
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      username: user.username,
      gender: user.gender,
      city: user.city,
      photo: user.photo || null, // Send photo URL if exists
      auth_type: user.auth_type
    };

    return res.status(200).json({
      message: "Login successful",
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});
module.exports=router


