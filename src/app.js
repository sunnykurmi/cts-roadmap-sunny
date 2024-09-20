// .env configuration
require('dotenv').config({ path: './.env' });
// import express
let express = require("express");
let app = express();

// use database
require('./models/database.js').connectDatabase()

// logger
app.use(require('morgan')('tiny'));

// corc integration
const cors = require("cors");
app.use(
    cors({
        origin: ["https://crosstheskylimits.online","http://localhost:5173"],
        credentials: true,
    })
  );

// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// session and cookie
const session = require("express-session");
const cookieparser = require("cookie-parser");
app.use(
    session({
        resave: true,
        saveUninitialized: true,
        secret: process.env.EXPRESS_SESSION_SECRET,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24, // 1 day
            sameSite: "None", // Allow cross-site requests
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            httpOnly: true, // Prevents JavaScript access to cookies
        },
    })
);
app.use(cookieparser());
// express file-upload
const fileupload = require("express-fileupload");
app.use(fileupload());
    
// index routes
app.use('/api/v1/user/', require('./routes/index.routes.js'))
app.use('/api/v1/roadmap/', require('./routes/roadmap.routes.js'))
app.use('/api/v1/admin/', require('./routes/admin.routes.js'))

// Error handling 
const ErrorHandler = require('./utils/ErrorHandler.js');
const { generatedErrors } = require('./middlewares/error.js');
app.use("*",async(req, res, next) => {
    next(new ErrorHandler(`Requested URL Not Found ${req.url}`, 404));
});
app.use(generatedErrors)

// server listen 
app.listen(process.env.PORT, () => {
    console.log(`server is running on port ${process.env.PORT}`);
});