const express = require('express');
const router=express.Router()
const bcrypt = require('bcrypt');
const UserSchema=require('../models/User.js')
const otpStore=require('./otpStore.js')

router.post('/reset-password', async (req, res) => {
    const { newPassword, confirmPassword } = req.body;
  
    if (newPassword !== confirmPassword) {
      return res.status(400).json({  success: false, message: 'Passwords do not match' });
    }
    let email = null;
    for (let storedEmail in otpStore) {
      email = storedEmail;
      break; 
    }
  
    if (!email) {
      return res.status(400).json({ success: false,  message: 'OTP has expired or was not verified' });
    }
  
    try {
      // Find the user by email (from OTP)
      const user = await UserSchema.findByEmail(email);
      if (!user) {
        return res.status(400).json({  success: false,message: 'User not found' });
      }
  
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return res.status(400).json({  success: false ,message: 'New password must be different from the old password' });
      }
  
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await UserSchema.updatePassword(email, hashedPassword);
  
      
      delete otpStore[email];
  
      res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({  success: false , message: 'Server error',error: error.message });
    }
  });
  
module.exports=router 