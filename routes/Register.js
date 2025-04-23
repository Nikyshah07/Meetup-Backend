
const express = require('express');
const router = express.Router();
const otpStore=require('./otpStore')
const UserSchema=require('../models/User')
const nodemailer=require('nodemailer')
require('dotenv').config();
router.post('/register', async (req, res) => {
    const { email } = req.body;
     try {
      const existingUser = await UserSchema.findByEmail(email);

      if (existingUser) {
        // 🟡 User already exists, return their status
        return res.status(200).json({
          success: true,
          message: 'User already registered',
          status: {
            otp_entered: existingUser.otp_entered,
            is_verified: existingUser.is_verified,
            has_password: !!existingUser.password // true if password is set
          }
        });
      }
  
      const otp = Math.floor(1000 + Math.random() * 9000);  
      
      const expirationTime = Date.now() + 2 * 60 * 1000; 

      
      otpStore[email] = { otp, expires: expirationTime };  
  
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL,  
          pass: process.env.EMAIL_PASSWORD, 
        },
      });
  
      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Your OTP for Password Reset',
        text: `Your OTP is ${otp}`,
      };
      transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          return res.status(500).json({ success: false, message: 'Failed to send OTP' });
        }
  
        // Create new user in DB
        const newUser = await UserSchema.create({
          email,
          password: null,
          otp: otp,
          otp_entered: false,
          is_verified: false,
        });
  
        res.status(200).json({
          success: true,
          message: 'OTP sent and user created',
          status: {
            otp_entered: false,
            is_verified: false,
            has_password: false
          }
        });
      });

    } catch (error) {
      
      res.status(500).json({ success: false, message: 'Server error',error: error.message });
    }
});

module.exports = router;



