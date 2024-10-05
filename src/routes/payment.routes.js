let express = require("express");
const { createpayment, verifypayment ,paymentsuccess} = require("../controllers/payment.controllers");
const { isAuthenticated } = require("../middlewares/auth");

let router = express.Router();

// route for create payment
router.route("/create-order/:id").post(createpayment)

// route for verify payment
router.route("/verify-payment").post( verifypayment)

// route for verify payment
router.route("/paymentsuccess/:id").post( paymentsuccess)

router.route("/getkey").get((req, res) =>
    // console.log('key',process.env.RAZORPAY_API_KEY) ||
    res.status(200).json({ key: process.env.RAZORPAY_API_KEY })
  ) 
  

module.exports = router;