// const express = require('express');
// const router = express.Router();
// const EventSchema = require('../models/Event.js');
// const authenticate = require('../middlewares/authenticate.js');
// const multer = require('multer');

// // Memory storage for direct database upload
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

// // Create new event - Fixed to use snake_case consistently
// router.post('/createEvent', authenticate, upload.fields([
//   { name: 'hostImages', maxCount: 5 },
//   { name: 'galleryImages', maxCount: 10 },
//   { name: 'paymentQr', maxCount: 1 }
// ]), async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const {
//       event_name,
//       co_host_ids,
//       description,
//       event_date,
//       event_time,
//       is_virtual,
//       venue_name,
//       venue_address,
//       capacity,
      
//       // Pricing
//       ticket_price,
//       early_bird_price,
//       early_bird_deadline,
//       group_discount_price,
//       group_discount_min_size,
      
//       // Contact and social
//       contact_email,
//       contact_phone,
//       website_url,
//       facebook_url,
//       twitter_url,
//       instagram_url,
//       linkedin_url,
      
//       // Additional details
//       tags,
//       category,
//       target_audience,
//       dress_code,
//       special_instructions
//     } = req.body;

//     // Basic validation
//     if (!event_name || !event_date || !event_time) {
//       return res.status(400).json({ error: "Event name, date and time are required" });
//     }

//     // Format host IDs array
//     let hostIds = [userId];
//     if (co_host_ids) {
//       if (typeof co_host_ids === 'string') {
//         try {
//           const parsedCoHosts = JSON.parse(co_host_ids);
//           if (Array.isArray(parsedCoHosts)) {
//             hostIds = [...hostIds, ...parsedCoHosts];
//           }
//         } catch (e) {
//           const coHostId = parseInt(co_host_ids);
//           if (!isNaN(coHostId)) {
//             hostIds.push(coHostId);
//           }
//         }
//       } else if (Array.isArray(co_host_ids)) {
//         hostIds = [...hostIds, ...co_host_ids.map(id => parseInt(id)).filter(id => !isNaN(id))];
//       }
//     }

//     // Format tags array
//     let formattedTags = [];
//     if (tags) {
//       if (typeof tags === 'string') {
//         try {
//           const parsedTags = JSON.parse(tags);
//           if (Array.isArray(parsedTags)) {
//             formattedTags = parsedTags;
//           } else {
//             formattedTags = tags.split(',').map(tag => tag.trim());
//           }
//         } catch (e) {
//           formattedTags = tags.split(',').map(tag => tag.trim());
//         }
//       } else if (Array.isArray(tags)) {
//         formattedTags = tags;
//       }
//     }

//     // Create event object using snake_case column names consistently
//     const eventData = {
//       event_name,
//       host_ids: hostIds,
//       description,
//       event_date,
//       event_time,
//       is_virtual: is_virtual === 'true' || is_virtual === true,
//       venue_name: venue_name || null,
//       venue_address: venue_address || null,
//       capacity: parseInt(capacity) || 0,
//       current_registrations: 0,
      
//       // Pricing fields
//       ticket_price: parseFloat(ticket_price) || 0,
//       early_bird_price: early_bird_price ? parseFloat(early_bird_price) : null,
//       early_bird_deadline: early_bird_deadline || null,
//       group_discount_price: group_discount_price ? parseFloat(group_discount_price) : null,
//       group_discount_min_size: group_discount_min_size ? parseInt(group_discount_min_size) : null,
      
//       // Contact and social
//       contact_email: contact_email || null,
//       contact_phone: contact_phone || null,
//       website_url: website_url || null,
//       facebook_url: facebook_url || null,
//       twitter_url: twitter_url || null,
//       instagram_url: instagram_url || null,
//       linkedin_url: linkedin_url || null,
      
//       // Additional details
//       tags: formattedTags,
//       category: category || null,
//       target_audience: target_audience || null,
//       dress_code: dress_code || null,
//       special_instructions: special_instructions || null,
//     };

//     // Create the event
//     const event = await EventSchema.create(eventData);
    
