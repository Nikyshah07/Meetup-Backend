// const { Pool } = require("pg");
// require("dotenv").config();

// const pool = new Pool({
//   host: process.env.HOST,
//   user: process.env.USER,
//   port: process.env.DATABASEPORT,
//   password: process.env.PASSWORD,
//   database: process.env.DATABASE,
//   ssl: {
//     require: true,
//     rejectUnauthorized: false,
//   }
// });

// const EventSchema = {
//   tableName: "events",

//   fields: {
//     id: { type: "SERIAL", primaryKey: true },
//     event_name: { type: "VARCHAR(255)", notNull: true },
//     host_ids: { type: "INTEGER[]", notNull: true },
   
//     description: { type: "TEXT", default: null },
//     event_date: { type: "DATE", notNull: true },
//     event_time: { type: "TIME", notNull: true },
//     location: { type: "VARCHAR(255)", default: null },
//     event_tags: { type: "VARCHAR(100)[]", default: "'{}'" },
//     is_virtual: { type: "BOOLEAN", default: false }, // virtual -> online/offline
    
//     // Event Pricing - Free or Paid
//     is_free: { type: "BOOLEAN", default: true },
//     ticket_price: { type: "NUMERIC(10,2)", default: 0 },
    
//     // Host Details Arrays for multiple hosts
//     host_names: { type: "VARCHAR(255)[]", default: "'{}'" },
//     host_photos: { type: "BYTEA[]", default: "'{}'" },
//     host_instagram_urls: { type: "VARCHAR(500)[]", default: "'{}'" },
//     host_linkedin_urls: { type: "VARCHAR(500)[]", default: "'{}'" },
//     host_twitter_urls: { type: "VARCHAR(500)[]", default: "'{}'" },
    
//     //banner required

//     // Event Images
//     event_images: { type: "BYTEA[]", default: "'{}'" },
    
//     // Additional Details
//     duration: { type: "VARCHAR(50)", default: null }, // e.g., "2 hours"
//     seating: { type: "VARCHAR(100)", default: null },
//     language:{type : "VARCHAR(50)",default:null},
//     layout: { type: "VARCHAR(100)", default: null },
//     pet_allowance: { type: "VARCHAR(50)", default: null },
//     age_limit: { type: "VARCHAR(50)", default: null },
    
//     // Timestamps
//     created_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
//     updated_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
//   },

//   async createTable() {
//     const fieldDefinitions = Object.entries(this.fields)
//       .map(([fieldName, attributes]) => {
//         let definition = `${fieldName} ${attributes.type}`;

//         if (attributes.primaryKey) definition += " PRIMARY KEY";
//         if (attributes.notNull) definition += " NOT NULL";
//         if (attributes.unique) definition += " UNIQUE";

//         if (attributes.default !== undefined) {
//           if (
//             typeof attributes.default === "string" &&
//             (attributes.default.includes("'") ||
//               attributes.default.includes("::") ||
//               attributes.default.includes("CURRENT_TIMESTAMP"))
//           ) {
//             definition += ` DEFAULT ${attributes.default}`;
//           } else if (typeof attributes.default === "string") {
//             definition += ` DEFAULT '${attributes.default}'`;
//           } else {
//             definition += ` DEFAULT ${attributes.default}`;
//           }
//         }

//         return definition;
//       })
//       .join(", ");

//     const query = `CREATE TABLE IF NOT EXISTS ${this.tableName} (${fieldDefinitions})`;

//     try {
//       await pool.query(query);
//       console.log(`Table ${this.tableName} created or already exists`);
//       return true;
//     } catch (error) {
//       console.error(`Error creating ${this.tableName} table:`, error);
//       return false;
//     }
//   },

//   async create(eventData) {
//     try {
//       const fields = Object.keys(eventData).filter(
//         (key) => eventData[key] !== undefined
//       );
//       const placeholders = fields.map((_, index) => `$${index + 1}`);
//       const values = fields.map((field) => eventData[field]);

//       const query = `
//         INSERT INTO ${this.tableName} (${fields.join(", ")})
//         VALUES (${placeholders.join(", ")})
//         RETURNING *
//       `;

//       console.log("Insert Query:", query);
//       console.log("Insert Values:", values);

//       const result = await pool.query(query, values);
//       return result.rows[0];
//     } catch (error) {
//       console.error("Error creating event:", error);
//       throw error;
//     }
//   },

//   async findById(id) {
//     try {
//       const result = await pool.query(
//         `SELECT * FROM ${this.tableName} WHERE id = $1`,
//         [id]
//       );
//       return result.rows[0] || null;
//     } catch (error) {
//       console.error("Error finding event by ID:", error);
//       throw error;
//     }
//   },

//   // Get events with host user details (username, email, id)
//   async findAllWithHostDetails(limit = 10, offset = 0) {
//     try {
//       const query = `
//         SELECT 
//           e.*,
//           array_agg(
//             json_build_object(
//               'id', u.id,
//               'username', u.username,
//               'email', u.email,
//               'photo', u.photo
//             )
//           ) as host_user_details
//         FROM ${this.tableName} e
//         LEFT JOIN users u ON u.id = ANY(e.host_ids)
//         GROUP BY e.id
//         ORDER BY e.event_date ASC, e.event_time ASC 
//         LIMIT $1 OFFSET $2
//       `;
      
