const express=require('express');
const router=express.Router();
const UserSchema=require('../models/User.js')

router.post('/register', async (req, res) => {
    try {
        const { username, email, password, photo,  } = req.body;

        if (!username || !email) {
            return res.status(400).json({ error: "Username and email are required" });
        }

        const existingUser = await UserSchema.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ error: "Email already exists" });
        }

        const newUser = await UserSchema.create({
            username,
            email,
            password,
            photo,

        });

        res.status(201).json({
            message: "User registered successfully",
            user: newUser
        });

    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports=router