//     // Process uploaded files and update the event
//     if (req.files) {
//       // Process host images
//       if (req.files.hostImages && req.files.hostImages.length > 0) {
//         for (const file of req.files.hostImages) {
//           await EventSchema.addHostImage(event.id, file.buffer);
//         }
//       }
      
//       // Process gallery images
//       if (req.files.galleryImages && req.files.galleryImages.length > 0) {
//         for (const file of req.files.galleryImages) {
//           await EventSchema.addGalleryImage(event.id, file.buffer);
//         }
//       }
      
//       // Process payment QR code
//       if (req.files.paymentQr && req.files.paymentQr[0]) {
//         await EventSchema.updatePaymentQR(event.id, req.files.paymentQr[0].buffer);
//       }
//     }

//     // Return the created event
//     const createdEvent = await EventSchema.findById(event.id);
    
//     // Format response without binary data
//     const responseEvent = {
//       ...createdEvent,
//       // Remove binary data for response
//       host_images: createdEvent.host_images ? createdEvent.host_images.length : 0,
//       event_gallery: createdEvent.event_gallery ? createdEvent.event_gallery.length : 0,
//       payment_qr: createdEvent.payment_qr ? 'uploaded' : null
//     };

//     res.status(201).json({
//       message: "Event created successfully",
//       event: responseEvent
//     });
//   } catch (error) {
//     console.error("Event creation error:", error);
//     res.status(500).json({ error: "Server error", details: error.message });
//   }
// });

// // Get all events with pagination
// router.get('/getEvent', async (req, res) => {
//   try {
//     const limit = parseInt(req.query.limit) || 10;
//     const page = parseInt(req.query.page) || 1;
//     const offset = (page - 1) * limit;

//     const events = await EventSchema.findAll(limit, offset);

//     // Format events for response
//     const formattedEvents = events.map(event => ({
//       ...event,
//       // Format binary data info
//       host_images: event.host_images ? event.host_images.length : 0,
//       event_gallery: event.event_gallery ? event.event_gallery.length : 0,
//       payment_qr: event.payment_qr ? 'available' : null
//     }));

//     res.status(200).json(formattedEvents);

//   } catch (error) {
//     console.error("Error fetching events:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // Get single event by ID
// router.get('/getEvent/:id', async (req, res) => {
//   try {
//     const eventId = req.params.id;
//     const event = await EventSchema.findById(eventId);
    
//     if (!event) {
//       return res.status(404).json({ error: "Event not found" });
//     }

//     // Format event for response
//     const formattedEvent = {
//       ...event,
//       // Format binary data info
//       host_images: event.host_images ? event.host_images.length : 0,
//       event_gallery: event.event_gallery ? event.event_gallery.length : 0,
//       payment_qr: event.payment_qr ? 'available' : null
//     };

//     res.status(200).json(formattedEvent);
//   } catch (error) {
//     console.error("Error fetching event:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // Update event
// router.put('/updateEvent/:id', authenticate, upload.fields([
//   { name: 'hostImages', maxCount: 5 },
//   { name: 'galleryImages', maxCount: 10 },
//   { name: 'paymentQr', maxCount: 1 }
// ]), async (req, res) => {
//   try {
//     const eventId = req.params.id;
//     const userId = req.user.id;
    
//     // Check if event exists and user has permission
//     const existingEvent = await EventSchema.findById(eventId);
//     if (!existingEvent) {
//       return res.status(404).json({ error: "Event not found" });
//     }
    
//     if (!existingEvent.host_ids.includes(userId)) {
//       return res.status(403).json({ error: "You don't have permission to update this event" });
//     }

//     const {
//       event_name,
//       co_host_ids,
//       description,
//       event_date,
//       event_time,
//       is_virtual,
//       venue_name,
//       venue_address,
//       capacity,
//       ticket_price,
//       early_bird_price,
//       early_bird_deadline,
//       group_discount_price,
//       group_discount_min_size,
//       contact_email,
//       contact_phone,
//       website_url,
//       facebook_url,
//       twitter_url,
//       instagram_url,
//       linkedin_url,
//       tags,
//       category,
//       target_audience,
//       dress_code,
//       special_instructions
//     } = req.body;

