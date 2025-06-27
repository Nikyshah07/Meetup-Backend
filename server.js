const express = require('express');
const UserSchema = require('./models/User.js');
const EventSchema =require('./models/Event.js')
const app = express();
const profileRoute=require('./routes/Profile.js')

const registerRoute=require('./routes/Register.js')
const loginRoute=require('./routes/Login.js')
const signinGoogle=require('./routes/SignWithGoogle.js')

const forgotPassword=require('./routes/ForgotPassword.js')
const verifyOtp=require('./routes/VerifyOtp.js')
const resetPassword=require('./routes/ResetPassword.js')

const securePassword=require('./routes/SecurePassword.js')
const event=require('./routes/events.js')



const cors=require('cors');
app.use(cors())
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Middleware

// ADD THIS
// app.use(express.json());
// Initialize database
async function initializeDatabase() {
    try {
        await UserSchema.createTable();
        await EventSchema.createTable();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
}



// Call initialization
initializeDatabase();
app.use('/',profileRoute);
app.use('/',registerRoute)
app.use('/',loginRoute)
app.use('/',signinGoogle)
app.use('/',forgotPassword)
app.use('/',verifyOtp)
app.use('/',resetPassword)
app.use('/',securePassword)
app.use('/',event)


app.get('/',(req,res)=>{
    res.send('hello from backend')
})

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});