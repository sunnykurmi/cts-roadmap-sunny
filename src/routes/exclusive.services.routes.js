let express = require("express");
const {
  submitessay,
  essayverifypayment,
  payment_success_essay,
  CommonAppReview,
  commonapp_verifypayment,
  payment_success_commonapp,
} = require("../controllers/exclusive.controllers");
const { isAuthenticated } = require("../middlewares/auth");

let router = express.Router();

// **************ESSAY EDITING SERVICES***************

// essay submission and order creation
router.route("/submit-essay").post(submitessay);

// route for verify payment
router.route("/essay-verify-payment").post(essayverifypayment);

// route for verify payment
router.route("/payment-success-essay/:payid").post(payment_success_essay);

// **************COMMON APP REVIEW***************

// essay submission and order creation
router.route("/submit-common-app").post(CommonAppReview);

// route for verify payment
router.route("/commonapp-verify-payment").post(commonapp_verifypayment);

// route for verify payment
router.route("/payment-success-commonapp/:payid").post(payment_success_commonapp);

module.exports = router;
