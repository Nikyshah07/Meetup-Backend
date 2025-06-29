
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { URL } = require("url");
const authenticate = require("../middlewares/authenticate");
const supabase = require("./supabase"); // Your Supabase client
const EventSchema=require('../models/Event');
const User=require('../models/User')
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Upload to Supabase storage and return public URL
const uploadToSupabase = async (file, folder) => {
  const ext = file.originalname.split(".").pop();
  const filename = `EventImages/${Date.now()}-${Math.random()}.${ext}`;

  const { error } = await supabase.storage
    .from("eventimages")
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) throw new Error("Upload failed: " + error.message);

  const { data } = supabase.storage.from("eventimages").getPublicUrl(filename);
  return data.publicUrl;
};

// ✅ Helper: Check valid HTTPS
const isValidHttpsUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === "https:";
  } catch (_) {
    return false;
  }
};

router.post(
  "/createEvent",
  authenticate,
  upload.fields([
    { name: "eventImages" },
    { name: "hostPhotos" },
    { name: "hostBanner" },
    { name: "hostGallery" },
  ]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      if (!req.files || !req.files.hostPhotos || req.files.hostPhotos.length === 0) {
        return res.status(400).json({
          error: ["At least one host photo is required."],
        });
      }
      const {
        event_name,
        co_host_ids,
        description,
        event_date,
        event_time,
        location,
        event_tags,
        is_virtual,
        is_free,
        ticket_price,
        host_names,
        host_instagram_urls,
        host_linkedin_urls,
        host_twitter_urls,
        duration,
        seating,
        layout,
        language,
        pet_allowance,
        age_limit,
      } = req.body;

      if (!event_name || !event_date || !event_time || !location || !description || !host_names || !event_tags) {
        return res.status(400).json({ error: "All required fields must be filled." });
      }

      const isVirtualEvent = is_virtual === "true" || is_virtual === true;

      if (isVirtualEvent && !isValidHttpsUrl(location)) {
        return res.status(400).json({ error: "Enter a valid HTTPS URL for virtual events." });
      }
if (!isVirtualEvent && isValidHttpsUrl(location)) {
  return res.status(400).json({ error: "Physical event location should not be a URL." });
}


      if (!isVirtualEvent && location.trim().length < 3) {
        return res.status(400).json({ error: "Enter a valid physical location." });
      }

      if ((is_free === "false" || is_free === false) && (!ticket_price || parseFloat(ticket_price) <= 0)) {
        return res.status(400).json({ error: "Ticket price is required for paid events." });
      }

      // Format arrays
      const hostIds = [userId, ...(JSON.parse(co_host_ids || "[]") || [])];
      const formattedTags = Array.isArray(event_tags) ? event_tags : JSON.parse(event_tags || "[]") || [];
      const formattedHostNames = JSON.parse(host_names || "[]");
const formattedInstagramUrls = JSON.parse(host_instagram_urls || "[]");
const formattedLinkedinUrls = JSON.parse(host_linkedin_urls || "[]");
const formattedTwitterUrls = JSON.parse(host_twitter_urls || "[]");

      // const formattedHostNames = Array.isArray(host_names) ? host_names : [host_names];
      // const formattedInstagramUrls = Array.isArray(host_instagram_urls) ? host_instagram_urls : [host_instagram_urls];
      // const formattedLinkedinUrls = Array.isArray(host_linkedin_urls) ? host_linkedin_urls : [host_linkedin_urls];
      // const formattedTwitterUrls = Array.isArray(host_twitter_urls) ? host_twitter_urls : [host_twitter_urls];

      // Upload images to Supabase Storage
      const processedEventImages = [];
      const processedHostPhotos = [];
      let processedHostBanner = null;
      const processedHostGallery = [];

      if (req.files?.eventImages) {
        for (const file of req.files.eventImages) {
          const url = await uploadToSupabase(file, "EventImages");
          processedEventImages.push(url);
        }
      }

      if (req.files?.hostPhotos) {
        for (const file of req.files.hostPhotos) {
          const url = await uploadToSupabase(file, "HostPhotos");
          processedHostPhotos.push(url);
        }
      }

      if (req.files?.hostBanner?.[0]) {
        processedHostBanner = await uploadToSupabase(req.files.hostBanner[0], "HostBanner");
      }

      if (req.files?.hostGallery) {
        for (const file of req.files.hostGallery) {
          const url = await uploadToSupabase(file, "HostGallery");
          processedHostGallery.push(url);
        }
      }

    

      // ✅ Insert event in Neon (PostgreSQL)
const insertedEvent = await EventSchema.create({
  event_name,
  host_ids: hostIds,
  description,
  event_date,
  event_time,
  location,
  event_tags: formattedTags,
  is_virtual: isVirtualEvent,
  is_free: is_free === "true" || is_free === true,
  ticket_price: is_free === "true" || is_free === true ? 0 : parseFloat(ticket_price) || 0,
  host_names: formattedHostNames,
  host_photos: processedHostPhotos,
  host_banner: processedHostBanner,
  host_gallery: processedHostGallery,
  event_images: processedEventImages, 
  host_instagram_urls: formattedInstagramUrls,
  host_linkedin_urls: formattedLinkedinUrls,
  host_twitter_urls: formattedTwitterUrls,
  duration: duration || null,
  seating: seating || null,
  layout: layout || null,
  language: language || null,
  pet_allowance: pet_allowance || null,
  age_limit: age_limit || null,
  comments: [],
  total_comments: 0,
  is_comment: false,
  likes: [],
  total_likes: 0,
});


      // if (error) {
      //   console.error("Insert event error:", error);
      //   return res.status(500).json({ error: "Failed to insert event into Supabase." });
      // }

      return res.status(201).json({
        message: "Event created successfully",
        event: insertedEvent,
      });
    } catch (error) {
      console.error("Event creation error:", error);
      return res.status(500).json({ error: "Server error", details: error.message });
    }
  }
);

