let express = require("express");
const { homepage,signup,signin,signout, currentuser ,edituser, resetpassword, usersendmail, userforgetlink, studentavatar, deleteuser} = require("../controllers/index.controllers");
const { isAuthenticated } = require("../middlewares/auth");
let router = express.Router();



// home route
router.route("/").get(homepage)

// signup
router.route("/signup").post(signup)

// signin
router.route("/signin").post(signin)

// current user route route
router.route("/user").post(isAuthenticated,currentuser)

// update user route
router.route("/edituser/:id").post(isAuthenticated,edituser)

// POST /student/avatar/:studentid
router.route("/avatar/:id").post(isAuthenticated, studentavatar);

// reset password route
router.route("/resetpassword/:id").post(isAuthenticated,resetpassword)

// send-mail for forget password
router.route("/send-mail").post(usersendmail);

// forgot password link
router.route("/forget-link/:id").get(userforgetlink);

// signout
router.route("/signout").post(isAuthenticated,signout)

// route for delete user
router.route("/deleteuser/:id").post(isAuthenticated,deleteuser)


module.exports = router;