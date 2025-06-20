const express = require('express');
const router = express.Router();
const EventSchema = require('../models/Event.js');
const authenticate = require('../middlewares/authenticate.js');
const multer = require('multer');
const User = require('../models/User.js');

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
    cb(
      null, true);
  }
});

// Create new event
router.post('/createEvent', authenticate, upload.fields([
  { name: 'eventImages', maxCount: 4 },
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
      
      // Add these fields here
  
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
      event_images: createdEvent.event_images ? createdEvent.event_images.length : null,
      host_photos: createdEvent.host_photos ? createdEvent.host_photos.length : null
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


router.get('/getEvent', async (req, res) => {
  try {
    // const userId = req.user.id;
    // const username = req.user.username; // ✅ get from token
    // const email = req.user.email;

    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // const events = await EventSchema.findByHostId(userId);
    // const events = await EventSchema.findAll();

    // const paginatedEvents = events
    //   .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    //   .slice(offset, offset + limit)
    //   .map(event => ({
    //     ...event,
    //     event_images: event.event_images ? event.event_images.length : null,
    //     host_photos: event.host_photos ? event.host_photos.length : null,
    //     created_by: {
    //       id: userId,
    //       username, 
          
    //       email
    //     }
    //   }));

    const events = await EventSchema.findAll();

const paginatedEvents = await Promise.all(events
  .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
  .slice(offset, offset + limit)
  .map(async (event) => {
    const creatorId = event.host_ids?.[0]; // primary host
    let creator = null;

    // if (creatorId) {
    //   creator = await User.findById(creatorId).select('username email');
    // }

    if (creatorId) {
  // Fix: Remove .select() and handle the response properly
  const userResult = await User.findById(creatorId);
  if (userResult) {
    creator = {
      _id: userResult._id || userResult.id,
      username: userResult.username,
      email: userResult.email
    };
  }
}
 const { host_photos, host_instagram_urls, host_linkedin_urls, host_twitter_urls,host_names, ...eventData } = event;
    return {
      // ...event,
      ...eventData,
      event_images: (event.event_images && event.event_images.length > 0) ? event.event_images.length : null,
      // host_photos: event.host_photos ? event.host_photos.length : null,

      host_social: {
    // photos: event.host_photos ? event.host_photos.length : null,
    photos: (event.host_photos && event.host_photos.length > 0) ? event.host_photos.length : null,

    instagram_urls: event.host_instagram_urls || [],
    linkedin_urls: event.host_linkedin_urls || [],
    twitter_urls: event.host_twitter_urls || [],
    host_names: event.host_names || []
  },

       
      created_by: creator
        ? {
            id: creator._id,
            username: creator.username,
            email: creator.email,
          }
        : null,
    };
  }));

      console.log("Decoded user info:", req.user);


    res.status(200).json(paginatedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// Get single event by ID with host details
router.get('/getEvent/:id', authenticate, async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await EventSchema.findByIdWithHostDetails(eventId);
    
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Format event for response
    const formattedEvent = {
      ...event,
      event_images: event.event_images ? event.event_images.length : null,
      host_photos: event.host_photos ? event.host_photos.length : null
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