//       const result = await pool.query(query, [limit, offset]);
//       return result.rows;
//     } catch (error) {
//       console.error("Error fetching events with host details:", error);
//       throw error;
//     }
//   },

//   async findByIdWithHostDetails(id) {
//     try {
//       const query = `
//         SELECT 
//           e.*,
//           array_agg(
//             json_build_object(
//               'id', u.id,
//               'username', u.username,
//               'email', u.email,
//               'photo', u.photo
//             )
//           ) as host_user_details
//         FROM ${this.tableName} e
//         LEFT JOIN users u ON u.id = ANY(e.host_ids)
//         WHERE e.id = $1
//         GROUP BY e.id
//       `;
      
//       const result = await pool.query(query, [id]);
//       return result.rows[0] || null;
//     } catch (error) {
//       console.error("Error finding event by ID with host details:", error);
//       throw error;
//     }
//   },

//   async findAll(limit = 10, offset = 0) {
//     try {
//       const result = await pool.query(
//         `SELECT * FROM ${this.tableName} 
//          ORDER BY event_date ASC, event_time ASC 
//          LIMIT $1 OFFSET $2`,
//         [limit, offset]
//       );
//       return result.rows;
//     } catch (error) {
//       console.error("Error fetching all events:", error);
//       throw error;
//     }
//   },

//   async findByHostId(hostId) {
//     try {
//       const result = await pool.query(
//         `SELECT * FROM ${this.tableName} 
//          WHERE $1 = ANY(host_ids) 
//          ORDER BY event_date ASC, event_time ASC`,
//         [hostId]
//       );
//       return result.rows;
//     } catch (error) {
//       console.error("Error fetching events by host:", error);
//       throw error;
//     }
//   },

//   async update(id, updateData) {
//     try {
//       const fields = [];
//       const values = [];
//       let index = 1;

//       for (const key in updateData) {
//         if (updateData[key] !== undefined) {
//           fields.push(`${key} = $${index}`);
//           values.push(updateData[key]);
//           index++;
//         }
//       }

//       fields.push(`updated_at = CURRENT_TIMESTAMP`);
//       values.push(id);

//       const query = `
//         UPDATE ${this.tableName}  
//         SET ${fields.join(", ")}
//         WHERE id = $${index}
//         RETURNING *
//       `;

//       const result = await pool.query(query, values);
//       return result.rows[0] || null;
//     } catch (error) {
//       console.error("Error updating event:", error);
//       throw error;
//     }
//   },

//   async addEventImage(id, imageData) {
//     try {
//       const query = `
//         UPDATE ${this.tableName}
//         SET event_images = array_append(event_images, $1)
//         WHERE id = $2
//         RETURNING id
//       `;

//       const result = await pool.query(query, [imageData, id]);
//       return result.rows[0] || null;
//     } catch (error) {
//       console.error("Error adding event image:", error);
//       throw error;
//     }
//   },

//   async addHostPhoto(id, photoData, hostIndex) {
//     try {
//       const query = `
//         UPDATE ${this.tableName}
//         SET host_photos = array_append(host_photos, $1)
//         WHERE id = $2
//         RETURNING id
//       `;

//       const result = await pool.query(query, [photoData, id]);
//       return result.rows[0] || null;
//     } catch (error) {
//       console.error("Error adding host photo:", error);
//       throw error;
//     }
//   },

//   async delete(id) {
//     try {
//       const result = await pool.query(
//         `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id`,
//         [id]
//       );
//       return result.rows[0] || null;
//     } catch (error) {
//       console.error("Error deleting event:", error);
//       throw error;
//     }
//   },

//   async getUpcomingEvents(limit = 10) {
//     try {
//       const result = await pool.query(
//         `SELECT * FROM ${this.tableName}
//          WHERE event_date >= CURRENT_DATE
//          ORDER BY event_date ASC, event_time ASC
//          LIMIT $1`,
//         [limit]
//       );
//       return result.rows;
//     } catch (error) {
//       console.error("Error fetching upcoming events:", error);
//       throw error;
//     }
//   },

//   async searchEvents(searchTerm, limit = 10) {
//     try {
//       const result = await pool.query(
//         `SELECT * FROM ${this.tableName}
//          WHERE event_name ILIKE $1 OR description ILIKE $1
//          ORDER BY event_date ASC, event_time ASC
//          LIMIT $2`,
//         [`%${searchTerm}%`, limit]
//       );
//       return result.rows;
//     } catch (error) {
//       console.error("Error searching events:", error);
//       throw error;
//     }
//   },
// };

// module.exports = EventSchema;


// const { Pool } = require("pg");
// require("dotenv").config();

// const pool = new Pool({
//   host: process.env.HOST,
//   user: process.env.USER,
//   port: process.env.DATABASEPORT,
//   password: process.env.PASSWORD,
//   database: process.env.DATABASE,
//   ssl: {
//     require: true,
//     rejectUnauthorized: false,
//   }
// });

// const EventSchema = {
//   tableName: "events",

