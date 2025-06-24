// const express = require("express");
// const router = express.Router();
// const EventSchema = require("../models/Event.js");
// const authenticate = require("../middlewares/authenticate.js");
// const multer = require("multer");
// const User = require("../models/User.js");
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//   fileFilter: (req, file, cb) => {
//     // Accept images only
//     if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
//       return cb(new Error("Only image files are allowed!"), false);
//     }
//     cb(null, true);
//   },
// });

// // Helper function to validate HTTPS URLs
// const isValidHttpsUrl = (string) => {
//   try {
//     const url = new URL(string);
//     return url.protocol === "https:";
//   } catch (_) {
//     return false;
//   }
// };

// // Create new event
// router.post(
//   "/createEvent",
//   authenticate,
//   upload.fields([
//     { name: "eventImages", maxCount: 4 },
//     { name: "hostPhotos", maxCount: 5 },
//     { name: "hostBanner", maxCount: 1 }, // Single banner image
//     { name: "hostGallery", maxCount: 10 }, // Multiple gallery images
//   ]),
//   async (req, res) => {
//     try {
//       const userId = req.user.id;
//       const {
//         event_name,
//         co_host_ids,
//         description,
//         event_date,
//         event_time,

//         // Simple location string or URL based on is_virtual
//         location,

//         event_tags,
//         is_virtual,
//         is_free,
//         ticket_price,

//         // Host Details Arrays
//         host_names,
//         host_instagram_urls,
//         host_linkedin_urls,
//         host_twitter_urls,

//         // Additional Details
//         duration,
//         seating,
//         layout,
//         language,
//         pet_allowance,
//         age_limit,
//       } = req.body;
//       const isVirtualEvent = is_virtual === "true" || is_virtual === true;
//       // const isFreeEvent = is_free === "true" || is_free === true;
      
//       if (!req.files || !req.files.eventImages || req.files.eventImages.length === 0) {
//         return res.status(400).json({
//           errors: ["At least one event image is required."],
//         });
//       }
      
//       // Basic validation
//       if (!event_name) {
//         return res.status(400).json({ errors: ["Event name is required."] });
//       }

//       if (!event_date) {
//         return res.status(400).json({ errors: ["Event date is required."] });
//       }

//       if (!event_time) {
//         return res.status(400).json({ errors: ["Event time is required."] });
//       }

//       if (!location || location.trim() === "") {
//         return res.status(400).json({
//           // error: isVirtualEvent ? "Virtual events require a valid HTTPS URL" : "Offline events require a location"
//           errors: isVirtualEvent
//             ? "Event URL is required for online events."
//             : "Physical location is required for offline events.",
//         });
//       }
//       if (!event_tags) {
//         return res.status(400).json({ errors: ["Event tags is required."] });
//       }
//       if ((is_free === "false" || is_free === false) && (!ticket_price || parseFloat(ticket_price) <= 0)) {
//         return res.status(400).json({
//           errors: ["Ticket price is required for paid events."],
//         });
//       }

//       if (!description.trim()) {
//         return res.status(400).json({ errors: ["Description is required."] });
//       }

//       // if (
//       //   !req.files ||
//       //   !req.files.hostPhotos ||
//       //   req.files.hostPhotos.length === 0
//       // ) {
//       //   return res
//       //     .status(400)
//       //     .json({ errors: ["At least one host photo is required."] });
//       // }
//       if (!host_names || !host_names.length) {
//         return res
//           .status(400)
//           .json({ errors: ["At least one host name is required."] });
//       }

   
//       // Process location based on is_virtual flag

//       // Validate location based on event type
//       if (isVirtualEvent) {
//         // For virtual events, location should be a valid HTTPS URL
//         if (!isValidHttpsUrl(location)) {
//           return res.status(400).json({
//             error: "Please enter a valid HTTPS URL for virtual events",
//           });
//         }
//       } else {
//         // For offline events, just ensure location is not empty (any string is valid)
//         if (location.trim().length < 3) {
//           return res.status(400).json({
//             error: "Please enter a valid location for offline events",
//           });
//         }
//       }

//       // Format host IDs array
//       let hostIds = [userId];
//       if (co_host_ids) {
//         if (typeof co_host_ids === "string") {
//           try {
//             const parsedCoHosts = JSON.parse(co_host_ids);
//             if (Array.isArray(parsedCoHosts)) {
//               hostIds = [...hostIds, ...parsedCoHosts];
//             }
//           } catch (e) {
//             const coHostId = parseInt(co_host_ids);
//             if (!isNaN(coHostId)) {
//               hostIds.push(coHostId);
//             }
//           }
//         } else if (Array.isArray(co_host_ids)) {
//           hostIds = [
//             ...hostIds,
//             ...co_host_ids.map((id) => parseInt(id)).filter((id) => !isNaN(id)),
//           ];
//         }
//       }

