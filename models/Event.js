const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.HOST,
  user: process.env.DB_USER,
  port: process.env.DATABASEPORT,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,

  
  // ssl: {
  //   // require: true,
  //   rejectUnauthorized: false,
  // }
 ssl: {
    require: true,
    rejectUnauthorized: false,
  },
    family: 4,
});
console.log("Connecting with config:", {
  host: process.env.HOST,
  user: process.env.DB_USER,
  database: process.env.DATABASE,
  port: process.env.DATABASEPORT,
  ssl: {
    require: true,
    rejectUnauthorized: false
  },
  family: 4
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
    // host_photos: { type: "BYTEA[]",default: "'{}'" ,notNull:true},//remove
    // host_banner: { type: "BYTEA", default: null },
    // host_gallery: { type: "BYTEA[]", default: "'{}'" },
    host_instagram_urls: { type: "VARCHAR(500)[]", default: "'{}'" },
    host_linkedin_urls: { type: "VARCHAR(500)[]", default: "'{}'" },
    host_twitter_urls: { type: "VARCHAR(500)[]", default: "'{}'" },
   host_photos: { type: "TEXT[]", default: "'{}'" , notNull:true },
host_banner: { type: "TEXT", default: null },
host_gallery: { type: "TEXT[]", default: "'{}'" },
event_images: { type: "TEXT[]", default: "'{}'" },
    // Event Images
    // event_images: { type: "BYTEA[]", default: "'{}'" },
    
    // Additional Details
    duration: { type: "VARCHAR(50)", default: null },
    seating: { type: "VARCHAR(100)", default: null },
    language:{type : "VARCHAR(50)",default:null},
    layout: { type: "VARCHAR(100)", default: null },
    pet_allowance: { type: "VARCHAR(50)", default: null },
    age_limit: { type: "VARCHAR(50)", default: null },
    likes: { type: "INTEGER[]", default: "'{}'" },
    total_likes: { type: "INTEGER", default: 0 },
    // comments: { type: "INTEGER[]", default: "'{}'" },
    comments: { 
  type: "JSONB", 
  default: "'[]'::jsonb" 
},
total_comments: { type: "INTEGER", default: 0 },
is_comment: { type: "BOOLEAN", default: false },
saved_by: { type: "INTEGER[]", default: "'{}'" },

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

      // for (const key in updateData) {
      //   if (updateData[key] !== undefined) {
      //     fields.push(`${key} = $${index}`);
      //     values.push(updateData[key]);
      //     index++;
      //   }
      // }

      // ✅ Fixed code //new added
for (const key in updateData) {
  if (updateData[key] !== undefined) {
    // Handle JSONB fields specially
    if (key === 'comments' && typeof updateData[key] === 'object') {
      fields.push(`${key} = $${index}`);
      values.push(JSON.stringify(updateData[key])); // Convert to JSON string
    } else {
      fields.push(`${key} = $${index}`);
      values.push(updateData[key]);
    }
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


async addComment(eventId, userId, commentText) {
  try {
    console.log("=== ADD COMMENT DEBUG ===");
    console.log("EventId:", eventId, "UserId:", userId, "CommentText:", commentText);

    const event = await this.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    console.log("Current comments from DB:", event.comments);
    console.log("Type of comments:", typeof event.comments);

    // ✅ FIX: Handle JSONB properly - PostgreSQL returns JSONB as already parsed objects
    let comments = [];
    
    if (event.comments) {
      if (Array.isArray(event.comments)) {
        // Already an array (JSONB is auto-parsed by PostgreSQL driver)
        comments = event.comments;
      } else if (typeof event.comments === 'object') {
        // It's an object but might be empty JSONB
        comments = Array.isArray(event.comments) ? event.comments : [];
      } else if (typeof event.comments === 'string') {
        // Only parse if it's actually a string (shouldn't happen with JSONB)
        try {
          comments = JSON.parse(event.comments);
        } catch (parseError) {
          console.log("Error parsing comments, using empty array:", parseError);
          comments = [];
        }
      }
    }

    // Ensure comments is always an array
    if (!Array.isArray(comments)) {
      console.log("Comments is not an array, creating empty array");
      comments = [];
    }

    console.log("Processed comments array:", comments);

    const newComment = {
      id: Date.now() + Math.floor(Math.random() * 1000), // More unique ID
      user_id: parseInt(userId),
      comment_text: commentText,
      created_at: new Date().toISOString()
    };

    console.log("New comment:", newComment);

    const newComments = [...comments, newComment];

    console.log("Final comments array:", newComments);

    // ✅ FIX: Pass the array directly - PostgreSQL will handle JSONB conversion
    const updatedEvent = await this.update(eventId, {
      comments: newComments, // Don't stringify! PostgreSQL handles JSONB automatically
      total_comments: newComments.length,
      is_comment: newComments.length > 0
    });

    console.log("✅ Comment added successfully");

    return {
      ...updatedEvent,
      total_comments: newComments.length,
      is_comment: newComments.length > 0
    };
  } catch (error) {
    console.error("❌ Error in addComment:", error);
    throw error;
  }
},

async removeComment(eventId, commentId, userId) {
  try {
    console.log("=== REMOVE COMMENT DEBUG ===");
    console.log("EventId:", eventId, "CommentId:", commentId, "UserId:", userId);

    const event = await this.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    console.log("Current comments:", event.comments);

    // ✅ FIX: Handle JSONB properly
    let comments = [];
    
    if (event.comments) {
      if (Array.isArray(event.comments)) {
        comments = event.comments;
      } else if (typeof event.comments === 'object') {
        comments = Array.isArray(event.comments) ? event.comments : [];
      } else if (typeof event.comments === 'string') {
        try {
          comments = JSON.parse(event.comments);
        } catch (parseError) {
          console.log("Error parsing comments:", parseError);
          comments = [];
        }
      }
    }

    if (!Array.isArray(comments)) {
      comments = [];
    }

    console.log("Before removal:", comments);

    // Remove the comment
    const newComments = comments.filter(
      (comment) => !(comment.id == commentId && comment.user_id == userId)
    );

    console.log("After removal:", newComments);

    // ✅ FIX: Pass array directly
    const updatedEvent = await this.update(eventId, {
      comments: newComments, // Don't stringify!
      total_comments: newComments.length,
      is_comment: newComments.length > 0
    });

    console.log("✅ Comment removed successfully");

    return {
      ...updatedEvent,
      total_comments: newComments.length,
      is_comment: newComments.length > 0
    };
  } catch (error) {
    console.error("❌ Error in removeComment:", error);
    throw error;
  }
},
}




module.exports = EventSchema;