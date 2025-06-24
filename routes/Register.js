
// const express = require('express');
// const router = express.Router();
// const otpStore=require('./otpStore')
// const UserSchema=require('../models/User')
// const nodemailer=require('nodemailer')
// require('dotenv').config();
// router.post('/register', async (req, res) => {
//     const { email } = req.body;
  
// try {
//   const existingUser = await UserSchema.findByEmail(email);

//   const otp = Math.floor(1000 + Math.random() * 9000);
//   const expirationTime = Date.now() + 2 * 60 * 1000;
//   otpStore[email] = { otp, expires: expirationTime };

//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: process.env.EMAIL,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   const mailOptions = {
//     from: process.env.EMAIL,
//     to: email,
//     subject: 'Your OTP for Password Reset',
//     text: `Your OTP is ${otp}`,
//   };

//   await transporter.sendMail(mailOptions);

//   if (existingUser) {
//     if (existingUser.is_verified) {
//       return res.status(200).json({
//         success: true,
//         message: 'User already registered. Please log in',
//         status: {
//           is_verified: true,
//         }
//       });
//     }

//     // 🛠 UPDATE OTP if user exists but is not verified
//     await UserSchema.updateProfileByEmail(email, {
//       otp,
//       password: null,
//       is_verified: false,
//     });

//     return res.status(200).json({
//       success: true,
//       message: 'OTP re-sent to existing unverified user',
//       status: {
//         is_verified: false,
//       }
//     });
//   }

//   // ✅ NEW USER creation
//   await UserSchema.create({
//     email,
//     password: null,
//     otp,
//     is_verified: false,
//   });

//   res.status(200).json({
//     success: true,
//     message: 'OTP sent successfully',
//     status: {
//       is_verified: false,
//     }
//   });

// } catch (error) {
//   console.error("Error in /register route:", error);
//   res.status(500).json({ success: false, message: 'Server error', error: error.message });
// }
// });

// module.exports = router;



const express = require('express');
const router = express.Router();
const otpStore=require('./otpStore')
const UserSchema=require('../models/User')
const nodemailer=require('nodemailer')
require('dotenv').config();

router.post('/register', async (req, res) => {
    const { email } = req.body;
  
try {
  // ✅ CHECK USER FIRST - before generating OTP
  const existingUser = await UserSchema.findByEmail(email);

  if (existingUser && existingUser.is_verified) {
    return res.status(400).json({
      success: false,
      message: 'User already registered. Please log in',
      status: {
        is_verified: true,
      }
    });
  }

  // ✅ GENERATE OTP only after confirming user needs it
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

  await transporter.sendMail(mailOptions);

  if (existingUser) {
    // User exists but is not verified - update OTP
    await UserSchema.updateProfileByEmail(email, {
      otp,
      password: null,
      is_verified: false,
    });

    return res.status(200).json({
      success: true,
      message: 'OTP re-sent to existing unverified user',
      status: {
        is_verified: false,
      }
    });
  }

  // ✅ NEW USER creation
  await UserSchema.create({
    email,
    password: null,
    otp,
    is_verified: false,
  });

  res.status(200).json({
    success: true,
    message: 'OTP sent successfully',
    status: {
      is_verified: false,
    }
  });

} catch (error) {
  console.error("Error in /register route:", error);
  res.status(500).json({ success: false, message: 'Server error', error: error.message });
}
});

module.exports = router;