//   fields: {
//     id: { type: "SERIAL", primaryKey: true },
//     event_name: { type: "VARCHAR(255)", notNull: true },
//     host_ids: { type: "INTEGER[]", notNull: true },
   
//     description: { type: "TEXT", notNull:true },//new
//     event_date: { type: "DATE", notNull: true },
//     event_time: { type: "TIME", notNull: true },
    
//     // Single field for both location and link
//     venue_info: { type: "TEXT", notNull: true }, // This will store either location JSON or URL
    
//     event_tags: { type: "VARCHAR(100)[]", default: "'{}'" },
//     is_virtual: { type: "BOOLEAN", default: false }, // virtual -> online/offline
    
//     // Event Pricing - Free or Paid
//     is_free: { type: "BOOLEAN", default: true },
//     ticket_price: { type: "NUMERIC(10,2)", default: 0 },
    
//     // Host Details Arrays for multiple hosts
//     host_names: { type: "VARCHAR(255)[]", default: "'{}'" ,notNull:true},//new
//     host_photos: { type: "BYTEA[]", default: "'{}'" ,notNull:true},//new
//     host_banner: { type: "BYTEA", default: null }, // Single banner image
//     host_gallery: { type: "BYTEA[]", default: "'{}'" }, // Multiple gallery images
//     host_instagram_urls: { type: "VARCHAR(500)[]", default: "'{}'" },
//     host_linkedin_urls: { type: "VARCHAR(500)[]", default: "'{}'" },
//     host_twitter_urls: { type: "VARCHAR(500)[]", default: "'{}'" },
    
//     //banner required

//     // Event Images
//     event_images: { type: "BYTEA[]", default: "'{}'" },
    
//     // Additional Details
//     duration: { type: "VARCHAR(50)", default: null }, // e.g., "2 hours"
//     seating: { type: "VARCHAR(100)", default: null },
//     language:{type : "VARCHAR(50)",default:null},
//     layout: { type: "VARCHAR(100)", default: null },
//     pet_allowance: { type: "VARCHAR(50)", default: null },
//     age_limit: { type: "VARCHAR(50)", default: null },
    
//     // Timestamps
//     created_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
//     updated_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
//   },

//   // Enhanced validation method for virtual events
//   validateEventData(eventData) {
//     const errors = [];
    
//     // Check if venue_info is provided
//     if (!eventData.venue_info || eventData.venue_info.trim() === '') {
//       errors.push("Venue information is required (location for offline events, URL for virtual events)");
//       return errors;
//     }
    
//     if (eventData.is_virtual === true) {
//       // Online event - venue_info should be a valid URL
//       if (!this.isValidUrl(eventData.venue_info)) {
//         errors.push("Virtual events require a valid URL in venue_info field");
//       }
//     } else if (eventData.is_virtual === false) {
//       // Offline event - venue_info should be a location object with coordinates
//       if (!this.isValidLocation(eventData.venue_info)) {
//         errors.push("Offline events require a valid location with address and coordinates (latitude, longitude)");
//       }
//     }
    
//     return errors;
//   },

//   // URL validation helper
//   isValidUrl(string) {
//     try {
//       const url = new URL(string);
//       // Additional validation for common URL protocols
//       return ['http:', 'https:'].includes(url.protocol);
//     } catch (_) {
//       return false;
//     }
//   },

//   // Location validation helper - now validates location object with coordinates
//   isValidLocation(locationData) {
//     try {
//       // If it's a string, try to parse as JSON
//       let location;
//       if (typeof locationData === 'string') {
//         location = JSON.parse(locationData);
//       } else {
//         location = locationData;
//       }
      
//       // Check if it has required location properties
//       const hasRequiredFields = location && 
//         typeof location.address === 'string' && 
//         location.address.trim().length > 0 &&
//         typeof location.latitude === 'number' &&
//         typeof location.longitude === 'number' &&
//         location.latitude >= -90 && location.latitude <= 90 &&
//         location.longitude >= -180 && location.longitude <= 180;
      
//       return hasRequiredFields;
//     } catch (error) {
//       return false;
//     }
//   },

//   // Helper to create location object
//   createLocationObject(address, latitude, longitude, additionalInfo = {}) {
//     return {
//       address: address,
//       latitude: latitude,
//       longitude: longitude,
//       city: additionalInfo.city || null,
//       state: additionalInfo.state || null,
//       country: additionalInfo.country || null,
//       postal_code: additionalInfo.postal_code || null,
//       place_id: additionalInfo.place_id || null, // Google Places ID or similar
//       formatted_address: additionalInfo.formatted_address || address
//     };
//   },

//   // Helper to parse venue_info based on event type
//   parseVenueInfo(venue_info, is_virtual) {
//     if (is_virtual) {
//       return venue_info; // Return URL as is
//     } else {
//       try {
//         return JSON.parse(venue_info); // Parse location JSON
//       } catch (error) {
//         return null;
//       }
//     }
//   },

//   // Helper to get map URL for location
//   getMapUrl(venue_info, mapProvider = 'google') {
//     try {
//       const location = JSON.parse(venue_info);
//       const { latitude, longitude, address } = location;
      
