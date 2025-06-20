
// const express = require('express');
// const router = express.Router();
// const UserSchema = require('../models/User.js');
// const { OAuth2Client } = require('google-auth-library');
// require('dotenv').config()
// const GOOGLE_CLIENT_ID = process.env.CLIENT_ID; // ⬅️ Replace with your actual Web Client ID
// const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// router.post('/signwithgoogle', async (req, res) => {
//     try {
//         const { username, email, password, photo, idToken } = req.body;

//         // 🔹 Check if it's a Google Sign-In request
//         if (idToken) {
//             const ticket = await client.verifyIdToken({
//                 idToken,
//                 audience: GOOGLE_CLIENT_ID,
//             });

//             const payload = ticket.getPayload();
//             const { email: googleEmail, name, picture } = payload;

//             // Check if user already exists
//             let user = await UserSchema.findOne({ email: googleEmail });

//             // Create user if not exists
//             if (!user) {
//                 user = await UserSchema.create({
//                     username: name,
//                     email: googleEmail,
//                     password: 'google-oauth', // dummy password
//                     photo: picture,
//                 });
//             }

//             return res.status(200).json({
//                 message: "User registered/signed in with Google successfully",
//                 user,
//             });
//         }

//         // 🔹 Normal Registration (non-Google)
//         if (!username || !email || !password) {
//             return res.status(400).json({ error: "Username, email and password are required" });
//         }

        
//         const existingUser = await UserSchema.findOne({ email });

//         if (existingUser) {
//             return res.status(409).json({ error: "Email already exists" });
//         }

//         const newUser = await UserSchema.create({
//             username,
//             email,
//             password,
//             photo
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

// module.exports = router;


const express = require('express');
const router = express.Router();
const UserSchema = require('../models/User.js');
const { OAuth2Client } = require('google-auth-library');
const jwt=require("jsonwebtoken")
require('dotenv').config();

const GOOGLE_CLIENT_ID = process.env.CLIENT_ID;
const JWT_SECRET=process.env.JWT_SECRET;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
router.post('/signwithgoogle', async (req, res) => {
    try {
        const { idToken } = req.body;
        
        if (!idToken) {
            return res.status(400).json({ error: 'ID token is required' });
        }
        
        const ticket = await client.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;
        
        // Check if user already exists
        let user = await UserSchema.findByEmail(email);
        
        if (!user) {
            // Create new user with Google auth
            user = await UserSchema.create({
                username: name,
                email,
                password: 'google-oauth',  // Special marker for Google accounts
                photo: picture,
                auth_type: 'GOOGLE',
                is_verified: true // Set auth_type to 'google'
            });
        }
        const token = jwt.sign(
    {
        id: user.id,
        email: user.email,
        auth_type: user.auth_type
    },
    JWT_SECRET
   
);
        // Return clean user data
        return res.status(200).json({
            message: "Signed in successfully with Google",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                photo: user.photo,
                auth_type: user.auth_type,
                is_verified: user.is_verified,
            }
        });
    } catch (error) {
        console.error("Google Sign-In Error:", error);
        return res.status(500).json({ error: error.message || 'Server error' });
    }
});

module.exports = router;