//       // Format tags array
//       let formattedTags = [];
//       if (event_tags) {
//         if (typeof event_tags === "string") {
//           try {
//             const parsedTags = JSON.parse(event_tags);
//             if (Array.isArray(parsedTags)) {
//               formattedTags = parsedTags;
//             } else {
//               formattedTags = event_tags.split(",").map((tag) => tag.trim());
//             }
//           } catch (e) {
//             formattedTags = event_tags.split(",").map((tag) => tag.trim());
//           }
//         } else if (Array.isArray(event_tags)) {
//           formattedTags = event_tags;
//         }
//       }

//       // Format host details arrays
//       let formattedHostNames = [];
//       let formattedInstagramUrls = [];
//       let formattedLinkedinUrls = [];
//       let formattedTwitterUrls = [];

//       if (host_names) {
//         formattedHostNames = Array.isArray(host_names)
//           ? host_names
//           : [host_names];
//       }

//       if (host_instagram_urls) {
//         formattedInstagramUrls = Array.isArray(host_instagram_urls)
//           ? host_instagram_urls
//           : [host_instagram_urls];
//       }

//       if (host_linkedin_urls) {
//         formattedLinkedinUrls = Array.isArray(host_linkedin_urls)
//           ? host_linkedin_urls
//           : [host_linkedin_urls];
//       }

//       if (host_twitter_urls) {
//         formattedTwitterUrls = Array.isArray(host_twitter_urls)
//           ? host_twitter_urls
//           : [host_twitter_urls];
//       }

//       // Create event object
//       const eventData = {
//         event_name,
//         host_ids: hostIds,
//         description,
//         event_date,
//         event_time,
//         location: location.trim(), // Simple string field
//         event_tags: formattedTags,
//         is_virtual: isVirtualEvent,
//         is_free: is_free === "true" || is_free === true,
//         ticket_price:
//           is_free === "true" || is_free === true
//             ? 0
//             : parseFloat(ticket_price) || 0,

//         // Host Details
//         host_names: formattedHostNames,
//         host_instagram_urls: formattedInstagramUrls,
//         host_linkedin_urls: formattedLinkedinUrls,
//         host_twitter_urls: formattedTwitterUrls,

//         // Additional Details
//         duration: duration || null,
//         seating: seating || null,
//         layout: layout || null,
//         language: language || null,
//         pet_allowance: pet_allowance || null,
//         age_limit: age_limit || null,
//       };

//       // Create the event
//       const event = await EventSchema.create(eventData);

//       // Process uploaded files
//       if (req.files) {
//         console.log("Files received:", Object.keys(req.files)); // Debug log

//         // Process event images
//         if (req.files.eventImages && req.files.eventImages.length > 0) {
//           console.log("Processing event images:", req.files.eventImages.length); // Debug log
//           for (const file of req.files.eventImages) {
//             await EventSchema.addEventImage(event.id, file.buffer);
//           }
//         }

//         // Process host photos
//         if (req.files.hostPhotos && req.files.hostPhotos.length > 0) {
//           console.log("Processing host photos:", req.files.hostPhotos.length); // Debug log
//           for (const file of req.files.hostPhotos) {
//             await EventSchema.addHostPhoto(event.id, file.buffer);
//           }
//         }

//         // Process host banner (single image)
//         if (req.files.hostBanner && req.files.hostBanner.length > 0) {
//           console.log("Processing host banner"); // Debug log
//           await EventSchema.setHostBanner(
//             event.id,
//             req.files.hostBanner[0].buffer
//           );
//         }

//         // Process host gallery (multiple images)
//         if (req.files.hostGallery && req.files.hostGallery.length > 0) {
//           console.log("Processing host gallery:", req.files.hostGallery.length); // Debug log
//           for (const file of req.files.hostGallery) {
//             await EventSchema.addHostGalleryImage(event.id, file.buffer);
//           }
//         }
//       } else {
//         console.log("No files received in request"); // Debug log
//       }

//       // Get the created event with host details
//       const createdEvent = await EventSchema.findByIdWithHostDetails(event.id);

//       // Format response with actual image URLs
//       const responseEvent = {
//         ...createdEvent,

