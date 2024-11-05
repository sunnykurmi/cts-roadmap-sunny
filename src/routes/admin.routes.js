let express = require("express");
const {
  getallusers,
  pendingroadmap,
  upload_update_roadmap,
  updatedroadmap,
  create_exam,
  update_exam,
  delete_exam,
  getallportfolio_payment,
  getallessay_payment,
  getallcommonapp_payment,
  getallcssprofile_payment,
  getallexamprep_payment,
  getall_ivy_forms,
  send_ivy_form_mail,
  remove_ivy_approval
} = require("../controllers/admin.controllers.js");
const { allinternship } = require("../controllers/admin.controllers.js");
const { isAuthenticated } = require("../middlewares/auth");
const { isAdmin } = require("../middlewares/isAdmin.js");
const {
  createportfolio,
  deleteportfolio,
  updateportfolio,
} = require("../controllers/portfolio.controllers.js");
let router = express.Router();

//************* admin routes ***********

// route for get all users
router.route("/getallusers").post(isAuthenticated, isAdmin, getallusers);

// route for post pendingroadmap
router.route("/pendingroadmap").post(isAuthenticated, isAdmin, pendingroadmap);

// route for post pendingroadmap
router.route("/updatedroadmap").post(isAuthenticated, isAdmin, updatedroadmap);

// route for upload update roadmap
router
  .route("/upload-update-roadmap")
  .post(isAuthenticated, isAdmin, upload_update_roadmap);

// *******************internships routes********************

// for all internship
router.route("/allinternship").post(isAuthenticated, isAdmin, allinternship);

// *****************portfolio routes**********************

// for create portfolio website
router
  .route("/createportfolio")
  .post(isAuthenticated, isAdmin, createportfolio);

// for update portfolio website
router
  .route("/updateportfolio/:id")
  .post(isAuthenticated, isAdmin, updateportfolio);

// for delete portfolio website
router
  .route("/deleteportfolio/:id")
  .post(isAuthenticated, isAdmin, deleteportfolio);

// *****************exam preperation routes**********************

// for create portfolio website
router.route("/create-exam").post(isAuthenticated, isAdmin, create_exam);

// for update portfolio website
router
  .route("/update-exam/:id")
  .post(isAuthenticated, isAdmin, update_exam);

// for delete portfolio website
router
  .route("/delete-exam/:id")
  .post(isAuthenticated, isAdmin, delete_exam);

  
//*************all payment combine ***********

// route for porfolio all payment
router.route("/allportfolio_pay").post(isAuthenticated, isAdmin, getallportfolio_payment);

// route for essay all payment
router.route("/allessay_pay").post(isAuthenticated, isAdmin, getallessay_payment);

// route for common app all payment
router.route("/allcommonapp_pay").post(isAuthenticated, isAdmin, getallcommonapp_payment);

// route for css profile all payment
router.route("/allcssprofile_pay").post(isAuthenticated, isAdmin, getallcssprofile_payment);

// route for exam prep all payment
router.route("/allexamprep_pay").post(isAuthenticated, isAdmin, getallexamprep_payment);






/////////////////////////////IVY routes /////////////////////////////

// route for fetch  all ivy form
router.route("/getall_ivy_forms").post(isAuthenticated, isAdmin, getall_ivy_forms);

// route for approve studentm and send ivy confirmation mail
router.route("/send_ivy_form_mail").post(isAuthenticated, isAdmin, send_ivy_form_mail);

// route for send ivy confirmation mail
router.route("/remove_ivy_approval").post(isAuthenticated, isAdmin, remove_ivy_approval);






module.exports = router;
