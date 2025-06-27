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

// Configure multer for memory storage
// const storage = multer.memoryStorage();
// const upload = multer({ 
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//   fileFilter: (req, file, cb) => {
//     // Accept images only
//     if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
//       return cb(new Error('Only image files are allowed!'), false);
//     }
//     cb(null, true);
//   }
// });

// Profile update route with photo upload
// router.post('/profile', upload.single('photo'), async (req, res) => {
//   try {
//     const {email,username, gender, city } = req.body;

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

//     // Prepare update data
//     const updateData = {
//       username,
//       gender,
//       city,
//     };

//     // Handle photo upload - store as base64 in database
//     if (req.file) {
//       const base64Photo = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
//       updateData.photo = base64Photo;
//     }
// //   if (req.file) {
// //   const base64Photo = `data:image/jpeg;base64,${req.file.buffer.toString('base64')}`;


// //   // Save correctly formatted image
// //   updateData.photo = base64Photo;
// // }
//     const updatedUser = await UserSchema.updateProfileByEmail(email, updateData);

//     res.status(200).json({
//       message: "Profile Added successfully",
//       user: updatedUser
//     });

//   } catch (error) {
//     console.error("Profile update error:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });
// module.exports=router;

// Profile update route using photo URL instead of file
// router.post('/profile', async (req, res) => {
//   try {
//     const { email, username, gender, city, photo } = req.body; // ✅ accept photo URL from frontend

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

//     // ✅ Just include the photo URL directly in updateData
//     const updateData = {
//       username,
//       gender,
//       city,
//       photo, // ✅ from Supabase URL sent in request body
//     };

//     const updatedUser = await UserSchema.updateProfileByEmail(email, updateData);

//     res.status(200).json({
//       message: "Profile Added successfully",
//       user: updatedUser
//     });

//   } catch (error) {
//     console.error("Profile update error:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });
// module.exports=router


// const supabase=require('./supabase.js')
// const { createClient } = require('@supabase/supabase-js');
// const express = require('express');
// const router = express.Router();
// const UserSchema = require('../models/User.js');
// const authenticate = require('../middlewares/authenticate.js');
// const multer = require('multer');
// const JWT_SECRET=process.env.JWT_SECRET
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

// router.post('/api/profile', upload.single('photo'), async (req, res) => {
//   try {
//     const { email, username, gender, city } = req.body;
//     const file = req.file;

//     if (!email || !username || !gender || !city) {
//       return res.status(400).json({ message: 'All fields are required.' });
//     }

//     let photoUrl = null;

//     if (file) {
//       // Upload image to Supabase Storage
//       const fileExt = file.originalname.split('.').pop();
//       const fileName = `profiles/${Date.now()}.${fileExt}`;
//       const { data, error: uploadError } = await supabase.storage
//         .from('eventimages')
//         .upload(fileName, file.buffer, {
//           contentType: file.mimetype,
//         });

//       if (uploadError) {
//         console.error('Supabase upload error:', uploadError);
//         return res.status(500).json({ message: 'Image upload failed.' });
//       }

//       // Get public URL
//       const { data: urlData } = supabase.storage
//         .from('eventimages')
//         .getPublicUrl(fileName);
//       photoUrl = urlData.publicUrl;
//     }
// await pool.query(
//   `INSERT INTO users (email, username, gender, city, photo) VALUES ($1, $2, $3, $4, $5)`,
//   [email, username, gender, city, photoUrl]
// );
//     // Save profile to Supabase table (or any DB you're using)
//     // const { data: insertData, error: insertError } = await supabase
//     //   .from('users')//ye tablhaa tu kar de jo naam ho
//     //   .insert([
//     //     {
//     //       email,
//     //       username,
//     //       gender,
//     //       city,
//     //       photo: photoUrl,
//     //     },
//     //   ]);

//     if (insertError) {
//       console.error('Insert error:', insertError);
//       return res.status(500).json({ message: 'Failed to save profile.' });
//     }

//     return res.status(200).json({ message: 'Profile created successfully.' });
//   } catch (error) {
//     console.error('Server error:', error);
//     return res.status(500).json({ message: 'Server error.' });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('./supabase'); // Make sure path is correct
const UserSchema = require('../models/User'); // Your Neon model

// Multer config
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }); 

router.put('/api/profile', upload.single('photo'), async (req, res) => {
  try {
    const { email, username, gender, city } = req.body;
    const file = req.file;

    if (!email || !username || !gender || !city) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    let photoUrl = null;

    // ✅ Upload to Supabase Storage
    if (file) {
      const fileExt = file.originalname.split('.').pop();
      const fileName = `profiles/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('eventimages') // or 'profileimages' if that’s the bucket
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        return res.status(500).json({ message: 'Image upload failed.' });
      }

      const { data: urlData } = supabase.storage
        .from('eventimages')
        .getPublicUrl(fileName);

      photoUrl = urlData.publicUrl;
    }

    // ✅ Insert into Neon DB using your model
    const newUser = await UserSchema.updateProfileByEmail(email,{
      username,
      gender,
      city,
      photo: photoUrl,
    });

    return res.status(200).json({
      message: 'Profile created successfully.',
      user: newUser, 
    });
  } catch (error) {
    console.error('Profile creation error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
