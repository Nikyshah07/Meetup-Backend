
const express = require('express');
const router = express.Router();
const UserSchema = require('../models/User.js');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config()
const GOOGLE_CLIENT_ID = process.env.CLIENT_ID; // ⬅️ Replace with your actual Web Client ID
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

router.post('/signwithgoogle', async (req, res) => {
    try {
        const { username, email, password, photo, idToken } = req.body;

        // 🔹 Check if it's a Google Sign-In request
        if (idToken) {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            const { email: googleEmail, name, picture } = payload;

            // Check if user already exists
            let user = await UserSchema.findOne({ email: googleEmail });

            // Create user if not exists
            if (!user) {
                user = await UserSchema.create({
                    username: name,
                    email: googleEmail,
                    password: 'google-oauth', // dummy password
                    photo: picture,
                });
            }

            return res.status(200).json({
                message: "User registered/signed in with Google successfully",
                user,
            });
        }

        // 🔹 Normal Registration (non-Google)
        if (!username || !email || !password) {
            return res.status(400).json({ error: "Username, email and password are required" });
        }

        
        const existingUser = await UserSchema.findOne({ email });

        if (existingUser) {
            return res.status(409).json({ error: "Email already exists" });
        }

        const newUser = await UserSchema.create({
            username,
            email,
            password,
            photo
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

module.exports = router;