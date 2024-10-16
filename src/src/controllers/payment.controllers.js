const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");
const Portfolio = require("../models/portfolio.schema.js");
const User = require("../models/user.schema.js");
let Payment = require("../models/payment.schema.js");
const ErrorHandler = require("../utils/ErrorHandler.js");
const nodemailer = require("nodemailer");

// create payment
exports.createpayment = catchAsyncErrors(async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).send("Portfolio item not found");
    }
     const logged_in_user_id =  req.body.userid
    let user = await User.findById(logged_in_user_id).exec();

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    const order = await portfolio.createOrder();

    // Save initial payment details without paymentId
    const payment = new Payment({
      orderId: order.id,
      portfolioId: portfolio._id,
      userid: logged_in_user_id,
      amount: order.amount,
      status: "created",
    });
    await payment.save();

    // console.log("order", order);
    res.status(200).json(order);
  } catch (error) {
    console.log("error create payment :", error);
    res.status(500).json({ message: error.message });
  }
});

// verify payment
exports.verifypayment = catchAsyncErrors(async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const paymentDetails = {
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
      razorpay_signature: razorpay_signature,
    };

    const isValid = Portfolio.verifyPayment(paymentDetails);
    if (isValid) {
      // Update payment details
      const payment = await Payment.findOne({ orderId: razorpay_order_id });

      if (!payment) {
        return res.status(404).json({ message: "Payment record not found" });
      }

      payment.paymentId = razorpay_payment_id;
      payment.signature = razorpay_signature;
      payment.status = "paid";

      await payment.save();
      res.redirect(
        `${process.env.HOST}/portfolio/paymentsuccess/${razorpay_payment_id}`
      );
    } else {
      // Update payment status to failed
      const payment = await Payment.findOne({ orderId: razorpay_order_id });

      if (!payment) {
        return res.status(404).json({ message: "Payment record not found" });
      }

      payment.status = "failed";
      await payment.save();

      res.status(400).json({
        message: "Invalid payment signature",
        status: payment.status,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error verifying payment: " + error.message });
  }
});

//paymentsuccess rout for send mail

exports.paymentsuccess = catchAsyncErrors(async (req, res, next) => {
     const user_email = req.body;
  try {
    const payment = await Payment.findOne({ paymentId: req.params.id });
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }
    const user = await User.findById(user_email._id).exec();
    const transport = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      post: 465,
      auth: {
        user: process.env.MAIL_EMAIL_ADDRESS,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: "Cross The Skylimits.",
      to: user.email,
      subject: "You’re All Set! Let’s Build Your Standout Portfolio! 🚀",
      html: `
            <div style="text-align: start; width: 80%; font-family: Arial, sans-serif; color: #333; font-size: 1.2vw;">
  <p>
    <br />
    Hi <b>${user.name}</b> 
    <br /> <br />
    Thank you for enrolling in our Portfolio Making Program! 🎉 You’ve taken the first step toward creating an incredible, personalized portfolio website that will make a lasting impression on college admissions teams.
    <br /> <br />
    Now, to get things started, please schedule your one-on-one session with our expert developer, Adarsh. During this session, you’ll share your ideas, discuss creative improvements, and suggest a few domain names you’d like for your portfolio website. Don’t worry, Our team and developers will take care of the rest, ensuring your portfolio looks professional and unique!
    <br /> <br />
      👉 Click here to schedule your session - <a href="https://calendar.app.google/njhQzxRga4jfPDLp8" target="_blank"><button style="padding: .5vw 1.7vw; background-color: green; border-radius: 1vw; color: white;">Schedule Meeting</button></a>
      <br />
    <br />
    We can’t wait to help you create a portfolio that truly stands out! If you have any questions before the session, feel free to reach out.
    <br /> <br />
    Best,
    <br />
    The Portfolio Team
  </p>
</div>
        `,
    };

    transport.sendMail(mailOptions, (err, info) => {
      if (err) return next(new ErrorHandler(err, 500));
      res
        .status(200)
        .json({ message: "Payment successful", status: payment.status });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});
