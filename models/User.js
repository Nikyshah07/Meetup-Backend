// models/User.js
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
require("dotenv").config();

// Connection config
const pool = new Pool({
  host: process.env.HOST,
  user: process.env.USER,
  port: process.env.DATABASEPORT,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
});

// User Schema definition
const UserSchema = {
  tableName: "users",

  // Schema definition
  fields: {
    id: { type: "SERIAL", primaryKey: true },
    username: { type: "VARCHAR(100)", default:null  },
    email: { type: "VARCHAR(100)", notNull: true, unique: true },
    password: { type: "VARCHAR(255)", default:null },
    gender: { type: "VARCHAR(20)", default: null }, // NEW
    city: { type: "VARCHAR(100)", default: null }, // NEW
    photo: { type: "TEXT" ,default:null},
    auth_type: { type: "VARCHAR(20)", default: "EMAIL" },
    created_at: { type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
  },

  // Create the table
  async createTable() {
    const fieldDefinitions = Object.entries(this.fields)
      .map(([fieldName, attributes]) => {
        let definition = `${fieldName} ${attributes.type}`;

        if (attributes.primaryKey) definition += " PRIMARY KEY";
        // if (attributes.notNull) definition += " NOT NULL";
        if (attributes.unique) definition += " UNIQUE";
        if (attributes.default) definition += ` DEFAULT ${attributes.default}`;

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

  // Find user by email
  async findByEmail(email) {
    try {
      const result = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE email = $1`,
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding user by email:", error);
      throw error;
    }
  },

  // Find user by ID
  async findById(id) {
    try {
      const result = await pool.query(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding user by ID:", error);
      throw error;
    }
  },

  // Create new user
  // async create(userData) {
  //   try {
  //     // Hash password
  //     const saltRounds = 10;
  //     const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

  //     const result = await pool.query(
  //       `INSERT INTO ${this.tableName} (username, email, password, photo, auth_type) 
  //               VALUES ($1, $2, $3, $4, $5) 
  //               RETURNING id, username, email, photo,auth_type, created_at`,
  //       [
  //         userData.username,
  //         userData.email,
  //         hashedPassword ,
  //         userData.photo,
  //         userData.auth_type || "EMAIL",
  //       ]
  //     );

  //     return result.rows[0];
  //   } catch (error) {
  //     console.error("Error creating user:", error);
  //     throw error;
  //   }
  // },

  async create(userData) {
    try {
      const saltRounds = 10;
      let hashedPassword = null;
      if (userData.password) {
        hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      }
  
      const query = `
        INSERT INTO ${this.tableName} (username, email, password, photo, auth_type)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, username, email, photo, auth_type, created_at
      `;
  
      const values = [
        userData.username || null,
        userData.email,
        hashedPassword,
        userData.photo || null,
        userData.auth_type || "EMAIL",
      ];
  
      const result = await pool.query(query, values);
  
      return result.rows[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },
  
  // async create(userData) {
  //   try {
      

  //     const result = await pool.query(
  //       `INSERT INTO ${this.tableName} (email) 
  //               VALUES ($1) 
  //               RETURNING id,  email,created_at`,
  //       [
          
  //         userData.email,
          
  //       ]
  //     );

  //     return result.rows[0];
  //   } catch (error) {
  //     console.error("Error creating user:", error);
  //     throw error;
  //   }
  // },


  // Get all users (for admin purposes)
  async findAll() {
    try {
      const result = await pool.query(
        `SELECT id, username, email, created_at FROM ${this.tableName}`
      );
      return result.rows;
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw error;
    }
  },

  // Validate password
  async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },



  async updatePassword(email, newHashedPassword) {
    try {
      const result = await pool.query(
        `UPDATE ${this.tableName} 
         SET password = $1 
         WHERE email = $2 
         RETURNING id, email`,
        [newHashedPassword, email]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error updating user password:", error);
      throw error;
    }
  },


  async updateProfileByEmail(email, updatedData) {
    try {
      const fields = [];
      const values = [];
      let index = 1;
  
      for (let key in updatedData) {
        if (updatedData[key] !== undefined) {
          fields.push(`${key} = $${index}`);
          values.push(updatedData[key]);
          index++;
        }
      }
  
      // Add email for WHERE clause
      values.push(email);
  
      const query = `
        UPDATE ${this.tableName}
        SET ${fields.join(", ")}
        WHERE email = $${index}
        RETURNING id, username, email, photo, gender, city, auth_type, created_at
      `;
  
      const result = await pool.query(query, values);
      return result.rows[0] || null;
  
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }
  
  
  
};

module.exports = UserSchema;


