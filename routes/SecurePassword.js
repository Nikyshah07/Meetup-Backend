const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const UserSchema = require("../models/User.js");
const otpStore = require("./otpStore.js");
const jwt=require('jsonwebtoken');
require('dotenv').config()
router.post("/secure-password", async (req, res) => {
  console.log("Current OTP store:", otpStore);

  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Passwords do not match" });
  }

  let email = null;
  console.log("email",email);
  
  for (let storedEmail in otpStore) {
    email = storedEmail;
    break;
  }

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "OTP has expired or was not verified" });
  }

  try {
    // Find the user by email (from OTP)
    const user = await UserSchema.findByEmail(email);
    
    if (!user) {
      return res.status(400)
        .json({ success: false, message: "User not found" });
    }

    //   const isSamePassword = await bcrypt.compare(password, user.password);
    //   if (isSamePassword) {
    //     return res.status(400).json({  success: false ,message: 'New password must be different from the old password' });
    //   }

    const hashedPassword = await bcrypt.hash(password, 10);
    //   user.password = hashedPassword;
    await UserSchema.updateProfileByEmail(
      email,{
        password: hashedPassword,
        is_verified: true,
      }
    ); 

    delete otpStore[email];
   const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                 username: user.username,
                auth_type: user.auth_type,
            },
            
            JWT_SECRET
        );
    res.status(200).json({
      success: true,
      message: "Password set successfully",
      status: {
        is_verified: true,
      },
      token
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

module.exports = router;
