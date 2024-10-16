let express = require("express");
const { google } = require("../controllers/auth.controllers.js");

let router = express.Router();

// route for get all users
router.route("/google").get(google)

module.exports = router;