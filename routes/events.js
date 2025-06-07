// routes/events.js
const express = require('express');
const router = express.Router();
const EventSchema = require('../models/Event.js');
const UserSchema = require('../models/User.js');
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
  { name: 'hostImages', maxCount: 5 },
  { name: 'galleryImages', maxCount: 10 },
  { name: 'paymentQr', maxCount: 1 }
]), async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      coHostIds,
      description,
      eventDate,
      eventTime,
      tags,
      isVirtual,
      location,
      capacity,
      socialLinks,
      fee
    } = req.body;

    // Basic validation
    if (!name || !eventDate || !eventTime) {
      return res.status(400).json({ error: "Event name, date and time are required" });
    }

    // Format host IDs array
    let hostIds = [userId];
    if (coHostIds) {
      // Add co-hosts if provided
      if (typeof coHostIds === 'string') {
        try {
          const parsedCoHosts = JSON.parse(coHostIds);
          if (Array.isArray(parsedCoHosts)) {
            hostIds = [...hostIds, ...parsedCoHosts];
          }
        } catch (e) {
          // If not JSON, treat as single ID
          hostIds.push(parseInt(coHostIds));
        }
      } else if (Array.isArray(coHostIds)) {
        hostIds = [...hostIds, ...coHostIds];
      }
    }

    // Format tags array
    let formattedTags = [];
    if (tags) {
      if (typeof tags === 'string') {
        try {
          const parsedTags = JSON.parse(tags);
          if (Array.isArray(parsedTags)) {
            formattedTags = parsedTags;
          } else {
            formattedTags = tags.split(',').map(tag => tag.trim());
          }
        } catch (e) {
          // If not JSON, treat as comma-separated
          formattedTags = tags.split(',').map(tag => tag.trim());
        }
      } else if (Array.isArray(tags)) {
        formattedTags = tags;
      }
    }

    // Handle social links
    let formattedSocialLinks = {};
    if (socialLinks) {
      if (typeof socialLinks === 'string') {
        try {
          formattedSocialLinks = JSON.parse(socialLinks);
        } catch (e) {
          return res.status(400).json({ error: "Invalid social links format" });
        }
      } else if (typeof socialLinks === 'object') {
        formattedSocialLinks = socialLinks;
      }
    }

    // Create event object without images first
    const eventData = {
      name,
      host_ids: hostIds,
      description,
      event_date: eventDate,
      event_time: eventTime,
      tags: formattedTags,
      is_virtual: isVirtual === 'true' || isVirtual === true,
      location,
      capacity: parseInt(capacity) || 0,
      current_registrations: 0,
      social_links: formattedSocialLinks,
      fee: parseFloat(fee) || 0,
      host_images: [], // Will add images after creating event
      gallery: [], // Will add images after creating event
    };

    // Create the event
    const event = await EventSchema.create(eventData);
    
    // Process uploaded files and update the event
    if (req.files) {
      // Process host images
      if (req.files.hostImages && req.files.hostImages.length > 0) {
        for (const file of req.files.hostImages) {
          await EventSchema.addHostImage(event.id, file.buffer);
        }
      }
      

      


      // Process gallery images
      if (req.files.galleryImages && req.files.galleryImages.length > 0) {
        for (const file of req.files.galleryImages) {
          await EventSchema.addGalleryImage(event.id, file.buffer);
        }
      }
      
      // Process payment QR code
      if (req.files.paymentQr && req.files.paymentQr[0]) {
        await EventSchema.updatePaymentQR(event.id, req.files.paymentQr[0].buffer);
      }
    }

    // Return the created event without binary data
    const createdEvent = await EventSchema.findById(event.id);
    createdEvent.host_images = req.body.host_images 
  ? JSON.parse(req.body.host_images) 
  : [];
createdEvent.gallery = req.body.gallery || [];
createdEvent.payment_qr = req.body.payment_qr || null;

    res.status(201).json({
      message: "Event created successfully",
      event: createdEvent
    });
  } catch (error) {
    console.error("Event creation error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all events with pagination
router.get('/getEvent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // const events = await EventSchema.findAll(limit, offset);
    // res.status(200).json(events);

    const events = await EventSchema.findAll(limit, offset);

// Normalize image fields: always return them even if empty
const formattedEvents = events.map(event => ({
  ...event,
  host_images: event.host_images || [],
  gallery: event.gallery || [],
  payment_qr: event.payment_qr || null
}));

res.status(200).json(formattedEvents);

  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// Add this to your routes/events.js file

// Delete event
router.delete('/deleteEvent/:id', authenticate, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    
    // First check if event exists
    const event = await EventSchema.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    // Check if the user is one of the hosts of the event
    if (!event.host_ids.includes(userId)) {
      return res.status(403).json({ error: "You don't have permission to delete this event" });
    }
    
    // Proceed with deletion
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

module.exports=router