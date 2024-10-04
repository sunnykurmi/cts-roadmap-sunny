let express = require("express");
const {  getallusers, pendingroadmap, upload_update_roadmap,updatedroadmap} = require("../controllers/admin.controllers.js");
const { allinternship } = require("../controllers/admin.controllers.js");
const { isAuthenticated } = require("../middlewares/auth");
const { isAdmin } = require("../middlewares/isAdmin.js");
const { createportfolio, deleteportfolio,updateportfolio } = require("../controllers/portfolio.controllers.js");
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


// *******************internships routes********************
 
// for all internship
router.route("/allinternship").post(isAuthenticated,isAdmin,allinternship);


// *****************portfolio routes**********************

// for create portfolio website
router.route("/createportfolio").post(isAuthenticated,isAdmin,createportfolio);

// for update portfolio website
router.route("/updateportfolio/:id").post(isAuthenticated,isAdmin,updateportfolio);

// for delete portfolio website
router.route("/deleteportfolio/:id").post(isAuthenticated,isAdmin,deleteportfolio);

module.exports = router;