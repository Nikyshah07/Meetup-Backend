const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.HOST,
  user: process.env.USER,
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
   
    description: { type: "TEXT", default: null },
    event_date: { type: "DATE", notNull: true },
    event_time: { type: "TIME", notNull: true },
    location: { type: "VARCHAR(255)", default: null },
    event_tags: { type: "VARCHAR(100)[]", default: "'{}'" },
    is_virtual: { type: "BOOLEAN", default: false }, // virtual -> online/offline
    
    // Event Pricing - Free or Paid
    is_free: { type: "BOOLEAN", default: true },
    ticket_price: { type: "NUMERIC(10,2)", default: 0 },
    
    // Host Details Arrays for multiple hosts
    host_names: { type: "VARCHAR(255)[]", default: "'{}'" },
    host_photos: { type: "BYTEA[]", default: "'{}'" },
    host_instagram_urls: { type: "VARCHAR(500)[]", default: "'{}'" },
    host_linkedin_urls: { type: "VARCHAR(500)[]", default: "'{}'" },
    host_twitter_urls: { type: "VARCHAR(500)[]", default: "'{}'" },
    
    // Event Images
    event_images: { type: "BYTEA[]", default: "'{}'" },
    
    // Additional Details
    duration: { type: "VARCHAR(50)", default: null }, // e.g., "2 hours"
    seating: { type: "VARCHAR(100)", default: null },
    language:{type : "VARCHAR(50)",default:null},
    layout: { type: "VARCHAR(100)", default: null },
    pet_allowance: { type: "VARCHAR(50)", default: null },
    age_limit: { type: "VARCHAR(50)", default: null },
    
    // Timestamps
    created_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
    updated_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
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
};

module.exports = EventSchema;