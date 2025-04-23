// const express = require('express');
// const router = express.Router();
// const otpStore = require('./otpStore.js'); 

// router.post('/verify-otp', async (req, res) => {
//     const { otp } = req.body;  
//     const emailEntry = Object.keys(otpStore).find(email => otpStore[email].otp === parseInt(otp));
  
//     if (!emailEntry) {
//       return res.status(400).json({  success: false, message: 'Invalid OTP' });
//     }

//     const { expires } = otpStore[emailEntry];
    
//     if (Date.now() > expires) {
//       delete otpStore[emailEntry]; 
//       return res.status(400).json({  success: false ,message: 'OTP has expired' });
//     }

    
//     res.status(200).json({  success: true ,message: 'OTP verified successfully' });

   
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const otpStore = require('./otpStore.js');
const UserSchema = require('../models/User');

router.post('/verify-otp', async (req, res) => {
  const { otp } = req.body;

  // 🔎 Find email in otpStore
  const emailEntry = Object.keys(otpStore).find(
    email => otpStore[email].otp === parseInt(otp)
  );

  if (!emailEntry) {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }

  const { expires } = otpStore[emailEntry];

  if (Date.now() > expires) {
    delete otpStore[emailEntry];
    return res.status(400).json({ success: false, message: 'OTP has expired' });
  }

  try {
    // ✅ Update user in DB
    const result = await UserSchema.verifyOTP(emailEntry, otp);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    // ✅ Optionally clean up OTP from memory store
    delete otpStore[emailEntry];

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      status: {
        otp_entered: true,
        is_verified: false // still waiting for password, probably
      }
    });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during OTP verification',
      error: error.message
    });
  }
});

module.exports = router;
