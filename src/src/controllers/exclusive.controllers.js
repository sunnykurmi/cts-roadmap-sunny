const Razorpay = require("razorpay");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");
const Essay = require("../models/exclusive-services/eassy.editing.schema.js");
const Commonapp = require("../models/exclusive-services/common.app.schema.js");
const ErrorHandler = require("../utils/ErrorHandler.js");
const User = require("../models/user.schema.js");
const ImageKit = require("../utils/imagekit.js").initImageKit();
const nodemailer = require("nodemailer");

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_APT_SECRET,
});

// ************ESSAY EDITING SERVICE**************

// Submit essay
exports.submitessay = catchAsyncErrors(async (req, res, next) => {
  try {
    let { instructions, essaytype, price, id } = req.body;

    if (!instructions || !essaytype || !price || !id) {
      return next(new ErrorHandler("All fields are required", 400));
    }

    if (!req.files) {
      return next(new ErrorHandler("Please upload the essay file", 400));
    }
    // console.log(req.files)

    let user = await User.findById(id);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    const options = {
      amount: price * 100, // amount in the smallest currency unit
      currency: "INR",
      receipt: `receipt_${id}`, // Use a unique identifier for the receipt
      // payment_capture: 1, // Auto capture payment, so that the payment is captured as soon as it is created
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return next(new ErrorHandler("Error creating Razorpay order", 500));
    }

    // Save the essay file in ImageKit and get the URL
    const essayFile = req.files.essayfile;

    const essaylink = await ImageKit.upload({
      file: essayFile.data, // The file buffer to be uploaded
      fileName: essayFile.name, // The name with which the file has to be uploaded
      folder: "/services/essay-editing", // The folder in which the file has to be uploaded
    });

    // Save initial payment details without paymentId
    const payment = new Essay({
      essaytype,
      essayfile: essaylink.url,
      instructions,
      orderId: order.id,
      amount: price,
      status: "created",
      userid: id,
    });
    await payment.save();

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

// verify payment
exports.essayverifypayment = catchAsyncErrors(async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    // console.log("pay details :", req.body);
    const paymentDetails = {
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
      razorpay_signature: razorpay_signature,
    };

    const isValid = await Essay.verifyPayment(paymentDetails);
    if (isValid) {
      // Update payment details
      const payment = await Essay.findOne({ orderId: razorpay_order_id });

      if (!payment) {
        return res.status(404).json({ message: "Payment record not found" });
      }

      payment.paymentId = razorpay_payment_id;
      payment.signature = razorpay_signature;
      payment.status = "paid";

      await payment.save();
      res.redirect(
        `${process.env.HOST}/services/essay-editing/paymentsuccess/${razorpay_payment_id}`
      );
    } else {
      // Update payment status to failed
      const payment = await Essay.findOne({ orderId: razorpay_order_id });

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

exports.payment_success_essay = catchAsyncErrors(async (req, res, next) => {
  try {
    const logged_in_user = req.body;
    const essay_payment = await Essay.findOne({ paymentId: req.params.payid });
    if (!essay_payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }
    const user = await User.findById(logged_in_user._id).exec();
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
      subject: "Welcome to Our Essay Editing Service",
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h1 style="font-size: 24px; font-weight: bold; color: #1a202c; margin-bottom: 20px;">Welcome to Our Essay Editing Service!</h1>
        <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">Dear ${user.name},</p>
        <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
          Thank you for choosing our Essay Editing service! We’re excited to embark on this journey with you to craft an essay that truly reflects your unique voice and story. Our team of experts, including top Ivy League students and seasoned professionals, is committed to providing you with the best guidance and support. And you will get your edited essay within 24hrs.
        </p>
        <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
          Rest assured, your essay is in capable hands. We pride ourselves on delivering results that exceed expectations. However, if at any point you feel that the outcome doesn’t meet your satisfaction, please don’t hesitate to DM or contact us directly. Your satisfaction is our top priority, and we’re here to ensure you feel confident in your submission.
        </p>
        <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
          We look forward to helping you shine through your essay!
        </p>
        <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
          Best regards,<br>
          The Essay Editing Team
        </p>
      </div>
    `,
    };

    transport.sendMail(mailOptions, (err, info) => {
      if (err) return next(new ErrorHandler(err, 500));
      res
        .status(200)
        .json({ message: "Payment successful", status: essay_payment.status });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// *************COMMON APP REVIEW******************

// Submit common app
exports.CommonAppReview = catchAsyncErrors(async (req, res, next) => {
  console.log(req.body);
  try {
    let { commonappid, password, meeting, userid, amount } = req.body;

    if ((!commonappid && !password) || !meeting || !userid || !amount) {
      return next(new ErrorHandler("All fields are required", 400));
    }

    let user = await User.findById(userid);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency: "INR",
      receipt: `receipt_${userid}`, // Use a unique identifier for the receipt
      payment_capture: 1, // Auto capture payment, so that the payment is captured as soon as it is created
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return next(new ErrorHandler("Error creating Razorpay order", 500));
    }

    // Save initial payment details without paymentId
    const common_app = new Commonapp({
      commonappid,
      password,
      meeting,
      orderId: order.id,
      amount,
      status: "created",
      userid,
    });
    await common_app.save();

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

// verify payment common app
exports.commonapp_verifypayment = catchAsyncErrors(async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    // console.log("pay details :", req.body);
    const paymentDetails = {
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
      razorpay_signature: razorpay_signature,
    };

    const isValid = await Commonapp.verifyPayment(paymentDetails);
    if (isValid) {
      // Update payment details
      const payment = await Commonapp.findOne({ orderId: razorpay_order_id });

      if (!payment) {
        return res.status(404).json({ message: "Payment record not found" });
      }

      payment.paymentId = razorpay_payment_id;
      payment.signature = razorpay_signature;
      payment.status = "paid";

      await payment.save();

      res.redirect(
        `${process.env.HOST}/services/common-app-review/paymentsuccess/${razorpay_payment_id}`

      );
    } else {
      // Update payment status to failed
      const payment = await Commonapp.findOne({ orderId: razorpay_order_id });

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

//paymentsuccess rout for send mail common app
exports.payment_success_commonapp = catchAsyncErrors(async (req, res, next) => {
  try {
    const logged_in_user = req.body;
    const commonapp_payment = await Commonapp.findOne({ paymentId: req.params.payid });
    if (!commonapp_payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }
    const user = await User.findById(logged_in_user._id).exec();
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
      subject: "Welcome to Our Essay Editing Service",
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h1 style="font-size: 24px; font-weight: bold; color: #1a202c; margin-bottom: 20px;">Welcome to Our Essay Editing Service!</h1>
        <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">Dear ${user.name},</p>
        <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
          Thank you for choosing our Essay Editing service! We’re excited to embark on this journey with you to craft an essay that truly reflects your unique voice and story. Our team of experts, including top Ivy League students and seasoned professionals, is committed to providing you with the best guidance and support. And you will get your edited essay within 24hrs.
        </p>
        <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
          Rest assured, your essay is in capable hands. We pride ourselves on delivering results that exceed expectations. However, if at any point you feel that the outcome doesn’t meet your satisfaction, please don’t hesitate to DM or contact us directly. Your satisfaction is our top priority, and we’re here to ensure you feel confident in your submission.
        </p>
        <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
          We look forward to helping you shine through your essay!
        </p>
        <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
          Best regards,<br>
          The Essay Editing Team
        </p>
      </div>
    `,
    };

    transport.sendMail(mailOptions, (err, info) => {
      if (err) return next(new ErrorHandler(err, 500));
      res
        .status(200)
        .json({ message: "Payment successful", status: commonapp_payment.status });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});


// *************CSS PROFILE HELP******************

// Submit common app
exports.CssProfile = catchAsyncErrors(async (req, res, next) => {
  console.log(req.body);
  try {
    let { cssprofileid, password, meeting, userid, amount } = req.body;

    if ((!cssprofileid && !password) || !meeting || !userid || !amount) {
      return next(new ErrorHandler("All fields are required", 400));
    }

    let user = await User.findById(userid);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency: "INR",
      receipt: `receipt_${userid}`, // Use a unique identifier for the receipt
      payment_capture: 1, // Auto capture payment, so that the payment is captured as soon as it is created
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return next(new ErrorHandler("Error creating Razorpay order", 500));
    }

    // Save initial payment details without paymentId
    const common_app = new Commonapp({
      cssprofileid,
      password,
      meeting,
      orderId: order.id,
      amount,
      status: "created",
      userid,
    });
    await common_app.save();

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

// verify payment common app
exports.cssprofile_verifypayment = catchAsyncErrors(async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    // console.log("pay details :", req.body);
    const paymentDetails = {
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
      razorpay_signature: razorpay_signature,
    };

    const isValid = await Commonapp.verifyPayment(paymentDetails);
    if (isValid) {
      // Update payment details
      const payment = await Commonapp.findOne({ orderId: razorpay_order_id });

      if (!payment) {
        return res.status(404).json({ message: "Payment record not found" });
      }

      payment.paymentId = razorpay_payment_id;
      payment.signature = razorpay_signature;
      payment.status = "paid";

      await payment.save();

      res.redirect(
        `${process.env.HOST}/services/common-app-review/paymentsuccess/${razorpay_payment_id}`

      );
    } else {
      // Update payment status to failed
      const payment = await Commonapp.findOne({ orderId: razorpay_order_id });

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

//paymentsuccess rout for send mail common app
exports.payment_success_cssprofile = catchAsyncErrors(async (req, res, next) => {
  try {
    const logged_in_user = req.body;
    const commonapp_payment = await Commonapp.findOne({ paymentId: req.params.payid });
    if (!commonapp_payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }
    const user = await User.findById(logged_in_user._id).exec();
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
      subject: "Welcome to Our Essay Editing Service",
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h1 style="font-size: 24px; font-weight: bold; color: #1a202c; margin-bottom: 20px;">Welcome to Our Essay Editing Service!</h1>
        <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">Dear ${user.name},</p>
        <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
          Thank you for choosing our Essay Editing service! We’re excited to embark on this journey with you to craft an essay that truly reflects your unique voice and story. Our team of experts, including top Ivy League students and seasoned professionals, is committed to providing you with the best guidance and support. And you will get your edited essay within 24hrs.
        </p>
        <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
          Rest assured, your essay is in capable hands. We pride ourselves on delivering results that exceed expectations. However, if at any point you feel that the outcome doesn’t meet your satisfaction, please don’t hesitate to DM or contact us directly. Your satisfaction is our top priority, and we’re here to ensure you feel confident in your submission.
        </p>
        <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
          We look forward to helping you shine through your essay!
        </p>
        <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
          Best regards,<br>
          The Essay Editing Team
        </p>
      </div>
    `,
    };

    transport.sendMail(mailOptions, (err, info) => {
      if (err) return next(new ErrorHandler(err, 500));
      res
        .status(200)
        .json({ message: "Payment successful", status: commonapp_payment.status });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});
