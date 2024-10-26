const Razorpay = require("razorpay");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");
const Essay = require("../models/exclusive-services/eassy.editing.schema.js");
const Commonapp = require("../models/exclusive-services/common.app.schema.js");
const Cssprofile = require("../models/exclusive-services/css.profile.schema.js");
const ErrorHandler = require("../utils/ErrorHandler.js");
const User = require("../models/user.schema.js");
const ImageKit = require("../utils/imagekit.js").initImageKit();
const nodemailer = require("nodemailer");
const Exampay = require("../models/exclusive-services/exam-preperation/exampayment.schema.js");
const ExamName = require("../models/exclusive-services/exam-preperation/examtiming.schema.js");
const PortfolioPay = require("../models/payment.schema.js");

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_APT_SECRET,
});

// testing deleting schema for created payment
exports.deletecreatedpayment = catchAsyncErrors(async (req, res, next) => {
  try {
    await Essay.deleteMany({ status: 'created' })
    await Commonapp.deleteMany({ status: 'created' })
    await Exampay.deleteMany({ status: 'created' })
    await Cssprofile.deleteMany({ status: 'created' })
    await PortfolioPay.deleteMany({ status: 'created' })

    // Send response
    res.status(200).json({
      success: true,
      message: "Exam deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
      payment.expireAt = undefined;

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
    const commmonapp = new Commonapp({
      commonappid,
      password,
      meeting,
      orderId: order.id,
      amount,
      status: "created",
      userid,
    });
    await commmonapp.save();

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
      payment.expireAt = undefined; // Remove the expiration time

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
    const commonapp_payment = await Commonapp.findOne({
      paymentId: req.params.payid,
    });
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
      subject: "Congratulations! Your Common App Review is Confirmed",
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
      res.status(200).json({
        message: "Payment successful",
        status: commonapp_payment.status,
      });
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
    const cssprofile = new Cssprofile({
      cssprofileid,
      password,
      meeting,
      orderId: order.id,
      amount,
      status: "created",
      userid,
    });
    await cssprofile.save();

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

    const isValid = await Cssprofile.verifyPayment(paymentDetails);
    if (isValid) {
      // Update payment details
      const payment = await Cssprofile.findOne({ orderId: razorpay_order_id });

      if (!payment) {
        return res.status(404).json({ message: "Payment record not found" });
      }

      payment.paymentId = razorpay_payment_id;
      payment.signature = razorpay_signature;
      payment.status = "paid";
      payment.expireAt = undefined;

      await payment.save();

      res.redirect(
        `${process.env.HOST}/services/common-app-review/paymentsuccess/${razorpay_payment_id}`
      );
    } else {
      // Update payment status to failed
      const payment = await Cssprofile.findOne({ orderId: razorpay_order_id });

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
exports.payment_success_cssprofile = catchAsyncErrors(
  async (req, res, next) => {
    try {
      const logged_in_user = req.body;
      const cssprofile_payment = await Cssprofile.findOne({
        paymentId: req.params.payid,
      });
      if (!cssprofile_payment) {
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
        subject: "Congratulations! Your CSS Profile Support is Confirmed!",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h1 style="font-size: 24px; font-weight: bold; color: #1a202c; margin-bottom: 20px;">Congratulations! Your CSS Profile Support is Confirmed!</h1>
          <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">Dear ${user.name},</p>
          <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
              We’re thrilled to welcome you to our CSS Profile Support service! This essential part of your financial aid journey can be complex, but with our expert guidance, you’ll navigate the process smoothly.
          </p>
          <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
              Our team will help you:
          </p>
          <ul style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
              <li>Understand and fill out your CSS Profile.</li>
              <li>Identify and correct any mistakes.</li>
              <li>Complete the profile to maximize your chances of receiving aid.</li>
          </ul>
          <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
              Here’s how to proceed:
          </p>
          <ol style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
              <li>Schedule your first consultation with our expert, <a href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0G8fTaMy33MET908cjrTeJgCSrKH7xSG2jDbBfo_iMlJE8ELSInzJUjzUVdqEC8ELbgUIBgoFS" target="_blank">Schedule here</a>.</li>
              <li>Work with our team to fill out your profile, review, and finalize it.</li>
              <li>Submit your completed CSS Profile for financial aid consideration.</li>
          </ol>
          <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
              We’ll be with you every step of the way to ensure your profile is fully optimized. Feel free to reach out if you have any questions.
          </p>
          <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
              Thank you,<br>
              The CSS Profile Support Team
          </p>
      </div>
      `,
      };

      transport.sendMail(mailOptions, (err, info) => {
        if (err) return next(new ErrorHandler(err, 500));
        res.status(200).json({
          message: "Payment successful",
          status: cssprofile_payment.status,
        });
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
);

exports.examprep_createpayment = catchAsyncErrors(async (req, res, next) => {
  try {
    let { userid, amount, name, email, contact, score, exam_type } = req.body;

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
    const examprep_payment = new Exampay({
      orderId: order.id,
      amount,
      status: "created",
      userid,
      name,
      email,
      contact,
      score,
      exam_type,
    });
    await examprep_payment.save();

    res.status(200).json(order);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

exports.examprep_verifypayment = catchAsyncErrors(async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const paymentDetails = {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    };

    const isValid = await Exampay.verifyPayment(paymentDetails);

    if (isValid) {
      const exams_prep = await Exampay.findOne({ orderId: razorpay_order_id });

      if (!exams_prep) {
        return res
          .status(404)
          .json({ message: "exams_prep Payment record not found" });
      }

      exams_prep.paymentId = razorpay_payment_id;
      exams_prep.signature = razorpay_signature;
      exams_prep.status = "paid";
      exams_prep.expireAt = undefined; // Remove the expiration time

      await exams_prep.save();

      res.redirect(
        `${process.env.HOST}/services/exam-prep/paymentsuccess/${razorpay_payment_id}`
      );
    } else {
      // Update payment status to failed
      const exams_prep = await Exampay.findOne({ orderId: razorpay_order_id });

      if (!exams_prep) {
        return res.status(404).json({ message: "Payment record not found" });
      }

      exams_prep.status = "failed";
      await exams_prep.save();

      res.status(400).json({
        message: "Invalid payment signature",
        status: exams_prep.status,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error verifying payment: " + error.message });
  }
});

//paymentsuccess rout for send mail common app
exports.examprep_success_payment = catchAsyncErrors(async (req, res, next) => {
  try {
    const logged_in_user = req.body;
    const examprep_payment = await Exampay.findOne({
      paymentId: req.params.payid,
    });

    let { name, email, contact, score, exam_type, amount } = examprep_payment;

    let filterExam = examprep_payment.exam_type;

    if (!examprep_payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }
    const user = await User.findById(logged_in_user._id).exec();

    if (!user) {
      return next(new ErrorHandler("User not found when success payment", 404));
    }

    let exam_name = await ExamName.findOne({ examname: filterExam });

    exam_name.total_enrolled.push(user._id);

    await exam_name.save();

    // ********************************************************************
    // this mail send to shubhankar
    const transport1 = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: process.env.MAIL_EMAIL_ADDRESS,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const mailOptions1 = {
      from: "Cross The Skylimits.",
      to: "dubeypuran2002@gmail.com",
      subject: `COURSE PURCHASED! ${exam_type} CTS ❤`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h1 style="font-size: 24px; font-weight: bold; color: #1a202c; margin-bottom: 20px;">New Purchase Notification</h1>
        <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">A user has just made a payment for an exam preparation service. Here are the details:</p>
        <ul style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Contact:</strong> ${contact}</li>
          <li><strong>Exam name:</strong> ${exam_type}</li>
          <li><strong>Amount paid for ${exam_type}:</strong> ₹${amount}</li>
          <li><strong>previous ${exam_type} Score:</strong> ${score}</li>
        </ul>
        
        <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
          Best regards,<br>
          The Crosstheskylimits developer team.
        </p>
      </div>
    `,
    };

    transport1.sendMail(mailOptions1, (err, info) => {
      if (err) return next(new ErrorHandler(err, 500));
      // console.log(info);

      return res.status(200).json({
        message: "mail sent to admin!",
      });
    });

    // ********************************************************************
    //this email sent to student who purchased
    const transport = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      post: 465,
      secure: true, // Use SSL
      auth: {
        user: process.env.MAIL_EMAIL_ADDRESS,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: "Cross The Skylimits.",
      to: email,
      subject: `Welcome to the ${exam_type} Course – Your Journey to Success Begins!
`,
html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
    <h1 style="font-size: 24px; font-weight: bold; color: #1a202c; margin-bottom: 20px;">Welcome to the ${exam_type} Course – Your Journey to Success Begins!</h1>
    <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">Dear ${user.name},</p>
    <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
        Congratulations on enrolling in our ${exam_type} course! We’re thrilled to have you on board as you take the next step toward achieving your dream score. Rest assured, our team is here to guide and support you every step of the way.
    </p>
    <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
        Our instructor, Subhankar Parashar, will be in touch shortly to send you the class structure and officially add you to the course. We’re confident that with dedication and the right guidance, you’ll be well-prepared to excel.
    </p>
    <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
        Once again, thank you for choosing us to be part of your journey! If you have any questions or need further assistance, please don’t hesitate to contact us. Here are our contact details:
    </p>
    <ul style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
        <li>Email: <a href="mailto:crosstheskylimits@gmail.com">crosstheskylimits@gmail.com</a></li>
        <li>Phone: +91 7049491861</li>
    </ul>
    <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
        We look forward to working with you!
    </p>
    <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
        Best regards,<br>
        The ${exam_type} Course Team
    </p>
</div>
`,
    };

    transport.sendMail(mailOptions, (err, info) => {
      if (err) return next(new ErrorHandler(err, 500));
      res.status(200).json({
        message: "Payment successful",
        status: examprep_payment.status,
      });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});