//     // Format host IDs array if provided
//     let hostIds = existingEvent.host_ids;
//     if (co_host_ids !== undefined) {
//       hostIds = [userId]; // Always include current user
//       if (co_host_ids) {
//         if (typeof co_host_ids === 'string') {
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
//           hostIds = [...hostIds, ...co_host_ids.map(id => parseInt(id)).filter(id => !isNaN(id))];
//         }
//       }
//     }

//     // Format tags array if provided
//     let formattedTags = existingEvent.tags;
//     if (tags !== undefined) {
//       formattedTags = [];
//       if (tags) {
//         if (typeof tags === 'string') {
//           try {
//             const parsedTags = JSON.parse(tags);
//             if (Array.isArray(parsedTags)) {
//               formattedTags = parsedTags;
//             } else {
//               formattedTags = tags.split(',').map(tag => tag.trim());
//             }
//           } catch (e) {
//             formattedTags = tags.split(',').map(tag => tag.trim());
//           }
//         } else if (Array.isArray(tags)) {
//           formattedTags = tags;
//         }
//       }
//     }

//     // Create update object using snake_case column names consistently
//     const updateData = {};
    
//     if (event_name !== undefined) updateData.event_name = event_name;
//     if (description !== undefined) updateData.description = description;
//     if (event_date !== undefined) updateData.event_date = event_date;
//     if (event_time !== undefined) updateData.event_time = event_time;
//     if (is_virtual !== undefined) updateData.is_virtual = is_virtual === 'true' || is_virtual === true;
//     if (venue_name !== undefined) updateData.venue_name = venue_name;
//     if (venue_address !== undefined) updateData.venue_address = venue_address;
//     if (capacity !== undefined) updateData.capacity = parseInt(capacity) || 0;
//     if (ticket_price !== undefined) updateData.ticket_price = parseFloat(ticket_price) || 0;
//     if (early_bird_price !== undefined) updateData.early_bird_price = early_bird_price ? parseFloat(early_bird_price) : null;
//     if (early_bird_deadline !== undefined) updateData.early_bird_deadline = early_bird_deadline;
//     if (group_discount_price !== undefined) updateData.group_discount_price = group_discount_price ? parseFloat(group_discount_price) : null;
//     if (group_discount_min_size !== undefined) updateData.group_discount_min_size = group_discount_min_size ? parseInt(group_discount_min_size) : null;
//     if (contact_email !== undefined) updateData.contact_email = contact_email;
//     if (contact_phone !== undefined) updateData.contact_phone = contact_phone;
//     if (website_url !== undefined) updateData.website_url = website_url;
//     if (facebook_url !== undefined) updateData.facebook_url = facebook_url;
//     if (twitter_url !== undefined) updateData.twitter_url = twitter_url;
//     if (instagram_url !== undefined) updateData.instagram_url = instagram_url;
//     if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url;
//     if (category !== undefined) updateData.category = category;
//     if (target_audience !== undefined) updateData.target_audience = target_audience;
//     if (dress_code !== undefined) updateData.dress_code = dress_code;
//     if (special_instructions !== undefined) updateData.special_instructions = special_instructions;
    
//     // Always update these if they were processed
//     updateData.host_ids = hostIds;
//     updateData.tags = formattedTags;

//     // Update the event
//     const updatedEvent = await EventSchema.update(eventId, updateData);
    
//     // Process uploaded files if any
//     if (req.files) {
//       if (req.files.hostImages && req.files.hostImages.length > 0) {
//         for (const file of req.files.hostImages) {
//           await EventSchema.addHostImage(eventId, file.buffer);
//         }
//       }
      
//       if (req.files.galleryImages && req.files.galleryImages.length > 0) {
//         for (const file of req.files.galleryImages) {
//           await EventSchema.addGalleryImage(eventId, file.buffer);
//         }
//       }
      
//       if (req.files.paymentQr && req.files.paymentQr[0]) {
//         await EventSchema.updatePaymentQR(eventId, req.files.paymentQr[0].buffer);
//       }
//     }

//     // Get the final updated event
//     const finalEvent = await EventSchema.findById(eventId);
    
