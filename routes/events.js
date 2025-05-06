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
router.post('/create', authenticate, upload.fields([
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
    // Remove binary data from response
    delete createdEvent.host_images;
    delete createdEvent.gallery;
    delete createdEvent.payment_qr;

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
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const events = await EventSchema.findAll(limit, offset);
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get single event by ID (without binary data)
router.get('/:id', async (req, res) => {
  try {
    const event = await EventSchema.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Get host details
    const hostDetails = [];
    for (const hostId of event.host_ids) {
      const host = await UserSchema.findById(hostId);
      if (host) {
        hostDetails.push({
          id: host.id,
          username: host.username,
          email: host.email
        });
      }
    }

    // Remove binary data from response
    delete event.host_images;
    delete event.gallery;
    delete event.payment_qr;

    // Add host details to the response
    const eventWithHosts = {
      ...event,
      hosts: hostDetails,
      has_host_images: event.host_images ? event.host_images.length > 0 : false,
      has_gallery: event.gallery ? event.gallery.length > 0 : false,
      has_payment_qr: event.payment_qr ? true : false
    };

    res.status(200).json(eventWithHosts);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get host images
router.get('/:id/host-images', async (req, res) => {
  try {
    const images = await EventSchema.getHostImages(req.params.id);
    
    if (!images || images.length === 0) {
      return res.status(404).json({ error: "No host images found" });
    }

    // Send first image as sample
    res.set('Content-Type', 'image/jpeg');
    res.send(images[0]);
  } catch (error) {
    console.error("Error fetching host images:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get specific host image by index
router.get('/:id/host-images/:index', async (req, res) => {
  try {
    const images = await EventSchema.getHostImages(req.params.id);
    const index = parseInt(req.params.index);
    
    if (!images || images.length === 0 || !images[index]) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.set('Content-Type', 'image/jpeg');
    res.send(images[index]);
  } catch (error) {
    console.error("Error fetching host image:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get gallery images
router.get('/:id/gallery/:index', async (req, res) => {
  try {
    const images = await EventSchema.getGalleryImages(req.params.id);
    const index = parseInt(req.params.index);
    
    if (!images || images.length === 0 || !images[index]) {
      return res.status(404).json({ error: "Gallery image not found" });
    }

    res.set('Content-Type', 'image/jpeg');
    res.send(images[index]);
  } catch (error) {
    console.error("Error fetching gallery image:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get payment QR image
router.get('/:id/payment-qr', async (req, res) => {
  try {
    const qrImage = await EventSchema.getPaymentQR(req.params.id);
    
    if (!qrImage) {
      return res.status(404).json({ error: "Payment QR not found" });
    }

    res.set('Content-Type', 'image/jpeg');
    res.send(qrImage);
  } catch (error) {
    console.error("Error fetching payment QR:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update event
router.put('/:id', authenticate, upload.fields([
  { name: 'hostImages', maxCount: 5 },
  { name: 'galleryImages', maxCount: 10 },
  { name: 'paymentQr', maxCount: 1 }
]), async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    
    // Check if event exists
    const existingEvent = await EventSchema.findById(eventId);
    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    // Check if user is a host of this event
    if (!existingEvent.host_ids.includes(userId)) {
      return res.status(403).json({ error: "Access denied. Only hosts can update this event" });
    }

    const updateData = {};
    const fields = [
      'name', 'description', 'event_date', 'event_time',
      'is_virtual', 'location', 'capacity', 'fee'
    ];

    // Update basic fields
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        // Convert to appropriate format for certain fields
        if (field === 'is_virtual') {
          updateData[field] = req.body[field] === 'true' || req.body[field] === true;
        } else if (field === 'capacity') {
          updateData[field] = parseInt(req.body[field]);
        } else if (field === 'fee') {
          updateData[field] = parseFloat(req.body[field]);
        } else {
          updateData[field] = req.body[field];
        }
      }
    });

    // Handle arrays and objects
    if (req.body.tags) {
      let formattedTags;
      if (typeof req.body.tags === 'string') {
        try {
          formattedTags = JSON.parse(req.body.tags);
        } catch (e) {
          formattedTags = req.body.tags.split(',').map(tag => tag.trim());
        }
      } else if (Array.isArray(req.body.tags)) {
        formattedTags = req.body.tags;
      }
      
      if (formattedTags) {
        updateData.tags = formattedTags;
      }
    }

    // Handle social links
    if (req.body.socialLinks) {
      try {
        updateData.social_links = typeof req.body.socialLinks === 'string' 
          ? JSON.parse(req.body.socialLinks) 
          : req.body.socialLinks;
      } catch (e) {
        return res.status(400).json({ error: "Invalid social links format" });
      }
    }

    // Update the event with non-binary data
    const updatedEvent = await EventSchema.update(eventId, updateData);
    
    // Process uploaded files
    if (req.files) {
      // Process host images - replacing existing ones
      if (req.files.hostImages && req.files.hostImages.length > 0) {
        // Reset host images array
        await EventSchema.update(eventId, { host_images: [] });
        
        // Add new host images
        for (const file of req.files.hostImages) {
          await EventSchema.addHostImage(eventId, file.buffer);
        }
      }
      
      // Process gallery images - adding to existing ones
      if (req.files.galleryImages && req.files.galleryImages.length > 0) {
        for (const file of req.files.galleryImages) {
          await EventSchema.addGalleryImage(eventId, file.buffer);
        }
      }
      
      // Process payment QR code - replace existing
      if (req.files.paymentQr && req.files.paymentQr[0]) {
        await EventSchema.updatePaymentQR(eventId, req.files.paymentQr[0].buffer);
      }
    }

    // Return the updated event without binary data
    const finalEvent = await EventSchema.findById(eventId);
    delete finalEvent.host_images;
    delete finalEvent.gallery;
    delete finalEvent.payment_qr;
    
    res.status(200).json({
      message: "Event updated successfully",
      event: finalEvent
    });
  } catch (error) {
    console.error("Event update error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete event
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    
    // Check if event exists
    const existingEvent = await EventSchema.findById(eventId);
    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    // Check if user is a host of this event
    if (!existingEvent.host_ids.includes(userId)) {
      return res.status(403).json({ error: "Access denied. Only hosts can delete this event" });
    }

    // Delete the event
    await EventSchema.delete(eventId);
    
    res.status(200).json({
      message: "Event deleted successfully"
    });
  } catch (error) {
    console.error("Event deletion error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Register for an event
router.post('/:id/register', authenticate, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    
    // Check if event exists
    const event = await EventSchema.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if event is at capacity
    if (event.capacity > 0 && event.current_registrations >= event.capacity) {
      return res.status(400).json({ error: "Event is at full capacity" });
    }

    // Increment registration count
    const updatedEvent = await EventSchema.incrementRegistration(eventId);
    if (!updatedEvent) {
      return res.status(400).json({ error: "Failed to register for event" });
    }

    // Here you would typically also record the user's registration in a separate registrations table
    // But we'll just return success for now

    res.status(200).json({
      message: "Successfully registered for event",
      event: updatedEvent
    });
  } catch (error) {
    console.error("Event registration error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get upcoming events
router.get('/upcoming/list', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const events = await EventSchema.getUpcomingEvents(limit);
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports=router