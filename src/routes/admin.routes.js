let express = require("express");
const {  getallusers, pendingroadmap, upload_update_roadmap,updatedroadmap} = require("../controllers/admin.controllers.js");
const { isAuthenticated } = require("../middlewares/auth");
const { isAdmin } = require("../middlewares/isAdmin.js");
const { updateMany } = require("../models/user.schema.js");
let router = express.Router();

//************* admin routes ***********

// route for get all users
router.route("/getallusers").post(isAuthenticated,isAdmin,getallusers)

// route for post pendingroadmap
router.route("/pendingroadmap").post(isAuthenticated,isAdmin,pendingroadmap)

// route for post pendingroadmap
router.route("/updatedroadmap").post(isAuthenticated,isAdmin,updatedroadmap)

// route for upload update roadmap
router.route("/upload-update-roadmap").post(isAuthenticated,isAdmin,upload_update_roadmap)

module.exports = router;