//       switch (mapProvider) {
//         case 'google':
//           return `https://www.google.com/maps?q=${latitude},${longitude}`;
//         case 'openstreetmap':
//           return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`;
//         case 'apple':
//           return `https://maps.apple.com/?q=${latitude},${longitude}`;
//         default:
//           return `https://www.google.com/maps/search/${encodeURIComponent(address)}`;
//       }
//     } catch (error) {
//       return null;
//     }
//   },

//   // Helper method to get venue info based on event type
//   getVenueLabel(is_virtual) {
//     return is_virtual ? 'Event Link' : 'Event Location';
//   },

//   // Helper method to validate venue info format
//   validateVenueInfo(venue_info, is_virtual) {
//     if (is_virtual) {
//       return this.isValidUrl(venue_info);
//     } else {
//       return this.isValidLocation(venue_info);
//     }
//   },

//   async createTable() {
//     const fieldDefinitions = Object.entries(this.fields)
//       .map(([fieldName, attributes]) => {
//         let definition = `${fieldName} ${attributes.type}`;

//         if (attributes.primaryKey) definition += " PRIMARY KEY";
//         if (attributes.notNull) definition += " NOT NULL";
//         if (attributes.unique) definition += " UNIQUE";

//         if (attributes.default !== undefined) {
//           if (
//             typeof attributes.default === "string" &&
//             (attributes.default.includes("'") ||
//               attributes.default.includes("::") ||
//               attributes.default.includes("CURRENT_TIMESTAMP"))
//           ) {
//             definition += ` DEFAULT ${attributes.default}`;
//           } else if (typeof attributes.default === "string") {
//             definition += ` DEFAULT '${attributes.default}'`;
//           } else {
//             definition += ` DEFAULT ${attributes.default}`;
//           }
//         }

//         return definition;
//       })
//       .join(", ");

//     const query = `CREATE TABLE IF NOT EXISTS ${this.tableName} (${fieldDefinitions})`;

//     try {
//       await pool.query(query);
//       console.log(`Table ${this.tableName} created or already exists`);
//       return true;
//     } catch (error) {
//       console.error(`Error creating ${this.tableName} table:`, error);
//       return false;
//     }
//   },

//   async create(eventData) {
//     try {
//       // Validate event data
//       const validationErrors = this.validateEventData(eventData);
//       if (validationErrors.length > 0) {
//         throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
//       }

//       const fields = Object.keys(eventData).filter(
//         (key) => eventData[key] !== undefined
//       );
//       const placeholders = fields.map((_, index) => `$${index + 1}`);
//       const values = fields.map((field) => eventData[field]);

//       const query = `
//         INSERT INTO ${this.tableName} (${fields.join(", ")})
//         VALUES (${placeholders.join(", ")})
//         RETURNING *
//       `;

//       console.log("Insert Query:", query);
//       console.log("Insert Values:", values);

//       const result = await pool.query(query, values);
//       return result.rows[0];
//     } catch (error) {
//       console.error("Error creating event:", error);
//       throw error;
//     }
//   },

//   async findById(id) {
//     try {
//       const result = await pool.query(
//         `SELECT * FROM ${this.tableName} WHERE id = $1`,
//         [id]
//       );
//       return result.rows[0] || null;
//     } catch (error) {
//       console.error("Error finding event by ID:", error);
//       throw error;
//     }
//   },

//   // Get events with host user details (username, email, id)
//   async findAllWithHostDetails(limit = 10, offset = 0) {
//     try {
//       const query = `
//         SELECT 
//           e.*,
//           array_agg(
//             json_build_object(
//               'id', u.id,
//               'username', u.username,
//               'email', u.email,
//               'photo', u.photo
//             )
//           ) as host_user_details
//         FROM ${this.tableName} e
//         LEFT JOIN users u ON u.id = ANY(e.host_ids)
//         GROUP BY e.id
//         ORDER BY e.event_date ASC, e.event_time ASC 
//         LIMIT $1 OFFSET $2
//       `;
      
//       const result = await pool.query(query, [limit, offset]);
//       return result.rows;
//     } catch (error) {
//       console.error("Error fetching events with host details:", error);
//       throw error;
//     }
//   },

//   async findByIdWithHostDetails(id) {
//     try {
//       const query = `
//         SELECT 
//           e.*,
//           array_agg(
//             json_build_object(
//               'id', u.id,
//               'username', u.username,
//               'email', u.email,
//               'photo', u.photo
//             )
//           ) as host_user_details
//         FROM ${this.tableName} e
//         LEFT JOIN users u ON u.id = ANY(e.host_ids)
//         WHERE e.id = $1
//         GROUP BY e.id
//       `;
      
//       const result = await pool.query(query, [id]);
//       return result.rows[0] || null;
//     } catch (error) {
//       console.error("Error finding event by ID with host details:", error);
//       throw error;
//     }
//   },

//   async findAll(limit = 10, offset = 0) {
//     try {
//       const result = await pool.query(
//         `SELECT * FROM ${this.tableName} 
//          ORDER BY event_date ASC, event_time ASC 
//          LIMIT $1 OFFSET $2`,
//         [limit, offset]
//       );
//       return result.rows;
//     } catch (error) {
//       console.error("Error fetching all events:", error);
//       throw error;
//     }
//   },

