const express=require('express');
const router=express.Router();
const UserSchema=require('../models/User.js')

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
            return res.status(401).json({ error: "Invalid credentials" });
        }
        
        // Check if this user was created with Google OAuth
        if (user.auth_type === "GOOGLE") {
            return res.status(401).json({ error: "Use Google Sign-In", "auth_type": user.auth_type });
          }
        
        // Compare password for regular accounts
        try {
            const isPasswordValid = await UserSchema.validatePassword(password, user.password);
            console.log("Password validation result:", isPasswordValid);
            
            if (!isPasswordValid) {
                return res.status(401).json({ error: "Invalid credentials" });
            }
        } catch (error) {
            console.error("Password validation error:", error);
            return res.status(500).json({ error: "Error validating credentials" });
        }
        
        // Don't send the password and photo in response
        const { password: _, photo: __, ...userWithoutSensitiveInfo } = user;
        
        res.status(200).json({
            message: "Login successful",
            user: userWithoutSensitiveInfo
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports=router


