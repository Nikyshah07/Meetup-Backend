// models/Event.js
const { Pool } = require("pg");
require("dotenv").config(); // Load environment variables

// Connection config - using the same pool as User model
// const pool = new Pool({
//   host: process.env.HOST,
//   user: "postgres",
//   port: process.env.DATABASEPORT,
//   password: process.env.PASSWORD,
//   database: process.env.DATABASE,
//   ssl: {
//     rejectUnauthorized: false, // Often needed for remote connections
//   },Terminal: Select Default Profile
// });

const pool = new Pool({
  host: process.env.HOST,
  user: process.env.USER,
  port: process.env.DATABASEPORT,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  ssl: {
    require: true, // ✅ Important for Neon
    rejectUnauthorized: false, // allows self-signed certs
  }, // 👈 this disables SSL
});

// Event Schema definition
const EventSchema = {
  tableName: "events", // Different table than users

  // Schema definition
  fields: {
    id: { type: "SERIAL", primaryKey: true },
    name: { type: "VARCHAR(255)", notNull: true },
    host_ids: { type: "INTEGER[]", notNull: true }, // Array of user IDs as hosts
    // host_images: { type: "BYTEA[]", default: "ARRAY[]::BYTEA[]" },
    description: { type: "TEXT", default: null },
    event_date: { type: "DATE", notNull: true },
    event_time: { type: "TIME", notNull: true },
    // tags: { type: "VARCHAR(100)[]", default: "ARRAY[]::VARCHAR[]" },
    is_virtual: { type: "BOOLEAN", default: false },
    location: { type: "VARCHAR(255)", default: null }, // Physical location or virtual meeting link
    capacity: { type: "INTEGER", default: 0 },
    current_registrations: { type: "INTEGER", default: 0 },
    social_links: { type: "JSONB", default: "'{}'" }, // Store as JSON
    // gallery: { type: "BYTEA[]", default: "ARRAY[]::BYTEA[]" },
    host_images: { type: "BYTEA[]", default: "'{}'::BYTEA[]" },
    tags: { type: "VARCHAR(100)[]", default: "'{}'::VARCHAR[]" },
    gallery: { type: "BYTEA[]", default: "'{}'::BYTEA[]" },

    fee: { type: "NUMERIC(10,2)", default: 0 },
    payment_qr: { type: "BYTEA", default: null }, // QR code image as binary data
    created_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
    updated_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
  },

  // Create the table
  async createTable() {
    // const fieldDefinitions = Object.entries(this.fields)
    //   .map(([fieldName, attributes]) => {
    //     let definition = `${fieldName} ${attributes.type}`;

    //     if (attributes.primaryKey) definition += " PRIMARY KEY";
    //     if (attributes.notNull) definition += " NOT NULL";
    //     if (attributes.unique) definition += " UNIQUE";
    //     if (attributes.default) definition += ` DEFAULT ${attributes.default}`;

    //     return definition;
    //   })
    //   .join(", ");

    const fieldDefinitions = Object.entries(this.fields)
      .map(([fieldName, attributes]) => {
        let definition = `${fieldName} ${attributes.type}`;

        if (attributes.primaryKey) definition += " PRIMARY KEY";
        if (attributes.notNull) definition += " NOT NULL";
        if (attributes.unique) definition += " UNIQUE";

        if (attributes.default !== undefined) {
          // If default looks like a PostgreSQL expression (has quotes and casting), just add as is
          if (
            typeof attributes.default === "string" &&
            (attributes.default.includes("'") ||
              attributes.default.includes("::") ||
              attributes.default.includes("CURRENT_TIMESTAMP"))
          ) {
            definition += ` DEFAULT ${attributes.default}`;
          }
          // For plain string default values (without quotes), wrap with single quotes
          else if (typeof attributes.default === "string") {
            definition += ` DEFAULT '${attributes.default}'`;
          }
          // For other types (numbers, booleans), add as is
          else {
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

  // Create new event
  async create(eventData) {
    try {
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

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  },

  // Find event by ID
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

  // Get all events
  async findAll(limit = 10, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT id, name, host_ids, description, event_date, event_time, 
         tags, is_virtual, location, capacity, current_registrations, 
         social_links, fee, created_at, updated_at
         FROM ${this.tableName} 
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

  // Get events by host ID
  async findByHostId(hostId) {
    try {
      const result = await pool.query(
        `SELECT id, name, host_ids, description, event_date, event_time, 
         tags, is_virtual, location, capacity, current_registrations, 
         social_links, fee, created_at, updated_at
         FROM ${this.tableName} 
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

  // Get events by tags
  async findByTag(tag) {
    try {
      const result = await pool.query(
        `SELECT id, name, host_ids, description, event_date, event_time, 
         tags, is_virtual, location, capacity, current_registrations, 
         social_links, fee, created_at, updated_at
         FROM ${this.tableName} 
         WHERE $1 = ANY(tags) 
         ORDER BY event_date ASC, event_time ASC`,
        [tag]
      );
      return result.rows;
    } catch (error) {
      console.error("Error fetching events by tag:", error);
      throw error;
    }
  },

  // Update event
  async update(id, updateData) {
    try {
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

      // Add updated_at timestamp
      fields.push(`updated_at = CURRENT_TIMESTAMP`);

      // Add ID for WHERE clause
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

  // Add image to host_images array
  async addHostImage(id, imageData) {
    try {
      const query = `
        UPDATE ${this.tableName}
        SET host_images = array_append(host_images, $1)
        WHERE id = $2
        RETURNING id
      `;

      const result = await pool.query(query, [imageData, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error adding host image:", error);
      throw error;
    }
  },

  // Add image to gallery array
  async addGalleryImage(id, imageData) {
    try {
      const query = `
        UPDATE ${this.tableName}
        SET gallery = array_append(gallery, $1)
        WHERE id = $2
        RETURNING id
      `;

      const result = await pool.query(query, [imageData, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error adding gallery image:", error);
      throw error;
    }
  },

  // Update payment QR image
  async updatePaymentQR(id, qrImageData) {
    try {
      const query = `
        UPDATE ${this.tableName}
        SET payment_qr = $1
        WHERE id = $2
        RETURNING id
      `;

      const result = await pool.query(query, [qrImageData, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error updating payment QR:", error);
      throw error;
    }
  },

  // Get event host images
  async getHostImages(id) {
    try {
      const result = await pool.query(
        `SELECT host_images FROM ${this.tableName} WHERE id = $1`,
        [id]
      );
      return result.rows[0]?.host_images || [];
    } catch (error) {
      console.error("Error getting host images:", error);
      throw error;
    }
  },

  // Get event gallery images
  async getGalleryImages(id) {
    try {
      const result = await pool.query(
        `SELECT gallery FROM ${this.tableName} WHERE id = $1`,
        [id]
      );
      return result.rows[0]?.gallery || [];
    } catch (error) {
      console.error("Error getting gallery images:", error);
      throw error;
    }
  },

  // Get payment QR image
  async getPaymentQR(id) {
    try {
      const result = await pool.query(
        `SELECT payment_qr FROM ${this.tableName} WHERE id = $1`,
        [id]
      );
      return result.rows[0]?.payment_qr || null;
    } catch (error) {
      console.error("Error getting payment QR:", error);
      throw error;
    }
  },

  // Delete event
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

  // Increment registration count
  async incrementRegistration(id) {
    try {
      const result = await pool.query(
        `UPDATE ${this.tableName} 
         SET current_registrations = current_registrations + 1 
         WHERE id = $1 AND current_registrations < capacity
         RETURNING id, name, current_registrations, capacity`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error("Error incrementing registration:", error);
      throw error;
    }
  },

  // Decrement registration count
  async decrementRegistration(id) {
    try {
      const result = await pool.query(
        `UPDATE ${this.tableName} 
         SET current_registrations = GREATEST(current_registrations - 1, 0)
         WHERE id = $1
         RETURNING id, name, current_registrations, capacity`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error("Error decrementing registration:", error);
      throw error;
    }
  },

  // Get upcoming events
  async getUpcomingEvents(limit = 10) {
    try {
      const result = await pool.query(
        `SELECT id, name, host_ids, description, event_date, event_time, 
         tags, is_virtual, location, capacity, current_registrations, 
         social_links, fee, created_at, updated_at
         FROM ${this.tableName}
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

  // Search events by name or description
  async searchEvents(searchTerm, limit = 10) {
    try {
      const result = await pool.query(
        `SELECT id, name, host_ids, description, event_date, event_time, 
         tags, is_virtual, location, capacity, current_registrations, 
         social_links, fee, created_at, updated_at
         FROM ${this.tableName}
         WHERE name ILIKE $1 OR description ILIKE $1
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
};

module.exports = EventSchema;
