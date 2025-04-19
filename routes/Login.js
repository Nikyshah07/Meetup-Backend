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
            return res.status(401).json({ error: "Invalid credentials" });
        }
        
        // Compare password
        const isPasswordValid = await UserSchema.validatePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid credentials" });
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


