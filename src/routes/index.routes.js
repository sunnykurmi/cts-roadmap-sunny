let express = require("express");
const {
    homepage,
    signup,
    signin,
    signout,
    currentuser,
    edituser,
    resetpassword,
    usersendmail,
    userforgetlink,
    studentavatar,
    deleteuser,
    addEducation,
    addAchievement,
    updateSocialMedia,
    showportfolio,
    validateRegistration,
    validateLogin
} = require("../controllers/index.controllers");
const { isAuthenticated } = require("../middlewares/auth");
let router = express.Router();

// home route
router.get("/",homepage)

// signup
router.post("/signup",validateRegistration,signup);

// signin
router.post("/signin",validateLogin,signin);

// current user route
router.get("/user" , isAuthenticated, currentuser);

// update user route
router.post("/edituser/:id",isAuthenticated, edituser);

// add education
router.post('/edituser/:id/education' , isAuthenticated, addEducation);

// add achievement
router.post('/edituser/:id/achievement',isAuthenticated, addAchievement);

// update social media
router.post('/edituser/:id/socialmedia', isAuthenticated, updateSocialMedia);

// POST /student/avatar/:studentid
router.post("/avatar/:id", isAuthenticated, studentavatar);

// reset password route
router.post("/resetpassword/:id" , isAuthenticated, resetpassword);

// send-mail for forget password
router.post("/send-mail", usersendmail);

// forgot password link
router.post("/forget-link/:id" , userforgetlink);

// signout
router.post("/signout",isAuthenticated, signout);

// route for delete user
router.post("/deleteuser/:id", isAuthenticated, deleteuser);

// portfolio routes
 
// route for show all portfolio 
router.post("/allportfolio", showportfolio);

module.exports = router;