//     // Format response
//     const responseEvent = {
//       ...finalEvent,
//       host_images: finalEvent.host_images ? finalEvent.host_images.length : 0,
//       event_gallery: finalEvent.event_gallery ? finalEvent.event_gallery.length : 0,
//       payment_qr: finalEvent.payment_qr ? 'available' : null
//     };

//     res.status(200).json({
//       message: "Event updated successfully",
//       event: responseEvent
//     });
//   } catch (error) {
//     console.error("Error updating event:", error);
//     res.status(500).json({ error: "Server error", details: error.message });
//   }
// });

// // Delete event
// router.delete('/deleteEvent/:id', authenticate, async (req, res) => {
//   try {
//     const eventId = req.params.id;
//     const userId = req.user.id;
    
//     const event = await EventSchema.findById(eventId);
    
//     if (!event) {
//       return res.status(404).json({ error: "Event not found" });
//     }
    
//     if (!event.host_ids.includes(userId)) {
//       return res.status(403).json({ error: "You don't have permission to delete this event" });
//     }
    
//     const result = await EventSchema.delete(eventId);
    
//     if (!result) {
//       return res.status(404).json({ error: "Event not found or already deleted" });
//     }
    
//     res.status(200).json({ 
//       message: "Event deleted successfully",
//       deletedEventId: eventId
//     });
//   } catch (error) {
//     console.error("Error deleting event:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // Get events by host
// router.get('/getEventsByHost/:hostId', async (req, res) => {
//   try {
//     const hostId = parseInt(req.params.hostId);
//     const events = await EventSchema.findByHostId(hostId);
    
//     const formattedEvents = events.map(event => ({
//       ...event,
//       host_images: event.host_images ? event.host_images.length : 0,
//       event_gallery: event.event_gallery ? event.event_gallery.length : 0,
//       payment_qr: event.payment_qr ? 'available' : null
//     }));

//     res.status(200).json(formattedEvents);
//   } catch (error) {
//     console.error("Error fetching events by host:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // Get upcoming events
// router.get('/getUpcomingEvents', async (req, res) => {
//   try {
//     const limit = parseInt(req.query.limit) || 10;
//     const events = await EventSchema.getUpcomingEvents(limit);
    
//     const formattedEvents = events.map(event => ({
//       ...event,
//       host_images: event.host_images ? event.host_images.length : 0,
//       event_gallery: event.event_gallery ? event.event_gallery.length : 0,
//       payment_qr: event.payment_qr ? 'available' : null
//     }));

//     res.status(200).json(formattedEvents);
//   } catch (error) {
//     console.error("Error fetching upcoming events:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// module.exports = router


const express = require('express');
const router = express.Router();
const EventSchema = require('../models/Event.js');
const authenticate = require('../middlewares/authenticate.js');
const multer = require('multer');

// Memory storage for direct database upload
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