//   async findByHostId(hostId) {
//     try {
//       const result = await pool.query(
//         `SELECT * FROM ${this.tableName} 
//          WHERE $1 = ANY(host_ids) 
//          ORDER BY event_date ASC, event_time ASC`,
//         [hostId]
//       );
//       return result.rows;
//     } catch (error) {
//       console.error("Error fetching events by host:", error);
//       throw error;
//     }
//   },

//   async update(id, updateData) {
//     try {
//       // Validate update data if it contains virtual event fields
//       if (updateData.hasOwnProperty('is_virtual') || updateData.hasOwnProperty('venue_info')) {
//         // Get current event data to merge with update data for validation
//         const currentEvent = await this.findById(id);
//         if (!currentEvent) {
//           throw new Error('Event not found');
//         }
        
//         const mergedData = { ...currentEvent, ...updateData };
//         const validationErrors = this.validateEventData(mergedData);
//         if (validationErrors.length > 0) {
//           throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
//         }
//       }

//       const fields = [];
//       const values = [];
//       let index = 1;

//       for (const key in updateData) {
//         if (updateData[key] !== undefined) {
//           fields.push(`${key} = $${index}`);
//           values.push(updateData[key]);
//           index++;
//         }
//       }

//       fields.push(`updated_at = CURRENT_TIMESTAMP`);
//       values.push(id);

//       const query = `
//         UPDATE ${this.tableName}  
//         SET ${fields.join(", ")}
//         WHERE id = $${index}
//         RETURNING *
//       `;

//       const result = await pool.query(query, values);
//       return result.rows[0] || null;
//     } catch (error) {
//       console.error("Error updating event:", error);
//       throw error;
//     }
//   },

//   async addEventImage(id, imageData) {
//     try {
//       const query = `
//         UPDATE ${this.tableName}
//         SET event_images = array_append(event_images, $1)
//         WHERE id = $2
//         RETURNING id
//       `;

//       const result = await pool.query(query, [imageData, id]);
//       return result.rows[0] || null;
//     } catch (error) {
//       console.error("Error adding event image:", error);
//       throw error;
//     }
//   },

//   async addHostPhoto(id, photoData, hostIndex) {
//     try {
//       const query = `
//         UPDATE ${this.tableName}
//         SET host_photos = array_append(host_photos, $1)
//         WHERE id = $2
//         RETURNING id
//       `;

//       const result = await pool.query(query, [photoData, id]);
//       return result.rows[0] || null;
//     } catch (error) {
//       console.error("Error adding host photo:", error);
//       throw error;
//     }
//   },

//   // Set host banner (single image)
//   async setHostBanner(id, bannerData) {
//     try {
//       const query = `
//         UPDATE ${this.tableName}
//         SET host_banner = $1
//         WHERE id = $2
//         RETURNING id
//       `;

//       const result = await pool.query(query, [bannerData, id]);
//       return result.rows[0] || null;
//     } catch (error) {
//       console.error("Error setting host banner:", error);
//       throw error;
//     }
//   },

//   // Add image to host gallery (multiple images)
//   async addHostGalleryImage(id, imageData) {
//     try {
//       const query = `
//         UPDATE ${this.tableName}
//         SET host_gallery = array_append(host_gallery, $1)
//         WHERE id = $2
//         RETURNING id
//       `;

//       const result = await pool.query(query, [imageData, id]);
//       return result.rows[0] || null;
//     } catch (error) {
//       console.error("Error adding host gallery image:", error);
//       throw error;
//     }
//   },

//   // Remove image from host gallery
//   async removeHostGalleryImage(id, imageIndex) {
//     try {
//       const query = `
//         UPDATE ${this.tableName}
//         SET host_gallery = array_remove(host_gallery, host_gallery[$1])
//         WHERE id = $2
//         RETURNING id
//       `;

//       const result = await pool.query(query, [imageIndex + 1, id]); // PostgreSQL arrays are 1-indexed
//       return result.rows[0] || null;
//     } catch (error) {
//       console.error("Error removing host gallery image:", error);
//       throw error;
//     }
//   },

//   async delete(id) {
//     try {
//       const result = await pool.query(
//         `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id`,
//         [id]
//       );
//       return result.rows[0] || null;
//     } catch (error) {
//       console.error("Error deleting event:", error);
//       throw error;
//     }
//   },

//   async getUpcomingEvents(limit = 10) {
//     try {
//       const result = await pool.query(
//         `SELECT * FROM ${this.tableName}
//          WHERE event_date >= CURRENT_DATE
//          ORDER BY event_date ASC, event_time ASC
//          LIMIT $1`,
//         [limit]
//       );
//       return result.rows;
//     } catch (error) {
//       console.error("Error fetching upcoming events:", error);
//       throw error;
//     }
//   },

//   async searchEvents(searchTerm, limit = 10) {
//     try {
//       const result = await pool.query(
//         `SELECT * FROM ${this.tableName}
//          WHERE event_name ILIKE $1 OR description ILIKE $1
//          ORDER BY event_date ASC, event_time ASC
//          LIMIT $2`,
//         [`%${searchTerm}%`, limit]
//       );
//       return result.rows;
//     } catch (error) {
//       console.error("Error searching events:", error);
//       throw error;
//     }
//   },

