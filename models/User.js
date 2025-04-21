// models/User.js
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

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
    tableName: 'users',
    
    // Schema definition
    fields: {
        id: { type: 'SERIAL', primaryKey: true },
        username: { type: 'VARCHAR(100)', notNull: true },
        email: { type: 'VARCHAR(100)', notNull: true, unique: true },
        password: { type: 'VARCHAR(255)', notNull: true },
        photo: { type: 'TEXT' },
        auth_type: { type: 'VARCHAR(20)', default: 'EMAIL' },
        created_at: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
    },
    
    // Create the table
    async createTable() {
        const fieldDefinitions = Object.entries(this.fields).map(([fieldName, attributes]) => {
            let definition = `${fieldName} ${attributes.type}`;
            
            if (attributes.primaryKey) definition += ' PRIMARY KEY';
            if (attributes.notNull) definition += ' NOT NULL';
            if (attributes.unique) definition += ' UNIQUE';
            if (attributes.default) definition += ` DEFAULT ${attributes.default}`;
            
            return definition;
        }).join(', ');
        
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
            console.error('Error finding user by email:', error);
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
            console.error('Error finding user by ID:', error);
            throw error;
        }
    },
    
    // Create new user
    async create(userData) {
        try {
            // Hash password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
            
            const result = await pool.query(
                `INSERT INTO ${this.tableName} (username, email, password, photo, auth_type) 
                VALUES ($1, $2, $3, $4) 
                RETURNING id, username, email, photo,auth_type, created_at`,
                [userData.username, userData.email, hashedPassword, userData.photo,  userData.auth_type || 'EMAIL']
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },
    
    // Get all users (for admin purposes)
    async findAll() {
        try {
            const result = await pool.query(
                `SELECT id, username, email, created_at FROM ${this.tableName}`
            );
            return result.rows;
        } catch (error) {
            console.error('Error fetching all users:', error);
            throw error;
        }
    },
    
    // Validate password
    async validatePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
};

module.exports = UserSchema;