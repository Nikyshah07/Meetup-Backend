const express=require('express');
const router=express.Router();
const UserSchema=require('../models/User.js')
const jwt=require('jsonwebtoken')
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        
        // Find user by email
        const user = await UserSchema.findByEmail(email);
        if (!user) {
            console.log("User not found:", email);
            return res.status(401).json({ error: "No account found with this email" });
        }
        
        // Check if this user was created with Google OAuth
        if (user.auth_type === "GOOGLE") {
            return res.status(401).json({ error: "Log in with Google, this account is Google-linked", "auth_type": user.auth_type });
          }
        
        // Compare password for regular accounts
        try {
            const isPasswordValid = await UserSchema.validatePassword(password, user.password);
            console.log("Password validation result:", isPasswordValid);
            
            if (!isPasswordValid) {
                return res.status(401).json({ error: "Invalid password" });
            }
        } catch (error) {
            console.error("Password validation error:", error);
            return res.status(500).json({ error: "Error validating credentials" });
        }
        
        // Don't send the password and photo in response
        const { password: _, photo: __, ...userWithoutSensitiveInfo } = user;
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                 username: user.username,
                auth_type: user.auth_type,
            },
            "abcd"
            
        );
    //   res.status(200).json(console.log("User logged in:", userWithoutSensitiveInfo),
        
    //         {
    //         message: "Login successful",
    //         user: userWithoutSensitiveInfo
    //     });
    return res.status(200).json({message:"Login successfull..",user: userWithoutSensitiveInfo,token})
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports=router


