const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");
const User = require("../models/user.schema.js");
let Payment = require("../models/satpracticepayment.schema.js");
const ErrorHandler = require("../utils/ErrorHandler.js");
const nodemailer = require("nodemailer");
const Razorpay = require("razorpay");


// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_APT_SECRET,
});


function generateRandomCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  return code;
}

// create payment
exports.sat_practice_createpayment = catchAsyncErrors(async (req, res, next) => {
    try {
        let { userid, amount, name, email, contact } = req.body;
    
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
        const satpractice_payment = new Payment({
          orderId: order.id,
          amount,
          status: "created",
          userid,
          name,
          email,
          contact,
          
        });
        await satpractice_payment.save();
    
        res.status(200).json(order);
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
      }
});

// verify payment
exports.sat_practice_verifypayment = catchAsyncErrors(async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const paymentDetails = {
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
      razorpay_signature: razorpay_signature,
    };
    

    const isValid = Payment.verifyPayment(paymentDetails);
    if (isValid) {
      // Update payment details
      const payment = await Payment.findOne({ orderId: razorpay_order_id });

      if (!payment) {
        return res.status(404).json({ message: "Payment record not found" });
      }

      payment.paymentId = razorpay_payment_id;
      payment.signature = razorpay_signature;
      payment.status = "paid";
      payment.expireAt = undefined;

      await payment.save();
      res.redirect(
        `${process.env.HOST}/satpractice/paymentsuccess/${razorpay_payment_id}`
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
exports.sat_practice_paymentsuccess = catchAsyncErrors(async (req, res, next) => {
     const user_email = req.body;
  try {
    const payment = await Payment.findOne({ paymentId: req.params.id });
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }
    const user = await User.findById(user_email._id).exec();

    user.satpracticetestcode = generateRandomCode();
    await user.save();


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
      from: "SAT Prep Team.",
      to: user.email,
      subject: "Your SAT Journey Begins Now! 🎯",
      html: `
        <div style="text-align: start; width: 80%; font-family: Arial, sans-serif; color: black; font-size: 1.2vw;">
          <p>
            <br />
            Hi <b>${user.name}</b>,
            <br /> <br />
            Congratulations on successfully purchasing the SAT Practice Module! 🎉 You’re one step closer to achieving your academic goals and acing the SAT.
            <br /> <br />
            Your subscription gives you access to comprehensive practice tests covering all SAT sections: Math, Evidence-Based Reading, and Writing. These tests are designed to mimic the real SAT experience, helping you build confidence and enhance your performance.
            <br /> <br />
            👉 Click below to access your practice module and get started: 
            <br /> 
            link:  <a style="color:blue" href="${process.env.HOST}/satpractice/sat-verification-form" target="_blank"> Click here    </a>
            <br />
            username: ${user.email}
            <br />
            password: ${user.satpracticetestcode}
            <br />
            <a href="${process.env.HOST}/satpractice/sat-verification-form" target="_blank">
              <button style="padding: .5vw 1.7vw; cursor:pointer; background-color: #4CAF50; border-radius: 1vw; color: white;">Start Practicing</button>
            </a>
            <br /> <br />
            You can track your progress, view detailed feedback, and retake tests to refine your skills. If you have any questions or need assistance, our team is here to support you every step of the way.
            <br /> <br />
            Best of luck with your preparation! Let’s make this journey a successful one.
            <br /> <br />
            Best regards,
            <br />
            The SAT Prep Team
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