//   // Get virtual events only
//   async getVirtualEvents(limit = 10, offset = 0) {
//     try {
//       const result = await pool.query(
//         `SELECT * FROM ${this.tableName}
//          WHERE is_virtual = true
//          ORDER BY event_date ASC, event_time ASC
//          LIMIT $1 OFFSET $2`,
//         [limit, offset]
//       );
//       return result.rows;
//     } catch (error) {
//       console.error("Error fetching virtual events:", error);
//       throw error;
//     }
//   },

//   // Get offline events only
//   async getOfflineEvents(limit = 10, offset = 0) {
//     try {
//       const result = await pool.query(
//         `SELECT * FROM ${this.tableName}
//          WHERE is_virtual = false
//          ORDER BY event_date ASC, event_time ASC
//          LIMIT $1 OFFSET $2`,
//         [limit, offset]
//       );
//       return result.rows;
//     } catch (error) {
//       console.error("Error fetching offline events:", error);
//       throw error;
//     }
//   },

//   // Search events by location (for offline events)
//   async searchByLocation(locationTerm, limit = 10) {
//     try {
//       const result = await pool.query(
//         `SELECT * FROM ${this.tableName}
//          WHERE is_virtual = false AND venue_info ILIKE $1
//          ORDER BY event_date ASC, event_time ASC
//          LIMIT $2`,
//         [`%${locationTerm}%`, limit]
//       );
//       return result.rows;
//     } catch (error) {
//       console.error("Error searching events by location:", error);
//       throw error;
//     }
//   },

//   // Search events by coordinates (nearby events)
//   async searchNearbyEvents(latitude, longitude, radiusKm = 10, limit = 10) {
//     try {
//       const query = `
//         SELECT *, 
//         (6371 * acos(cos(radians($1)) * cos(radians(CAST(venue_info->>'latitude' AS FLOAT))) 
//         * cos(radians(CAST(venue_info->>'longitude' AS FLOAT)) - radians($2)) 
//         + sin(radians($1)) * sin(radians(CAST(venue_info->>'latitude' AS FLOAT))))) AS distance
//         FROM ${this.tableName}
//         WHERE is_virtual = false 
//         AND venue_info->>'latitude' IS NOT NULL 
//         AND venue_info->>'longitude' IS NOT NULL
//         HAVING distance < $3
//         ORDER BY distance ASC, event_date ASC
//         LIMIT $4
//       `;
      
//       const result = await pool.query(query, [latitude, longitude, radiusKm, limit]);
//       return result.rows;
//     } catch (error) {
//       console.error("Error searching nearby events:", error);
//       throw error;
//     }
//   },

//   // Search events by city/state
//   async searchByCity(city, limit = 10) {
//     try {
//       const result = await pool.query(
//         `SELECT * FROM ${this.tableName}
//          WHERE is_virtual = false AND (
//            venue_info->>'city' ILIKE $1 OR 
//            venue_info->>'address' ILIKE $1 OR
//            venue_info->>'formatted_address' ILIKE $1
//          )
//          ORDER BY event_date ASC, event_time ASC
//          LIMIT $2`,
//         [`%${city}%`, limit]
//       );
//       return result.rows;
//     } catch (error) {
//       console.error("Error searching events by city:", error);
//       throw error;
//     }
//   },

//   // Get events by venue type
//   async getEventsByVenueType(is_virtual, limit = 10, offset = 0) {
//     try {
//       const result = await pool.query(
//         `SELECT * FROM ${this.tableName}
//          WHERE is_virtual = $1
//          ORDER BY event_date ASC, event_time ASC
//          LIMIT $2 OFFSET $3`,
//         [is_virtual, limit, offset]
//       );
//       return result.rows;
//     } catch (error) {
//       console.error("Error fetching events by venue type:", error);
//       throw error;
//     }
//   },
// };

// module.exports = EventSchema;




const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.HOST,
  user: process.env.DB_USER,
  port: process.env.DATABASEPORT,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  }
});

