let express = require("express");
const {
    sat_practice_createpayment,
    sat_practice_paymentsuccess,
    sat_practice_verifypayment
} = require("../controllers/satpractice.controllers");
const { isAuthenticated } = require("../middlewares/auth");

let router = express.Router();
// essay submission and order creation
router.route("/submit-sat-practice").post(sat_practice_createpayment);

// // route for verify payment
router.route("/sat-practice-verify-payment").post(sat_practice_verifypayment);

// // route for verify payment
router.route("/payment-success-sat-practice/:payid").post(sat_practice_paymentsuccess);

module.exports = router;
