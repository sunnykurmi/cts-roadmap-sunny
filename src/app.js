// .env configuration
require('dotenv').config({ path: './.env' });


// import express
let express = require("express");
let app = express();


// cors integration
const cors = require("cors");
app.use(
    cors({
        origin: true,
        credentials: true,
    })
  );


// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// cookie parser
const cookieparser = require("cookie-parser");
app.use(cookieparser());


// logger
app.use(require('morgan')('tiny'));


// session and cookie
const session = require("express-session");
app.use(
    session({
      secret: process.env.EXPRESS_SESSION_SECRET, // Change this to a strong secret
      resave: false,
      saveUninitialized: true,
  
}));


// use database
require('./models/database.js').connectDatabase()


// express file-upload
const fileupload = require("express-fileupload");
app.use(fileupload());
    

// index routes
app.use('/api/v1/user/', require('./routes/index.routes.js'))
app.use('/api/v1/roadmap/', require('./routes/roadmap.routes.js'))
app.use('/api/v1/admin/', require('./routes/admin.routes.js'))
app.use('/api/v1/payment/', require('./routes/payment.routes.js'))
app.use('/api/v1/auth/', require('./routes/auth.routes.js'))
app.use('/api/v1/internship/', require('./routes/internship.routes.js'))
app.use('/api/v1/services/', require('./routes/exclusive.services.routes.js'))


// Error handling 
const ErrorHandler = require('./utils/ErrorHandler.js');
app.use("*",async(req, res, next) => {
    next(new ErrorHandler(`Requested URL Not Found ${req.url}`, 404));
});

// generated errors
const { generatedErrors } = require('./middlewares/error.js');
app.use(generatedErrors)


// server listen 
app.listen(process.env.PORT, () => {
    console.log(`server is running on port ${process.env.PORT}`);
});