//         // Return actual image data or Base64 URLs for frontend use
//         event_images: createdEvent.event_images
//           ? createdEvent.event_images.map((img, index) => ({
//               id: index,
//               url: `data:image/jpeg;base64,${img.toString("base64")}`,
//             }))
//           : [],

//         host_photos: createdEvent.host_photos
//           ? createdEvent.host_photos.map((img, index) => ({
//               id: index,
//               url: `data:image/jpeg;base64,${img.toString("base64")}`,
//             }))
//           : [],

//         host_banner: createdEvent.host_banner
//           ? {
//               url: `data:image/jpeg;base64,${createdEvent.host_banner.toString(
//                 "base64"
//               )}`,
//             }
//           : null,

//         host_gallery: createdEvent.host_gallery
//           ? createdEvent.host_gallery.map((img, index) => ({
//               id: index,
//               url: `data:image/jpeg;base64,${img.toString("base64")}`,
//             }))
//           : [],
//       };

//       res.status(201).json({
//         message: "Event created successfully",
//         event: responseEvent,
//       });
//     } catch (error) {
//       console.error("Event creation error:", error);
//       res.status(500).json({ error: "Server error", details: error.message });
//     }
//   }
// );

// router.get("/getEvent", async (req, res) => {
//   try {
//     const limit = parseInt(req.query.limit) || 10;
//     const page = parseInt(req.query.page) || 1;
//     const offset = (page - 1) * limit;

//     const events = await EventSchema.findAll();

//     const paginatedEvents = await Promise.all(
//       events
//         .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
//         .slice(offset, offset + limit)
//         .map(async (event) => {
//           const creatorId = event.host_ids?.[0]; // primary host
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

//           const {
//             host_photos,
//             host_instagram_urls,
//             host_linkedin_urls,
//             host_twitter_urls,
//             host_names,
//             ...eventData
//           } = event;

//           return {
//             ...eventData,
//             event_images:
//               event.event_images && event.event_images.length > 0
//                 ? event.event_images.map((img, index) => ({
//                     id: index,
//                     url: `data:image/jpeg;base64,${img.toString("base64")}`,
//                   }))
//                 : [],

//             host_social: {
//               photos:
//                 event.host_photos && event.host_photos.length > 0
//                   ? event.host_photos.map((img, index) => ({
//                       id: index,
//                       url: `data:image/jpeg;base64,${img.toString("base64")}`,
//                     }))
//                   : [],

//               instagram_urls: event.host_instagram_urls || [],
//               linkedin_urls: event.host_linkedin_urls || [],
//               twitter_urls: event.host_twitter_urls || [],
//               host_names: event.host_names || [],
//             },

//             host_banner: event.host_banner
//               ? {
//                   url: `data:image/jpeg;base64,${event.host_banner.toString(
//                     "base64"
//                   )}`,
//                 }
//               : null,

//             host_gallery:
//               event.host_gallery && event.host_gallery.length > 0
//                 ? event.host_gallery.map((img, index) => ({
//                     id: index,
//                     url: `data:image/jpeg;base64,${img.toString("base64")}`,
//                   }))
//                 : [],

//             created_by: creator
//               ? {
//                   id: creator._id,
//                   username: creator.username,
//                   email: creator.email,
//                   // photo: creator.photo
//                   photo: creator.photo
//                     ? `data:image/jpeg;base64,${creator.photo.toString(
//                         "base64"
//                       )}`
//                     : null,
//                 }
//               : null,
//           };
//         })
//     );

//     console.log("Decoded user info:", req.user);

//     res.status(200).json(paginatedEvents);
//   } catch (error) {
//     console.error("Error fetching events:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // Get single event by ID with host details
// router.get("/getEvent/:id", async (req, res) => {
//   try {
//     const eventId = req.params.id;
//     const event = await EventSchema.findByIdWithHostDetails(eventId);

//     if (!event) {
//       return res.status(404).json({ error: "Event not found" });
//     }

//     // Format event for response with actual image URLs
//     const formattedEvent = {
//       ...event,
//       event_images: event.event_images
//         ? event.event_images.map((img, index) => ({
//             id: index,
//             url: `data:image/jpeg;base64,${img.toString("base64")}`,
//           }))
//         : [],

//       host_photos: event.host_photos
//         ? event.host_photos.map((img, index) => ({
//             id: index,
//             url: `data:image/jpeg;base64,${img.toString("base64")}`,
//           }))
//         : [],

//       host_banner: event.host_banner
//         ? {
//             url: `data:image/jpeg;base64,${event.host_banner.toString(
//               "base64"
//             )}`,
//           }
//         : null,

