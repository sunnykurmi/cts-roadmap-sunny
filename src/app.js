// .env configuration
require("dotenv").config({ path: "./.env" });
// import express
let express = require("express");
let app = express();

// use database
require("./models/database.js").connectDatabase();

// logger
app.use(require("morgan")("tiny"));

// cors integration
const cors = require("cors");

app.use(
  cors({
    origin: [
      "https://crosstheskylimits.online",
      "https://www.crosstheskylimits.online",
      "https://api.crosstheskylimits.online",
      "http://localhost:5173",
      "https://cts-roadmap-sunny.onrender.com",
      "https://crosstheskylimits.org",
      "https://www.crosstheskylimits.org",
      "https://cts-frontend-orpin.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Global CORS Headers Middleware
app.use((req, res, next) => {
  const allowedOrigins = [
    "https://crosstheskylimits.online",
    "https://www.crosstheskylimits.online",
    "https://api.crosstheskylimits.online",
    "http://localhost:5173",
    "https://cts-roadmap-sunny.onrender.com",
    "https://crosstheskylimits.org",
    "https://www.crosstheskylimits.org",
    "https://cts-frontend-orpin.vercel.app",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

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
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      httpOnly: true, // Prevents JavaScript access to cookies
    },
  })
);

app.use(cookieparser());
// express file-upload
const fileupload = require("express-fileupload");
app.use(fileupload());

// index routes
app.use("/api/v1/user/", require("./routes/index.routes.js"));
app.use("/api/v1/roadmap/", require("./routes/roadmap.routes.js"));
app.use("/api/v1/admin/", require("./routes/admin.routes.js"));
app.use("/api/v1/payment/", require("./routes/payment.routes.js"));
app.use("/api/v1/auth/", require("./routes/auth.routes.js"));
app.use("/api/v1/internship/", require("./routes/internship.routes.js"));
app.use("/api/v1/services/", require("./routes/exclusive.services.routes.js"));
app.use("/api/v1/satpractice/", require("./routes/sat.practice.routes.js"));

// Error handling
const ErrorHandler = require("./utils/ErrorHandler.js");
const { generatedErrors } = require("./middlewares/error.js");
app.use("*", async (req, res, next) => {
  next(new ErrorHandler(`Requested URL Not Found ${req.url}`, 404));
});
app.use(generatedErrors);

// server listen
app.listen(process.env.PORT, () => {
  console.log(`server is running on port ${process.env.PORT}`);
});
