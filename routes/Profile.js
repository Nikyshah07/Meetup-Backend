// const express = require('express');
// const router = express.Router();
// const UserSchema = require('../models/User.js');
// const authenticate = require('../middlewares/authenticate.js');

// router.post('/profile', authenticate, async (req, res) => {
//   try {
//     const email = req.user.email;
//     const { username, photo, gender, city } = req.body;

//     if (!email) {
//       return res.status(400).json({ error: "Email is missing in token" });
//     }

//     const allowedGenders = ['male', 'female', 'other'];
//     if (gender && !allowedGenders.includes(gender)) {
//       return res.status(400).json({ error: "Invalid gender value. Must be 'male', 'female', or 'other'." });
//     }

//     const existingUser = await UserSchema.findByEmail(email);
//     if (!existingUser) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const updatedUser = await UserSchema.updateProfileByEmail(email, {
//       username,
//       photo,
//       gender,
//       city,
//     });

//     res.status(200).json({
//       message: "Profile updated successfully",
//       user: updatedUser
//     });

//   } catch (error) {
//     console.error("Profile update error:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const UserSchema = require('../models/User.js');
const authenticate = require('../middlewares/authenticate.js');
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Profile update route with photo upload
router.post('/profile', authenticate, upload.single('photo'), async (req, res) => {
  try {
    const email = req.user.email;
    const { username, gender, city } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is missing in token" });
    }

    const allowedGenders = ['male', 'female', 'other'];
    if (gender && !allowedGenders.includes(gender)) {
      return res.status(400).json({ error: "Invalid gender value. Must be 'male', 'female', or 'other'." });
    }

    const existingUser = await UserSchema.findByEmail(email);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prepare update data
    const updateData = {
      username,
      gender,
      city,
    };

    // Handle photo upload - store as base64 in database
    if (req.file) {
      const base64Photo = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      updateData.photo = base64Photo;
    }

    const updatedUser = await UserSchema.updateProfileByEmail(email, updateData);

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Server error" });
  }
});
module.exports=router;