//       host_gallery: event.host_gallery
//         ? event.host_gallery.map((img, index) => ({
//             id: index,
//             url: `data:image/jpeg;base64,${img.toString("base64")}`,
//           }))
//         : [],
//     };

//     res.status(200).json(formattedEvent);
//   } catch (error) {
//     console.error("Error fetching event:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // Update event

// module.exports = router;



const express = require("express");
const router = express.Router();
const EventSchema = require("../models/Event.js");
const authenticate = require("../middlewares/authenticate.js");
const multer = require("multer");
const User = require("../models/User.js");
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

// Helper function to validate HTTPS URLs
const isValidHttpsUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === "https:";
  } catch (_) {
    return false;
  }
};

// Create new event
router.post(
  "/createEvent",
  authenticate,
  upload.fields([
    { name: "eventImages", maxCount: 4 },
    { name: "hostPhotos", maxCount: 5 },
    { name: "hostBanner", maxCount: 1 },
    { name: "hostGallery", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const userId = req.user.id;
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
      
      const isVirtualEvent = is_virtual === "true" || is_virtual === true;
      
      // if (!req.files || !req.files.eventImages || req.files.eventImages.length === 0) {
      //   return res.status(400).json({
      //     errors: ["At least one event image is required."],
      //   });
      // }
      
      // Basic validation (keeping your existing validation logic)
      if (!event_name) {
        return res.status(400).json({ errors: ["Event name is required."] });
      }

      if (!event_date) {
        return res.status(400).json({ errors: ["Event date is required."] });
      }

      if (!event_time) {
        return res.status(400).json({ errors: ["Event time is required."] });
      }

      if (!location || location.trim() === "") {
        return res.status(400).json({
          errors: isVirtualEvent
            ? "Event URL is required for online events."
            : "Physical location is required for offline events.",
        });
      }

      if (!event_tags) {
        return res.status(400).json({ errors: ["Event tags is required."] });
      }

      if ((is_free === "false" || is_free === false) && (!ticket_price || parseFloat(ticket_price) <= 0)) {
        return res.status(400).json({
          errors: ["Ticket price is required for paid events."],
        });
      }

      if (!description.trim()) {
        return res.status(400).json({ errors: ["Description is required."] });
      }

      if (!host_names || !host_names.length) {
        return res
          .status(400)
          .json({ errors: ["At least one host name is required."] });
      }

      // Validate location based on event type
      if (isVirtualEvent) {
        if (!isValidHttpsUrl(location)) {
          return res.status(400).json({
            error: "Please enter a valid HTTPS URL for virtual events",
          });
        }
      } else {
        if (location.trim().length < 3) {
          return res.status(400).json({
            error: "Please enter a valid location for offline events",
          });
        }
      }

      // Format host IDs array
      let hostIds = [userId];
      if (co_host_ids) {
        if (typeof co_host_ids === "string") {
          try {
            const parsedCoHosts = JSON.parse(co_host_ids);
            if (Array.isArray(parsedCoHosts)) {
              hostIds = [...hostIds, ...parsedCoHosts];
            }
          } catch (e) {
            const coHostId = parseInt(co_host_ids);
            if (!isNaN(coHostId)) {
              hostIds.push(coHostId);
            }
          }
        } else if (Array.isArray(co_host_ids)) {
          hostIds = [
            ...hostIds,
            ...co_host_ids.map((id) => parseInt(id)).filter((id) => !isNaN(id)),
          ];
        }
      }

      // Format tags array
      let formattedTags = [];
      if (event_tags) {
        if (typeof event_tags === "string") {
          try {
            const parsedTags = JSON.parse(event_tags);
            if (Array.isArray(parsedTags)) {
              formattedTags = parsedTags;
            } else {
              formattedTags = event_tags.split(",").map((tag) => tag.trim());
            }
          } catch (e) {
            formattedTags = event_tags.split(",").map((tag) => tag.trim());
          }
        } else if (Array.isArray(event_tags)) {
          formattedTags = event_tags;
        }
      }

      // Format host details arrays
      let formattedHostNames = [];
      let formattedInstagramUrls = [];
      let formattedLinkedinUrls = [];
      let formattedTwitterUrls = [];

      if (host_names) {
        formattedHostNames = Array.isArray(host_names)
          ? host_names
          : [host_names];
      }

      if (host_instagram_urls) {
        formattedInstagramUrls = Array.isArray(host_instagram_urls)
          ? host_instagram_urls
          : [host_instagram_urls];
      }

      if (host_linkedin_urls) {
        formattedLinkedinUrls = Array.isArray(host_linkedin_urls)
          ? host_linkedin_urls
          : [host_linkedin_urls];
      }

      if (host_twitter_urls) {
        formattedTwitterUrls = Array.isArray(host_twitter_urls)
          ? host_twitter_urls
          : [host_twitter_urls];
      }

      // Process uploaded images BEFORE creating the event
      let processedEventImages = [];
      let processedHostPhotos = [];
      let processedHostBanner = null;
      let processedHostGallery = [];

      if (req.files) {
        console.log("Files received:", Object.keys(req.files));

        // Process event images
        if (req.files.eventImages && req.files.eventImages.length > 0) {
          console.log("Processing event images:", req.files.eventImages.length);
          processedEventImages = req.files.eventImages.map(file => file.buffer);
        }

        // Process host photos
        if (req.files.hostPhotos && req.files.hostPhotos.length > 0) {
          console.log("Processing host photos:", req.files.hostPhotos.length);
          processedHostPhotos = req.files.hostPhotos.map(file => file.buffer);
        }

        // Process host banner (single image)
        if (req.files.hostBanner && req.files.hostBanner.length > 0) {
          console.log("Processing host banner");
          processedHostBanner = req.files.hostBanner[0].buffer;
        }

        // Process host gallery (multiple images)
        if (req.files.hostGallery && req.files.hostGallery.length > 0) {
          console.log("Processing host gallery:", req.files.hostGallery.length);
          processedHostGallery = req.files.hostGallery.map(file => file.buffer);
        }
      }

      // Create event object with processed images
      const eventData = {
        event_name,
        host_ids: hostIds,
        description,
        event_date,
        event_time,
        location: location.trim(),
        event_tags: formattedTags,
        is_virtual: isVirtualEvent,
        is_free: is_free === "true" || is_free === true,
        ticket_price:
          is_free === "true" || is_free === true
            ? 0
            : parseFloat(ticket_price) || 0,

        // Host Details
        host_names: formattedHostNames,
        host_photos: processedHostPhotos, // Include processed images
        host_banner: processedHostBanner, // Include processed banner
        host_gallery: processedHostGallery, // Include processed gallery
        host_instagram_urls: formattedInstagramUrls,
        host_linkedin_urls: formattedLinkedinUrls,
        host_twitter_urls: formattedTwitterUrls,

        // Event Images - CRITICAL: Include this to avoid NOT NULL constraint violation
        event_images: processedEventImages,

        // Additional Details
        duration: duration || null,
        seating: seating || null,
        layout: layout || null,
        language: language || null,
        pet_allowance: pet_allowance || null,
        age_limit: age_limit || null,
      };

      // Create the event with all data including images
      const event = await EventSchema.create(eventData);

      // Get the created event with host details
      const createdEvent = await EventSchema.findByIdWithHostDetails(event.id);

      // Format response with actual image URLs
      const responseEvent = {
        ...createdEvent,

        // Return actual image data or Base64 URLs for frontend use
        event_images: createdEvent.event_images
          ? createdEvent.event_images.map((img, index) => ({
              id: index,
              url: `data:image/jpeg;base64,${img.toString("base64")}`,
            }))
          : [],

        host_photos: createdEvent.host_photos
          ? createdEvent.host_photos.map((img, index) => ({
              id: index,
              url: `data:image/jpeg;base64,${img.toString("base64")}`,
            }))
          : [],

        host_banner: createdEvent.host_banner
          ? {
              url: `data:image/jpeg;base64,${createdEvent.host_banner.toString(
                "base64"
              )}`,
            }
          : null,

        host_gallery: createdEvent.host_gallery
          ? createdEvent.host_gallery.map((img, index) => ({
              id: index,
              url: `data:image/jpeg;base64,${img.toString("base64")}`,
            }))
          : [],

        // Add like information for the creator
        total_likes: (createdEvent.likes || []).length,
        is_liked: false, // Creator hasn't liked their own post initially
      };

      res.status(201).json({
        message: "Event created successfully",
        event: responseEvent,
      });
    } catch (error) {
      console.error("Event creation error:", error);
      res.status(500).json({ error: "Server error", details: error.message });
    }
  }
);

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
      return res.status(400).json({ error: "You have already liked this event" });
    }

    // Add user ID to likes array
    const newLikes = [...likes, userId]; // ✅ new array