const EventSchema = {
  tableName: "events",

  fields: {
    id: { type: "SERIAL", primaryKey: true },
    event_name: { type: "VARCHAR(255)", notNull: true },
    host_ids: { type: "INTEGER[]", notNull: true },
   
    description: { type: "TEXT", notNull:true },
    event_date: { type: "DATE", notNull: true },
    event_time: { type: "TIME", notNull: true },
    
    // Simple location field - either text location or URL
    location: { type: "TEXT", notNull: true },
    
    event_tags: { type: "VARCHAR(100)[]", default: "'{}'" },
    is_virtual: { type: "BOOLEAN", default: false },
    
    // Event Pricing - Free or Paid
    is_free: { type: "BOOLEAN", default: true },
    ticket_price: { type: "NUMERIC(10,2)", default: 0 },
    
    // Host Details Arrays for multiple hosts
    host_names: { type: "VARCHAR(255)[]", default: "'{}'" ,notNull:true},
    host_photos: { type: "BYTEA[]",default: "'{}'" ,notNull:true},//remove
    host_banner: { type: "BYTEA", default: null },
    host_gallery: { type: "BYTEA[]", default: "'{}'" },
    host_instagram_urls: { type: "VARCHAR(500)[]", default: "'{}'" },
    host_linkedin_urls: { type: "VARCHAR(500)[]", default: "'{}'" },
    host_twitter_urls: { type: "VARCHAR(500)[]", default: "'{}'" },

    // Event Images
    event_images: { type: "BYTEA[]" ,notNull:'true'},//remove
    
    // Additional Details
    duration: { type: "VARCHAR(50)", default: null },
    seating: { type: "VARCHAR(100)", default: null },
    language:{type : "VARCHAR(50)",default:null},
    layout: { type: "VARCHAR(100)", default: null },
    pet_allowance: { type: "VARCHAR(50)", default: null },
    age_limit: { type: "VARCHAR(50)", default: null },
    likes: { type: "INTEGER[]", default: "'{}'" },

    // Timestamps
    created_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
    updated_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
  },

  // Simple validation method
  validateEventData(eventData) {
    const errors = [];
    
    // Check if location is provided
    if (!eventData.location || eventData.location.trim() === '') {
      errors.push("Location is required");
      return errors;
    }
    
    if (eventData.is_virtual === true) {
      // Virtual event - location should be a valid URL
      if (!this.isValidUrl(eventData.location)) {
        errors.push("Please enter valid URL for virtual events");
      }
    }
    // For offline events, any text is acceptable
    
    return errors;
  },

  // URL validation helper
  isValidUrl(string) {
    try {
      const url = new URL(string);
      // Check for valid protocols
      return ['http:', 'https:'].includes(url.protocol);
    } catch (_) {
      return false;
    }
  },

  async createTable() {
    const fieldDefinitions = Object.entries(this.fields)
      .map(([fieldName, attributes]) => {
        let definition = `${fieldName} ${attributes.type}`;

        if (attributes.primaryKey) definition += " PRIMARY KEY";
        if (attributes.notNull) definition += " NOT NULL";
        if (attributes.unique) definition += " UNIQUE";

        if (attributes.default !== undefined) {
          if (
            typeof attributes.default === "string" &&
            (attributes.default.includes("'") ||
              attributes.default.includes("::") ||
              attributes.default.includes("CURRENT_TIMESTAMP"))
          ) {
            definition += ` DEFAULT ${attributes.default}`;
          } else if (typeof attributes.default === "string") {
            definition += ` DEFAULT '${attributes.default}'`;
          } else {
            definition += ` DEFAULT ${attributes.default}`;
          }
        }

        return definition;
      })
      .join(", ");

    const query = `CREATE TABLE IF NOT EXISTS ${this.tableName} (${fieldDefinitions})`;

    try {
      await pool.query(query);
      console.log(`Table ${this.tableName} created or already exists`);
      return true;
    } catch (error) {
      console.error(`Error creating ${this.tableName} table:`, error);
      return false;
    }
  },

  async create(eventData) {
    try {
      // Validate event data
      const validationErrors = this.validateEventData(eventData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      const fields = Object.keys(eventData).filter(
        (key) => eventData[key] !== undefined
      );
      const placeholders = fields.map((_, index) => `$${index + 1}`);
      const values = fields.map((field) => eventData[field]);

      const query = `
        INSERT INTO ${this.tableName} (${fields.join(", ")})
        VALUES (${placeholders.join(", ")})
        RETURNING *
      `;

      console.log("Insert Query:", query);
      console.log("Insert Values:", values);

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  },

  async findById(id) {
    try {
      const result = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding event by ID:", error);
      throw error;
    }
  },

  // Get events with host user details (username, email, id)
  async findAllWithHostDetails(limit = 10, offset = 0) {
    try {
      const query = `
        SELECT 
          e.*,
          array_agg(
            json_build_object(
              'id', u.id,
              'username', u.username,
              'email', u.email,
              'photo', u.photo
            )
          ) as host_user_details
        FROM ${this.tableName} e
        LEFT JOIN users u ON u.id = ANY(e.host_ids)
        GROUP BY e.id
        ORDER BY e.event_date ASC, e.event_time ASC 
        LIMIT $1 OFFSET $2
      `;
      
      const result = await pool.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      console.error("Error fetching events with host details:", error);
      throw error;
    }
  },

  async findByIdWithHostDetails(id) {
    try {
      const query = `
        SELECT 
          e.*,
          array_agg(
            json_build_object(
              'id', u.id,
              'username', u.username,
              'email', u.email,
              'photo', u.photo
            )
          ) as host_user_details
        FROM ${this.tableName} e
        LEFT JOIN users u ON u.id = ANY(e.host_ids)
        WHERE e.id = $1
        GROUP BY e.id
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding event by ID with host details:", error);
      throw error;
    }
  },

  async findAll(limit = 10, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT * FROM ${this.tableName} 
         ORDER BY event_date ASC, event_time ASC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      return result.rows;
    } catch (error) {
      console.error("Error fetching all events:", error);
      throw error;
    }
  },

  async findByHostId(hostId) {
    try {
      const result = await pool.query(
        `SELECT * FROM ${this.tableName} 
         WHERE $1 = ANY(host_ids) 
         ORDER BY event_date ASC, event_time ASC`,
        [hostId]
      );
      return result.rows;
    } catch (error) {
      console.error("Error fetching events by host:", error);
      throw error;
    }
  },

  async update(id, updateData) {
    try {
      // Validate update data if it contains virtual event fields
      if (updateData.hasOwnProperty('is_virtual') || updateData.hasOwnProperty('location')) {
        // Get current event data to merge with update data for validation
        const currentEvent = await this.findById(id);
        if (!currentEvent) {
          throw new Error('Event not found');
        }
        
        const mergedData = { ...currentEvent, ...updateData };
        const validationErrors = this.validateEventData(mergedData);
        if (validationErrors.length > 0) {
          throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
        }
      }

      const fields = [];
      const values = [];
      let index = 1;

      for (const key in updateData) {
        if (updateData[key] !== undefined) {
          fields.push(`${key} = $${index}`);
          values.push(updateData[key]);
          index++;
        }
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const query = `
        UPDATE ${this.tableName}  
        SET ${fields.join(", ")}
        WHERE id = $${index}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error updating event:", error);
      throw error;
    }
  },

  async addEventImage(id, imageData) {
    try {
      const query = `
        UPDATE ${this.tableName}
        SET event_images = array_append(event_images, $1)
        WHERE id = $2
        RETURNING id
      `;

      const result = await pool.query(query, [imageData, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error adding event image:", error);
      throw error;
    }
  },

  async addHostPhoto(id, photoData, hostIndex) {
    try {
      const query = `
        UPDATE ${this.tableName}
        SET host_photos = array_append(host_photos, $1)
        WHERE id = $2
        RETURNING id
      `;

      const result = await pool.query(query, [photoData, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error adding host photo:", error);
      throw error;
    }
  },

  // Set host banner (single image)
  async setHostBanner(id, bannerData) {
    try {
      const query = `
        UPDATE ${this.tableName}
        SET host_banner = $1
        WHERE id = $2
        RETURNING id
      `;

      const result = await pool.query(query, [bannerData, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error setting host banner:", error);
      throw error;
    }
  },

  // Add image to host gallery (multiple images)
  async addHostGalleryImage(id, imageData) {
    try {
      const query = `
        UPDATE ${this.tableName}
        SET host_gallery = array_append(host_gallery, $1)
        WHERE id = $2
        RETURNING id
      `;

      const result = await pool.query(query, [imageData, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error adding host gallery image:", error);
      throw error;
    }
  },

  // Remove image from host gallery
  async removeHostGalleryImage(id, imageIndex) {
    try {
      const query = `
        UPDATE ${this.tableName}
        SET host_gallery = array_remove(host_gallery, host_gallery[$1])
        WHERE id = $2
        RETURNING id
      `;

      const result = await pool.query(query, [imageIndex + 1, id]); // PostgreSQL arrays are 1-indexed
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error removing host gallery image:", error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const result = await pool.query(
        `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error deleting event:", error);
      throw error;
    }
  },

  async getUpcomingEvents(limit = 10) {
    try {
      const result = await pool.query(
        `SELECT * FROM ${this.tableName}
         WHERE event_date >= CURRENT_DATE
         ORDER BY event_date ASC, event_time ASC
         LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      throw error;
    }
  },

  async searchEvents(searchTerm, limit = 10) {
    try {
      const result = await pool.query(
        `SELECT * FROM ${this.tableName}
         WHERE event_name ILIKE $1 OR description ILIKE $1
         ORDER BY event_date ASC, event_time ASC
         LIMIT $2`,
        [`%${searchTerm}%`, limit]
      );
      return result.rows;
    } catch (error) {
      console.error("Error searching events:", error);
      throw error;
    }
  },

  // Get virtual events only
  async getVirtualEvents(limit = 10, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT * FROM ${this.tableName}
         WHERE is_virtual = true
         ORDER BY event_date ASC, event_time ASC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      return result.rows;
    } catch (error) {
      console.error("Error fetching virtual events:", error);
      throw error;
    }
  },

  // Get offline events only
  async getOfflineEvents(limit = 10, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT * FROM ${this.tableName}
         WHERE is_virtual = false
         ORDER BY event_date ASC, event_time ASC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      return result.rows;
    } catch (error) {
      console.error("Error fetching offline events:", error);
      throw error;
    }
  },

  // Search events by location text (for offline events)
  async searchByLocation(locationTerm, limit = 10) {
    try {
      const result = await pool.query(
        `SELECT * FROM ${this.tableName}
         WHERE is_virtual = false AND location ILIKE $1
         ORDER BY event_date ASC, event_time ASC
         LIMIT $2`,
        [`%${locationTerm}%`, limit]
      );
      return result.rows;
    } catch (error) {
      console.error("Error searching events by location:", error);
      throw error;
    }
  },

  // Get events by venue type
  async getEventsByVenueType(is_virtual, limit = 10, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT * FROM ${this.tableName}
         WHERE is_virtual = $1
         ORDER BY event_date ASC, event_time ASC
         LIMIT $2 OFFSET $3`,
        [is_virtual, limit, offset]
      );
      return result.rows;
    } catch (error) {
      console.error("Error fetching events by venue type:", error);
      throw error;
    }
  },
};

module.exports = EventSchema;