// Create new event
router.post('/createEvent', authenticate, upload.fields([
  { name: 'eventImages', maxCount: 10 },
  { name: 'hostPhotos', maxCount: 5 }
]), async (req, res) => {
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
      
      // Host Details Arrays
      host_names,
      host_instagram_urls,
      host_linkedin_urls,
      host_twitter_urls,
      
      // Additional Details
      duration,
      seating,
      layout,
      language,
      pet_allowance,
      age_limit
    } = req.body;

    // Basic validation
    if (!event_name || !event_date || !event_time) {
      return res.status(400).json({ error: "Event name, date and time are required" });
    }

    // Format host IDs array
    let hostIds = [userId];
    if (co_host_ids) {
      if (typeof co_host_ids === 'string') {
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
        hostIds = [...hostIds, ...co_host_ids.map(id => parseInt(id)).filter(id => !isNaN(id))];
      }
    }

    // Format tags array
    let formattedTags = [];
    if (event_tags) {
      if (typeof event_tags === 'string') {
        try {
          const parsedTags = JSON.parse(event_tags);
          if (Array.isArray(parsedTags)) {
            formattedTags = parsedTags;
          } else {
            formattedTags = event_tags.split(',').map(tag => tag.trim());
          }
        } catch (e) {
          formattedTags = event_tags.split(',').map(tag => tag.trim());
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
      formattedHostNames = Array.isArray(host_names) ? host_names : [host_names];
    }
    
    if (host_instagram_urls) {
      formattedInstagramUrls = Array.isArray(host_instagram_urls) ? host_instagram_urls : [host_instagram_urls];
    }
    
    if (host_linkedin_urls) {
      formattedLinkedinUrls = Array.isArray(host_linkedin_urls) ? host_linkedin_urls : [host_linkedin_urls];
    }
    
    if (host_twitter_urls) {
      formattedTwitterUrls = Array.isArray(host_twitter_urls) ? host_twitter_urls : [host_twitter_urls];
    }

    // Create event object
    const eventData = {
      event_name,
      host_ids: hostIds,
      description,
      event_date,
      event_time,
      location: location || null,
      event_tags: formattedTags,
      is_virtual: is_virtual === 'true' || is_virtual === true,
      is_free: is_free === 'true' || is_free === true,
      ticket_price: is_free === 'true' || is_free === true ? 0 : parseFloat(ticket_price) || 0,
      
      // Host Details
      host_names: formattedHostNames,
      host_instagram_urls: formattedInstagramUrls,
      host_linkedin_urls: formattedLinkedinUrls,
      host_twitter_urls: formattedTwitterUrls,
      
      // Additional Details
      duration: duration || null,
      seating: seating || null,
      layout: layout || null,
      language:language || null,
      pet_allowance: pet_allowance || null,
      age_limit: age_limit || null,
    };

    // Create the event
    const event = await EventSchema.create(eventData);
    
    // Process uploaded files
    if (req.files) {
      // Process event images
      if (req.files.eventImages && req.files.eventImages.length > 0) {
        for (const file of req.files.eventImages) {
          await EventSchema.addEventImage(event.id, file.buffer);
        }
      }
      
      // Process host photos
      if (req.files.hostPhotos && req.files.hostPhotos.length > 0) {
        for (const file of req.files.hostPhotos) {
          await EventSchema.addHostPhoto(event.id, file.buffer);
        }
      }
    }

    // Get the created event with host details
    const createdEvent = await EventSchema.findByIdWithHostDetails(event.id);
    
    // Format response
    const responseEvent = {
      ...createdEvent,
      event_images: createdEvent.event_images ? createdEvent.event_images.length : 0,
      host_photos: createdEvent.host_photos ? createdEvent.host_photos.length : 0
    };

    res.status(201).json({
      message: "Event created successfully",
      event: responseEvent
    });
  } catch (error) {
    console.error("Event creation error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Get all events with pagination and host details
router.get('/getEvent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const events = await EventSchema.findAllWithHostDetails(limit, offset);

    // Format events for response
    const formattedEvents = events.map(event => ({
      ...event,
      event_images: event.event_images ? event.event_images.length : 0,
      host_photos: event.host_photos ? event.host_photos.length : 0
    }));

    res.status(200).json(formattedEvents);

  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get single event by ID with host details
router.get('/getEvent/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await EventSchema.findByIdWithHostDetails(eventId);
    
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Format event for response
    const formattedEvent = {
      ...event,
      event_images: event.event_images ? event.event_images.length : 0,
      host_photos: event.host_photos ? event.host_photos.length : 0
    };

    res.status(200).json(formattedEvent);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update event
router.put('/updateEvent/:id', authenticate, upload.fields([
  { name: 'eventImages', maxCount: 10 },
  { name: 'hostPhotos', maxCount: 5 }
]), async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    
    // Check if event exists and user has permission
    const existingEvent = await EventSchema.findById(eventId);
    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    if (!existingEvent.host_ids.includes(userId)) {
      return res.status(403).json({ error: "You don't have permission to update this event" });
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
      age_limit
    } = req.body;

    // Format host IDs array if provided
    let hostIds = existingEvent.host_ids;
    if (co_host_ids !== undefined) {
      hostIds = [userId]; // Always include current user
      if (co_host_ids) {
        if (typeof co_host_ids === 'string') {
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
          hostIds = [...hostIds, ...co_host_ids.map(id => parseInt(id)).filter(id => !isNaN(id))];
        }
      }
    }

    // Create update object
    const updateData = {};
    
    if (event_name !== undefined) updateData.event_name = event_name;
    if (description !== undefined) updateData.description = description;
    if (event_date !== undefined) updateData.event_date = event_date;
    if (event_time !== undefined) updateData.event_time = event_time;
    if (location !== undefined) updateData.location = location;
    if (is_virtual !== undefined) updateData.is_virtual = is_virtual === 'true' || is_virtual === true;
    if (is_free !== undefined) {
      updateData.is_free = is_free === 'true' || is_free === true;
      updateData.ticket_price = updateData.is_free ? 0 : parseFloat(ticket_price) || 0;
    }
    if (duration !== undefined) updateData.duration = duration;
    if (seating !== undefined) updateData.seating = seating;
    if (layout !== undefined) updateData.layout = layout;
    if (language !== undefined) updateData.layout = language;
    if (pet_allowance !== undefined) updateData.pet_allowance = pet_allowance;
    if (age_limit !== undefined) updateData.age_limit = age_limit;
    
    // Handle arrays
    updateData.host_ids = hostIds;
    
    if (event_tags !== undefined) {
      let formattedTags = [];
      if (event_tags) {
        if (typeof event_tags === 'string') {
          try {
            const parsedTags = JSON.parse(event_tags);
            if (Array.isArray(parsedTags)) {
              formattedTags = parsedTags;
            } else {
              formattedTags = event_tags.split(',').map(tag => tag.trim());
            }
          } catch (e) {
            formattedTags = event_tags.split(',').map(tag => tag.trim());
          }
        } else if (Array.isArray(event_tags)) {
          formattedTags = event_tags;
        }
      }
      updateData.event_tags = formattedTags;
    }
    
    if (host_names !== undefined) {
      updateData.host_names = Array.isArray(host_names) ? host_names : [host_names];
    }
    
    if (host_instagram_urls !== undefined) {
      updateData.host_instagram_urls = Array.isArray(host_instagram_urls) ? host_instagram_urls : [host_instagram_urls];
    }
    
    if (host_linkedin_urls !== undefined) {
      updateData.host_linkedin_urls = Array.isArray(host_linkedin_urls) ? host_linkedin_urls : [host_linkedin_urls];
    }
    
    if (host_twitter_urls !== undefined) {
      updateData.host_twitter_urls = Array.isArray(host_twitter_urls) ? host_twitter_urls : [host_twitter_urls];
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
    }

    // Get the final updated event with host details
    const finalEvent = await EventSchema.findByIdWithHostDetails(eventId);
    
    // Format response
    const responseEvent = {
      ...finalEvent,
      event_images: finalEvent.event_images ? finalEvent.event_images.length : 0,
      host_photos: finalEvent.host_photos ? finalEvent.host_photos.length : 0
    };

    res.status(200).json({
      message: "Event updated successfully",
      event: responseEvent
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Delete event
router.delete('/deleteEvent/:id', authenticate, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    
    const event = await EventSchema.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    if (!event.host_ids.includes(userId)) {
      return res.status(403).json({ error: "You don't have permission to delete this event" });
    }
    
    const result = await EventSchema.delete(eventId);
    
    if (!result) {
      return res.status(404).json({ error: "Event not found or already deleted" });
    }
    
    res.status(200).json({ 
      message: "Event deleted successfully",
      deletedEventId: eventId
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get events by host
router.get('/getEventsByHost/:hostId', async (req, res) => {
  try {
    const hostId = parseInt(req.params.hostId);
    const events = await EventSchema.findByHostId(hostId);
    
    const formattedEvents = events.map(event => ({
      ...event,
      event_images: event.event_images ? event.event_images.length : 0,
      host_photos: event.host_photos ? event.host_photos.length : 0
    }));

    res.status(200).json(formattedEvents);
  } catch (error) {
    console.error("Error fetching events by host:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get upcoming events
router.get('/getUpcomingEvents', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const events = await EventSchema.getUpcomingEvents(limit);
    
    const formattedEvents = events.map(event => ({
      ...event,
      event_images: event.event_images ? event.event_images.length : 0,
      host_photos: event.host_photos ? event.host_photos.length : 0
    }));

    res.status(200).json(formattedEvents);
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;