const updatedEvent = await EventSchema.update(eventId, {
  likes: newLikes,
  total_likes: newLikes.length // ✅ added this line
});


    res.status(200).json({
      message: "Event liked successfully",
      total_likes:updatedEvent.total_likes,
      is_liked: true
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
      return res.status(400).json({ error: "You haven't liked this event yet" });
    }

    // Remove user ID from likes array
    // const updatedLikes = likes.filter(id => id !== userId);
    // const updatedEvent = await EventSchema.update(eventId, {
    //   likes: updatedLikes
    // });
const updatedLikes = likes.filter(id => id !== userId);
const updatedEvent = await EventSchema.update(eventId, {
  likes: updatedLikes,
  total_likes: updatedLikes.length
});

    res.status(200).json({
      message: "Event unliked successfully",
      total_likes:updatedEvent.total_likes,
      is_liked: false
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
                ? `data:image/jpeg;base64,${user.photo.toString("base64")}`
                : null
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
    const validLikes = likeDetails.filter(like => like !== null);

    res.status(200).json({
      event_id: eventId,
      total_likes: event.total_likes,

      likes: validLikes
    });
  } catch (error) {
    console.error("Error getting event likes:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/getEvent", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const events = await EventSchema.findAll();

    const paginatedEvents = await Promise.all(
      events
        .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
        .slice(offset, offset + limit)
        .map(async (event) => {
          const creatorId = event.host_ids?.[0]; // primary host
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

          const {
            host_photos,
            host_instagram_urls,
            host_linkedin_urls,
            host_twitter_urls,
            host_names,
            ...eventData
          } = event;

          // Since no authentication, set like status to false by default
          const likes = event.likes || [];

          return {
            ...eventData,
            event_images:
              event.event_images && event.event_images.length > 0
                ? event.event_images.map((img, index) => ({
                    id: index,
                    url: `data:image/jpeg;base64,${img.toString("base64")}`,
                  }))
                : [],

            host_social: {
              photos:
                event.host_photos && event.host_photos.length > 0
                  ? event.host_photos.map((img, index) => ({
                      id: index,
                      url: `data:image/jpeg;base64,${img.toString("base64")}`,
                    }))
                  : [],

              instagram_urls: event.host_instagram_urls || [],
              linkedin_urls: event.host_linkedin_urls || [],
              twitter_urls: event.host_twitter_urls || [],
              host_names: event.host_names || [],
            },

            host_banner: event.host_banner
              ? {
                  url: `data:image/jpeg;base64,${event.host_banner.toString(
                    "base64"
                  )}`,
                }
              : null,

            host_gallery:
              event.host_gallery && event.host_gallery.length > 0
                ? event.host_gallery.map((img, index) => ({
                    id: index,
                    url: `data:image/jpeg;base64,${img.toString("base64")}`,
                  }))
                : [],

            created_by: creator
              ? {
                  id: creator._id,
                  username: creator.username,
                  email: creator.email,
                  // photo: creator.photo
                  photo: creator.photo
                    ? `data:image/jpeg;base64,${creator.photo.toString(
                        "base64"
                      )}`
                    : null,
                }
              : null,

            // Add like information - no user authentication so is_liked is always false
            total_likes: event.total_likes,

            is_liked: false,
          };
        })
    );

    res.status(200).json(paginatedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get single event by ID with host details
router.get("/getEvent/:id", async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await EventSchema.findByIdWithHostDetails(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Since no authentication, set like status to false by default
    const likes = event.likes || [];

    // Format event for response with actual image URLs
    const formattedEvent = {
      ...event,
      event_images: event.event_images
        ? event.event_images.map((img, index) => ({
            id: index,
            url: `data:image/jpeg;base64,${img.toString("base64")}`,
          }))
        : [],

      host_photos: event.host_photos
        ? event.host_photos.map((img, index) => ({
            id: index,
            url: `data:image/jpeg;base64,${img.toString("base64")}`,
          }))
        : [],

      host_banner: event.host_banner
        ? {
            url: `data:image/jpeg;base64,${event.host_banner.toString(
              "base64"
            )}`,
          }
        : null,

      host_gallery: event.host_gallery
        ? event.host_gallery.map((img, index) => ({
            id: index,
            url: `data:image/jpeg;base64,${img.toString("base64")}`,
          }))
        : [],

      // Add like information - no user authentication so is_liked is always false
      total_likes: event.total_likes,

      is_liked: false,
    };

    res.status(200).json(formattedEvent);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update event
router.put(
  "/updateEvent/:id",
  authenticate,
  upload.fields([
    { name: "eventImages", maxCount: 10 },
    { name: "hostPhotos", maxCount: 5 },
    { name: "hostBanner", maxCount: 1 },
    { name: "hostGallery", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const eventId = req.params.id;
      const userId = req.user.id;

      // Check if event exists and user has permission
      const existingEvent = await EventSchema.findById(eventId);
      if (!existingEvent) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (!existingEvent.host_ids.includes(userId)) {
        return res
          .status(403)
          .json({ error: "You don't have permission to update this event" });
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
        language,
        layout,
        pet_allowance,
        age_limit,
      } = req.body;

      // Validate location if provided
      if (location !== undefined) {
        const isVirtualEvent =
          is_virtual !== undefined
            ? is_virtual === "true" || is_virtual === true
            : existingEvent.is_virtual;

        if (!location || location.trim() === "") {
          return res.status(400).json({
            error: isVirtualEvent
              ? "Virtual events require a valid HTTPS URL"
              : "Offline events require a location",
          });
        }

        if (isVirtualEvent) {
          if (!isValidHttpsUrl(location)) {
            return res.status(400).json({
              error: "Please enter a valid HTTPS URL for virtual events",
            });
          }
        } else {
          if (location.trim().length < 3) {
            return res.status(400).json({
              error: "Please enter a valid location for offline events",
            });
          }
        }
      }

      // Format host IDs array if provided
      let hostIds = existingEvent.host_ids;
      if (co_host_ids !== undefined) {
        hostIds = [userId]; // Always include current user
        if (co_host_ids) {
          if (typeof co_host_ids === "string") {
            try {
              const parsedCoHosts = JSON.parse(co_host_ids);
              if (Array.isArray(parsedCoHosts)) {
                hostIds = [...hostIds, ...parsedCoHosts];
              }
            } catch (e) {
              const coHostId = parseInt(co_host_ids);
              if (!isNaN(coHostId)) {
                hostIds.push(coHostId);
              }
            }
          } else if (Array.isArray(co_host_ids)) {
            hostIds = [
              ...hostIds,
              ...co_host_ids
                .map((id) => parseInt(id))
                .filter((id) => !isNaN(id)),
            ];
          }
        }
      }

      // Create update object
      const updateData = {};

      if (event_name !== undefined) updateData.event_name = event_name;
      if (description !== undefined) updateData.description = description;
      if (event_date !== undefined) updateData.event_date = event_date;
      if (event_time !== undefined) updateData.event_time = event_time;
      if (location !== undefined) updateData.location = location.trim();
      if (is_virtual !== undefined)
        updateData.is_virtual = is_virtual === "true" || is_virtual === true;
      if (is_free !== undefined) {
        updateData.is_free = is_free === "true" || is_free === true;
        updateData.ticket_price = updateData.is_free
          ? 0
          : parseFloat(ticket_price) || 0;
      }
      if (duration !== undefined) updateData.duration = duration;
      if (seating !== undefined) updateData.seating = seating;
      if (layout !== undefined) updateData.layout = layout;
      if (language !== undefined) updateData.language = language;
      if (pet_allowance !== undefined) updateData.pet_allowance = pet_allowance;
      if (age_limit !== undefined) updateData.age_limit = age_limit;

      // Handle arrays
      updateData.host_ids = hostIds;

      if (event_tags !== undefined) {
        let formattedTags = [];
        if (event_tags) {
          if (typeof event_tags === "string") {
            try {
              const parsedTags = JSON.parse(event_tags);
              if (Array.isArray(parsedTags)) {
                formattedTags = parsedTags;
              } else {
                formattedTags = event_tags.split(",").map((tag) => tag.trim());
              }
            } catch (e) {
              formattedTags = event_tags.split(",").map((tag) => tag.trim());
            }
          } else if (Array.isArray(event_tags)) {
            formattedTags = event_tags;
          }
        }
        updateData.event_tags = formattedTags;
      }

      if (host_names !== undefined) {
        updateData.host_names = Array.isArray(host_names)
          ? host_names
          : [host_names];
      }

      if (host_instagram_urls !== undefined) {
        updateData.host_instagram_urls = Array.isArray(host_instagram_urls)
          ? host_instagram_urls
          : [host_instagram_urls];
      }

      if (host_linkedin_urls !== undefined) {
        updateData.host_linkedin_urls = Array.isArray(host_linkedin_urls)
          ? host_linkedin_urls
          : [host_linkedin_urls];
      }

      if (host_twitter_urls !== undefined) {
        updateData.host_twitter_urls = Array.isArray(host_twitter_urls)
          ? host_twitter_urls
          : [host_twitter_urls];
      }

      // Update the event
      const updatedEvent = await EventSchema.update(eventId, updateData);

      // Process uploaded files if any
      if (req.files) {
        if (req.files.eventImages && req.files.eventImages.length > 0) {
          for (const file of req.files.eventImages) {
            await EventSchema.addEventImage(eventId, file.buffer);
          }
        }

        if (req.files.hostPhotos && req.files.hostPhotos.length > 0) {
          for (const file of req.files.hostPhotos) {
            await EventSchema.addHostPhoto(eventId, file.buffer);
          }
        }

        if (req.files.hostBanner && req.files.hostBanner.length > 0) {
          await EventSchema.setHostBanner(
            eventId,
            req.files.hostBanner[0].buffer
          );
        }

        if (req.files.hostGallery && req.files.hostGallery.length > 0) {
          for (const file of req.files.hostGallery) {
            await EventSchema.addHostGalleryImage(eventId, file.buffer);
          }
        }
      }

      // Get the final updated event with host details
      const finalEvent = await EventSchema.findByIdWithHostDetails(eventId);

      // Format response with actual image URLs
      const responseEvent = {
        ...finalEvent,
        event_images: finalEvent.event_images
          ? finalEvent.event_images.map((img, index) => ({
              id: index,
              url: `data:image/jpeg;base64,${img.toString("base64")}`,
            }))
          : [],

        host_photos: finalEvent.host_photos
          ? finalEvent.host_photos.map((img, index) => ({
              id: index,
              url: `data:image/jpeg;base64,${img.toString("base64")}`,
            }))
          : [],

        host_banner: finalEvent.host_banner
          ? {
              url: `data:image/jpeg;base64,${finalEvent.host_banner.toString(
                "base64"
              )}`,
            }
          : null,

        host_gallery: finalEvent.host_gallery
          ? finalEvent.host_gallery.map((img, index) => ({
              id: index,
              url: `data:image/jpeg;base64,${img.toString("base64")}`,
            }))
          : [],
      };

      res.status(200).json({
        message: "Event updated successfully",
        event: responseEvent,
      });
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Server error", details: error.message });
    }
  }
);

// Delete event
router.delete("/deleteEvent/:id", authenticate, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const event = await EventSchema.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (!event.host_ids.includes(userId)) {
      return res
        .status(403)
        .json({ error: "You don't have permission to delete this event" });
    }

    const result = await EventSchema.delete(eventId);

    if (!result) {
      return res
        .status(404)
        .json({ error: "Event not found or already deleted" });
    }

    res.status(200).json({
      message: "Event deleted successfully",
      deletedEventId: eventId,
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get events by host
router.get("/getEventsByHost/:hostId", async (req, res) => {
  try {
    const hostId = parseInt(req.params.hostId);
    const events = await EventSchema.findByHostId(hostId);

    const formattedEvents = events.map((event) => ({
      ...event,
      event_images: event.event_images
        ? event.event_images.map((img, index) => ({
            id: index,
            url: `data:image/jpeg;base64,${img.toString("base64")}`,
          }))
        : [],

      host_photos: event.host_photos
        ? event.host_photos.map((img, index) => ({
            id: index,
            url: `data:image/jpeg;base64,${img.toString("base64")}`,
          }))
        : [],

      host_banner: event.host_banner
        ? {
            url: `data:image/jpeg;base64,${event.host_banner.toString(
              "base64"
            )}`,
          }
        : null,

      host_gallery: event.host_gallery
        ? event.host_gallery.map((img, index) => ({
            id: index,
            url: `data:image/jpeg;base64,${img.toString("base64")}`,
          }))
        : [],
    }));

    res.status(200).json(formattedEvents);
  } catch (error) {
    console.error("Error fetching events by host:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get upcoming events
router.get("/getUpcomingEvents", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const events = await EventSchema.getUpcomingEvents(limit);

    const formattedEvents = events.map((event) => ({
      ...event,
      event_images: event.event_images
        ? event.event_images.map((img, index) => ({
            id: index,
            url: `data:image/jpeg;base64,${img.toString("base64")}`,
          }))
        : [],

      host_photos: event.host_photos
        ? event.host_photos.map((img, index) => ({
            id: index,
            url: `data:image/jpeg;base64,${img.toString("base64")}`,
          }))
        : [],

      host_banner: event.host_banner
        ? {
            url: `data:image/jpeg;base64,${event.host_banner.toString(
              "base64"
            )}`,
          }
        : null,

      host_gallery: event.host_gallery
        ? event.host_gallery.map((img, index) => ({
            id: index,
            url: `data:image/jpeg;base64,${img.toString("base64")}`,
          }))
        : [],
    }));

    res.status(200).json(formattedEvents);
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;