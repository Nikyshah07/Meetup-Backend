const express = require('express');
const UserSchema = require('./models/User.js');
const app = express();
const registerRoute=require('./routes/Register.js')
const loginRoute=require('./routes/Login.js')
const signinGoogle=require('./routes/SignWithGoogle.js')
const cors=require('cors');
app.use(cors())
// Middleware
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

// Initialize database
async function initializeDatabase() {
    try {
        await UserSchema.createTable();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
}

// Call initialization
initializeDatabase();
app.use('/',registerRoute);
app.use('/',loginRoute)
app.use('/',signinGoogle)

app.get('/',(req,res)=>{
    res.send('hello from backend')
})

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});