module.exports = router;


// Like an event
router.post("/likeEvent/:eventId", authenticate, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const userId = req.user.id;

    // Check if event exists
    const event = await EventSchema.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if user already liked the event
    const likes = event.likes || [];
    if (likes.includes(userId)) {
      return res
        .status(400)
        .json({ error: "You have already liked this event" });
    }

    // Add user ID to likes array
    const newLikes = [...likes, userId]; // ✅ new array
    const updatedEvent = await EventSchema.update(eventId, {
      likes: newLikes,
      total_likes: newLikes.length, // ✅ added this line
    });

    res.status(200).json({
      message: "Event liked successfully",
      total_likes: updatedEvent.total_likes,
      is_liked: true,
    });
  } catch (error) {
    console.error("Error liking event:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Unlike an event
router.post("/unlikeEvent/:eventId", authenticate, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const userId = req.user.id;

    // Check if event exists
    const event = await EventSchema.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if user has liked the event
    const likes = event.likes || [];
    if (!likes.includes(userId)) {
      return res
        .status(400)
        .json({ error: "You haven't liked this event yet" });
    }

   
    const updatedLikes = likes.filter((id) => id !== userId);
    const updatedEvent = await EventSchema.update(eventId, {
      likes: updatedLikes,
      total_likes: updatedLikes.length,
    });

    res.status(200).json({
      message: "Event unliked successfully",
      total_likes: updatedEvent.total_likes,
      is_liked: false,
    });
  } catch (error) {
    console.error("Error unliking event:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get likes for an event
router.get("/getLikes/:eventId", async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);

    // Check if event exists
    const event = await EventSchema.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const likes = event.likes || [];

    // Get user details for each like
    const likeDetails = await Promise.all(
      likes.map(async (userId) => {
        try {
          const user = await User.findById(userId);
          if (user) {
            return {
              id: user.id || user._id,
              username: user.username,
              email: user.email,
             photo: user.photo 
            };
          }
          return null;
        } catch (err) {
          console.error(`Error fetching user ${userId}:`, err);
          return null;
        }
      })
    );

    // Filter out null values (users that couldn't be found)
    const validLikes = likeDetails.filter((like) => like !== null);

    res.status(200).json({
      event_id: eventId,
      total_likes: event.total_likes,

      likes: validLikes,
    });
  } catch (error) {
    console.error("Error getting event likes:", error);
    res.status(500).json({ error: "Server error" });
  }
});



router.post("/addComment/:eventId", authenticate, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const userId = req.user.id;

    // Debug log (optional)
    console.log("Incoming body:", req.body);

    const comment_text = req.body?.comment_text;

    // Validate comment
    if (typeof comment_text !== 'string' || comment_text.trim() === '') {
      return res.status(400).json({ error: "Comment text is required" });
    }

    if (comment_text.length > 500) {
      return res.status(400).json({ error: "Comment must be less than 500 characters" });
    }

    // Check if event exists
    const event = await EventSchema.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Add comment
    const updatedEvent = await EventSchema.addComment(
      eventId,
      userId,
      comment_text.trim()
    );

    res.status(200).json({
      message: "Comment added successfully",
      total_comments: updatedEvent.total_comments,
      is_comment: updatedEvent.is_comment,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Replace your existing removeComment route with:
router.post("/removeComment/:eventId/:commentId", authenticate, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const commentId = parseInt(req.params.commentId);
    const userId = req.user.id;

    // Check if event exists
    const event = await EventSchema.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if comment exists and belongs to user
    // const comments = event.comments || [];
    // const commentExists = comments.some(comment => 
    //   comment.id === commentId && comment.user_id === userId
    // );

    // if (!commentExists) {
    //   return res.status(400).json({ error: "Comment not found or you don't have permission to delete it" });
    // }

    const comments = Array.isArray(event.comments)
  ? event.comments
  : JSON.parse(event.comments || '[]');

const comment = comments.find(comment => comment.id === commentId);

if (!comment) {
  return res.status(404).json({ error: "Comment not found" });
}

if (comment.user_id !== userId) {
  return res.status(403).json({ error: "You don't have permission to delete this comment" });
}

    // Remove comment
    const updatedEvent = await EventSchema.removeComment(eventId, commentId, userId);

    res.status(200).json({
      message: "Comment removed successfully",
      total_comments: updatedEvent.total_comments,
      is_comment: updatedEvent.is_comment,
    });
  } catch (error) {
    console.error("Error removing comment:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Replace your existing getComments route with:
router.get("/getComments/:eventId", async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);

    // Check if event exists
    const event = await EventSchema.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // const comments = event.comments || [];
    const comments = Array.isArray(event.comments)
  ? event.comments
  : JSON.parse(event.comments || '[]');

    // Get user details for each comment
    const commentDetails = await Promise.all(
      comments.map(async (comment) => {
        try {
          const user = await User.findById(comment.user_id);
          if (user) {
            return {
              id: comment.id,
              comment_text: comment.comment_text,
              created_at: comment.created_at,
              user: {
                id: user.id || user._id,
                username: user.username,
                email: user.email,
                 photo: user.photo || null, 
              }
            };
          }
          return null;
        } catch (err) {
          console.error(`Error fetching user ${comment.user_id}:`, err);
          return null;
        }
      })
    );

    // Filter out null values and sort by creation date
    const validComments = commentDetails
      .filter((comment) => comment !== null)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.status(200).json({
      event_id: eventId,
      total_comments: event.total_comments,
      is_comment: event.is_comment,
      comments: validComments,
    });
  } catch (error) {
    console.error("Error getting event comments:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/getEvent/:id", async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await EventSchema.findByIdWithHostDetails(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const likes = event.likes || [];
    const comments = event.comments || [];

    const formattedEvent = {
      ...event,

      event_images: event.event_images?.map((img, index) => ({
        id: index,
        url: img
      })) || [],

      host_photos: event.host_photos?.map((img, index) => ({
        id: index,
        url: img
      })) || [],

      host_banner: event.host_banner
        ? { url: event.host_banner }
        : null,

      host_gallery: event.host_gallery?.map((img, index) => ({
        id: index,
        url: img
      })) || [],

      total_likes: event.total_likes || likes.length,
      is_liked: false,
      total_comments: event.total_comments || comments.length,
      is_comment: event.is_comment || (comments.length > 0),
    };

    res.status(200).json(formattedEvent);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// router.get("/getEvent", async (req, res) => {
//   try {
//     const limit = parseInt(req.query.limit) || 10;
//     const page = parseInt(req.query.page) || 1;
//     const offset = (page - 1) * limit;

//     let currentUserId = null;
//     try {
//       const token = req.headers.authorization?.replace('Bearer ', '');
//       if (token) {
//         const jwt = require('jsonwebtoken');
//         const decoded = jwt.verify(token, process.env.JWT_SECRET || 'abcde');
//         currentUserId = decoded.id;
//       }
//     } catch (err) {
//       console.log('No valid auth token provided');
//     }

//     const events = await EventSchema.findAll();

//     const paginatedEvents = await Promise.all(
//       events
//         .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
//         .slice(offset, offset + limit)
//         .map(async (event) => {
//           const creatorId = event.host_ids?.[0];
//           let creator = null;

//           if (creatorId) {
//             const userResult = await User.findById(creatorId);
//             if (userResult) {
//               creator = {
//                 _id: userResult._id || userResult.id,
//                 username: userResult.username,
//                 email: userResult.email,
//                 photo: userResult.photo,
//               };
//             }
//           }

//           const likes = event.likes || [];
//           const isLiked = currentUserId ? likes.includes(currentUserId) : false;
//           const comments = event.comments || [];

//           return {
//             ...event,
//             event_images: event.event_images?.map((img, index) => ({
//               id: index,
//               url: img
//             })) || [],

//             host_social: {
//               photos: event.host_photos?.map((img, index) => ({
//                 id: index,
//                 url: img
//               })) || [],
//               instagram_urls: event.host_instagram_urls || [],
//               linkedin_urls: event.host_linkedin_urls || [],
//               twitter_urls: event.host_twitter_urls || [],
//               host_names: event.host_names || [],
//             },

//             host_banner: event.host_banner
//               ? { url: event.host_banner }
//               : null,

//             host_gallery: event.host_gallery?.map((img, index) => ({
//               id: index,
//               url: img
//             })) || [],

//             created_by: creator
//               ? {
//                   id: creator._id,
//                   username: creator.username,
//                   email: creator.email,
//                   photo: creator.photo || null,
//                 }
//               : null,

//             total_likes: event.total_likes || likes.length,
//             is_liked: isLiked,
//             total_comments: event.total_comments || comments.length,
//             is_comment: event.is_comment || (comments.length > 0),
//           };
//         })
//     );

//     res.status(200).json(paginatedEvents);
//   } catch (error) {
//     console.error("Error fetching events:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });
router.get("/getEvent", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    let currentUserId = null;
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'abcde');
        currentUserId = decoded.id;
      }
    } catch (err) {
      console.log('No valid auth token provided');
    }

    const events = await EventSchema.findAll();
    
    // Get today's date at start of day (00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter events to include only today and future events
    const futureEvents = events.filter(event => {
      const eventDate = new Date(event.event_date);
      eventDate.setHours(0, 0, 0, 0); // Set to start of day for comparison
      return eventDate >= today;
    });

    console.log(`Total events: ${events.length}`);
    console.log(`Future events: ${futureEvents.length}`);
    console.log('Future event IDs:', futureEvents.map(e => e.id));

    const paginatedEvents = await Promise.all(
      futureEvents
        .sort((a, b) => {
          // Sort by date first, then by time
          const dateA = new Date(a.event_date);
          const dateB = new Date(b.event_date);
          
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
          }
          
          // If dates are same, sort by time
          if (a.event_time && b.event_time) {
            return a.event_time.localeCompare(b.event_time);
          }
          
          return 0;
        })
        .slice(offset, offset + limit)
        .map(async (event) => {
          const creatorId = event.host_ids?.[0];
          let creator = null;

          if (creatorId) {
            const userResult = await User.findById(creatorId);
            if (userResult) {
              creator = {
                _id: userResult._id || userResult.id,
                username: userResult.username,
                email: userResult.email,
                photo: userResult.photo,
              };
            }
          }

          const likes = event.likes || [];
          const isLiked = currentUserId ? likes.includes(currentUserId) : false;
          const comments = event.comments || [];

          return {
            ...event,
            event_images: event.event_images?.map((img, index) => ({
              id: index,
              url: img
            })) || [],

            host_social: {
              photos: event.host_photos?.map((img, index) => ({
                id: index,
                url: img
              })) || [],
              instagram_urls: event.host_instagram_urls || [],
              linkedin_urls: event.host_linkedin_urls || [],
              twitter_urls: event.host_twitter_urls || [],
              host_names: event.host_names || [],
            },

            host_banner: event.host_banner
              ? { url: event.host_banner }
              : null,

            host_gallery: event.host_gallery?.map((img, index) => ({
              id: index,
              url: img
            })) || [],

            created_by: creator
              ? {
                  id: creator._id,
                  username: creator.username,
                  email: creator.email,
                  photo: creator.photo || null,
                }
              : null,

            total_likes: event.total_likes || likes.length,
            is_liked: isLiked,
            total_comments: event.total_comments || comments.length,
            is_comment: event.is_comment || (comments.length > 0),
          };
        })
    );

    res.status(200).json(paginatedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Server error" });
  }
});
router.get("/myEvents", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const allEvents = await EventSchema.findAll();

    const userEvents = allEvents.filter(event =>
      Array.isArray(event.host_ids) && event.host_ids.includes(userId)
    );

    const formattedEvents = userEvents.map((event) => {
      return {
        ...event,
        event_images: event.event_images?.map((img, index) => ({
          id: index,
          url: img,
        })) || [],
        host_photos: event.host_photos?.map((img, index) => ({
          id: index,
          url: img,
        })) || [],
        host_banner: event.host_banner ? { url: event.host_banner } : null,
        host_gallery: event.host_gallery?.map((img, index) => ({
          id: index,
          url: img,
        })) || [],
        total_likes: event.total_likes || (event.likes || []).length,
        total_comments: event.total_comments || (event.comments || []).length,
        is_comment: event.is_comment || (event.comments || []).length > 0,
      };
    });

    res.status(200).json(formattedEvents);
  } catch (error) {
    console.error("Error fetching user-specific events:", error);
    res.status(500).json({ error: "Server error" });
  }
});


router.post('/saveEvent/:eventId', authenticate, async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  const userId = req.user.id;

  try {
    const event = await EventSchema.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const savedBy = event.saved_by || [];
    let updatedSavedBy;

    if (savedBy.includes(userId)) {
      // User already saved - remove (unsave)
      updatedSavedBy = savedBy.filter(id => id !== userId);
    } else {
      // Save event
      updatedSavedBy = [...savedBy, userId];
    }

    const updatedEvent = await EventSchema.update(eventId, {
      saved_by: updatedSavedBy,
    });
 const isLiked = event.likes?.includes(userId);
    return res.status(200).json({
      success: true,
      message: savedBy.includes(userId) ? 'Event unsaved' : 'Event saved',
      event:{...updatedEvent, is_liked: isLiked}
    });
  } catch (err) {
    console.error('Error saving event:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});
router.get('/getSavedEvents', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    const allEvents = await EventSchema.findAll();

    const savedEvents = allEvents.filter(event =>
      Array.isArray(event.saved_by) && event.saved_by.includes(userId)
    );

    const formattedEvents = savedEvents.map(event => {
      const isLiked = event.likes?.includes(userId);

      return {
        ...event,
        is_liked: isLiked || false,
        event_images: event.event_images?.map((img, index) => ({
          id: index,
          url: img
        })) || [],
        host_photos: event.host_photos?.map((img, index) => ({
          id: index,
          url: img
        })) || [],
        host_banner: event.host_banner ? { url: event.host_banner } : null,
        host_gallery: event.host_gallery?.map((img, index) => ({
          id: index,
          url: img
        })) || [],
        total_likes: event.total_likes || (event.likes || []).length,
        total_comments: event.total_comments || (event.comments || []).length,
        is_comment: event.is_comment || (event.comments || []).length > 0,
      };
    });

    res.status(200).json({ success: true, saved_events: formattedEvents });
  } catch (err) {
    console.error('Error fetching saved events:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// router.get("/featuredEvents", authenticate, async (req, res) => {
//   try {
//     const currentUserId = req.user?.id;

//     // Step 1: Get today's date at 00:00
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     // Step 2: Get all events from database
//     const allEvents = await EventSchema.findAll();

//     // Step 3: Filter events that are today or in future
//     const futureEvents = allEvents.filter(event => {
//       const eventDate = new Date(event.event_date);
//       return eventDate >= today;
//     });

//     if (futureEvents.length === 0) {
//       return res.status(200).json({ success: true, featured_events: [] });
//     }

//     // Step 4: Find max likes among future events
//     const maxLikes = Math.max(...futureEvents.map(event => event.total_likes || 0));

//     // Step 5: Filter events that have the max likes
//     const featuredEvents = futureEvents.filter(event => (event.total_likes || 0) === maxLikes);

//     // Step 6: Format response
//     const formatted = featuredEvents.map(event => {
//       const isLiked = Array.isArray(event.likes) && event.likes.includes(currentUserId);
//       return {
//         ...event,
//         is_liked: isLiked,
//         event_images: event.event_images?.map((img, i) => ({ id: i, url: img })) || [],
//         host_photos: event.host_photos?.map((img, i) => ({ id: i, url: img })) || [],
//         host_banner: event.host_banner ? { url: event.host_banner } : null,
//         host_gallery: event.host_gallery?.map((img, i) => ({ id: i, url: img })) || [],
//         total_likes: event.total_likes || 0,
//         total_comments: event.total_comments || 0,
//         is_comment: event.is_comment || false,
//       };
//     });

//     res.status(200).json({ success: true, featured_events: formatted });

//   } catch (err) {
//     console.error("Error in featured events:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });


router.get("/featuredEvents", authenticate, async (req, res) => {
  try {
    const currentUserId = req.user?.id;

    // Step 1: Get today's date at 00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Step 2: Get all events from database
    const allEvents = await EventSchema.findAll();

    // Step 3: Filter events that are today or in future
    const futureEvents = allEvents.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate >= today;
    });

    if (futureEvents.length === 0) {
      return res.status(200).json({ success: true, featured_events: [] });
    }

    // ✅ Step 4: Sort future events by total_likes in descending order
    const sortedByLikes = [...futureEvents].sort((a, b) => (b.total_likes || 0) - (a.total_likes || 0));

    // ✅ Step 5: Pick top 5 most liked events
    const featuredEvents = sortedByLikes.slice(0, 5);

    // Step 6: Format response
    const formatted = featuredEvents.map(event => {
      const isLiked = Array.isArray(event.likes) && event.likes.includes(currentUserId);
      return {
        ...event,
        is_liked: isLiked,
        event_images: event.event_images?.map((img, i) => ({ id: i, url: img })) || [],
        host_photos: event.host_photos?.map((img, i) => ({ id: i, url: img })) || [],
        host_banner: event.host_banner ? { url: event.host_banner } : null,
        host_gallery: event.host_gallery?.map((img, i) => ({ id: i, url: img })) || [],
        total_likes: event.total_likes || 0,
        total_comments: event.total_comments || 0,
        is_comment: event.is_comment || false,
      };
    });

    res.status(200).json({ success: true, featured_events: formatted });

  } catch (err) {
    console.error("Error in featured events:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// router.get("/pastFeaturedEvents", authenticate, async (req, res) => {
//   try {
//     const currentUserId = req.user?.id;

//     // Step 1: Get today's date at 00:00
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     // Step 2: Get all events
//     const allEvents = await EventSchema.findAll();

//     // Step 3: Filter only past events (event_date < today)
//     const pastEvents = allEvents.filter(event => {
//       const eventDate = new Date(event.event_date);
//       return eventDate < today;
//     });

//     if (pastEvents.length === 0) {
//       return res.status(200).json({ success: true, past_featured_events: [] });
//     }

//     // Step 4: Find highest like count among past events
//     const maxLikes = Math.max(...pastEvents.map(event => event.total_likes || 0));

//     // Step 5: Filter only events that have the highest like count
//     const featuredPastEvents = pastEvents.filter(event => (event.total_likes || 0) === maxLikes);

//     // Step 6: Format response
//     const formatted = featuredPastEvents.map(event => {
//       const isLiked = Array.isArray(event.likes) && event.likes.includes(currentUserId);
//       return {
//         ...event,
//         is_liked: isLiked,
//         event_images: event.event_images?.map((img, i) => ({ id: i, url: img })) || [],
//         host_photos: event.host_photos?.map((img, i) => ({ id: i, url: img })) || [],
//         host_banner: event.host_banner ? { url: event.host_banner } : null,
//         host_gallery: event.host_gallery?.map((img, i) => ({ id: i, url: img })) || [],
//         total_likes: event.total_likes || 0,
//         total_comments: event.total_comments || 0,
//         is_comment: event.is_comment || false,
//       };
//     });

//     res.status(200).json({ success: true, past_featured_events: formatted });

//   } catch (err) {
//     console.error("Error in past featured events:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });



router.get("/pastFeaturedEvents", authenticate, async (req, res) => {
  try {
    const currentUserId = req.user?.id;

    // Step 1: Get today's date at 00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Step 2: Get all events
    const allEvents = await EventSchema.findAll();

    // Step 3: Filter only past events (event_date < today)
    const pastEvents = allEvents.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate < today;
    });

    if (pastEvents.length === 0) {
      return res.status(200).json({ success: true, past_featured_events: [] });
    }

    // ✅ Step 4: Skip like filtering — return all past events directly
    const featuredPastEvents = pastEvents;

    // Step 5: Format response
    const formatted = featuredPastEvents.map(event => {
      const isLiked = Array.isArray(event.likes) && event.likes.includes(currentUserId);
      return {
        ...event,
        is_liked: isLiked,
        event_images: event.event_images?.map((img, i) => ({ id: i, url: img })) || [],
        host_photos: event.host_photos?.map((img, i) => ({ id: i, url: img })) || [],
        host_banner: event.host_banner ? { url: event.host_banner } : null,
        host_gallery: event.host_gallery?.map((img, i) => ({ id: i, url: img })) || [],
        total_likes: event.total_likes || 0,
        total_comments: event.total_comments || 0,
        is_comment: event.is_comment || false,
      };
    });

    res.status(200).json({ success: true, past_featured_events: formatted });

  } catch (err) {
    console.error("Error in past featured events:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});





// DELETE /deleteEvent/:id
router.delete("/deleteEvent/:id", authenticate, async (req, res) => {
  const eventId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    // 1. Check if event exists
    const event = await EventSchema.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    // 2. Check if user is in host_ids
    if (!event.host_ids.includes(userId)) {
      return res.status(403).json({ success: false, message: "You are not authorized to delete this event" });
    }

    // 3. Delete the event
    await EventSchema.delete(eventId);

    return res.status(200).json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});




module.exports=router