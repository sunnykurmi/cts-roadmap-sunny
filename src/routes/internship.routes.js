let express = require("express");
const {
    applyinternship,
    allinternship
} = require("../controllers/internship.controllers.js");
let router = express.Router();

// home route
router.route("/apply").post(applyinternship);

module.exports = router;