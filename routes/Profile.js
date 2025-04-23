// const express=require('express');
// const router=express.Router();
// const UserSchema=require('../models/User.js')

// router.post('/profile', async (req, res) => {
//     try {
//         const { username, city,name,gender, photo,  } = req.body;

        

//         const existingUser = await UserSchema.findByEmail(email);
//         if (existingUser) {
//             return res.status(409).json({ error: "Email already exists" });
//         }

//         const newUser = await UserSchema.create({
//             username,
            
//             password,
//             photo,

//         });

//         res.status(201).json({
//             message: "User registered successfully",
//             user: newUser
//         });

//     } catch (error) {
//         console.error("Signup error:", error);
//         res.status(500).json({ error: "Server error" });
//     }
// });

// module.exports=router

const express = require('express');
const router = express.Router();
const UserSchema = require('../models/User.js');
const authenticate = require('../middlewares/authenticate.js'); // import auth middleware

router.post('/profile', authenticate, async (req, res) => {
  try {
    const email = req.user.email; // from JWT
    const { username, photo, gender, city } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is missing in token" });
    }
    const allowedGenders = ['male', 'female', 'other'];
    if (gender && !allowedGenders.includes(gender)) {
      return res.status(400).json({ error: "Invalid gender value. Must be 'male', 'female', or 'other'." });
    }
    const existingUser = await UserSchema.findByEmail(email);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = await UserSchema.updateProfileByEmail(email, {
      username,
      photo,
      gender,
      city,
    });

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
