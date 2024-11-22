const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const User = require("../models/user.schema");
const PendingRoadmap = require("../models/pending.roadmap.schema.js");
let { initImageKit } = require("../utils/imagekit.js");
const { sendmailuser } = require("../utils/sendmailuser.js");
const UpdatedRoadmap = require("../models/updated.roadmap.schema.js");
const Internship = require("../models/internshipApplication.schema.js");
let Exam = require("../models/exclusive-services/exam-preperation/examtiming.schema.js");
const ErrorHandler = require("../utils/ErrorHandler.js");
const nodemailer = require("nodemailer");


// payment schema
const PortfolioPayment = require("../models/payment.schema.js");
const CommanappPayment = require("../models/exclusive-services/common.app.schema.js");
const Essaypayment = require("../models/exclusive-services/eassy.editing.schema.js");
const CssProfilePayment = require("../models/exclusive-services/css.profile.schema.js");
const Examprep_payment = require("../models/exclusive-services/exam-preperation/exampayment.schema.js");
const IVYForm = require("../models/ivyForm.schema.js");


// user related things

exports.getallusers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find().populate("roadmaps").exec();
  res.status(200).json({
    success: true,
    userlength: users.length,
    users,
  });
});

exports.upload_update_roadmap = catchAsyncErrors(async (req, res, next) => {
  // Find user by email
  const user = await User.findOne({ email: req.body.email }).exec();
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "User not found",
    });
  }

  const data = req.body;

  // Initialize ImageKit
  const imagekit = initImageKit();

  // Upload the PDF file to ImageKit
  const response = await imagekit.upload({
    file: req.files.file.data, // the file as a Buffer
    fileName: req.files.file.name,
    folder: "/pdfs", // optional: folder in ImageKit where the file should be stored
    useUniqueFileName: true, // to prevent file overwriting
  });

  // Save the roadmap details in the database
  const updatedRoadmap = new UpdatedRoadmap({
    name: data.name,
    email: data.email,
    path: response.url, // URL from ImageKit
    roadmapuser: user._id,
  });

  user.roadmaps.push(updatedRoadmap._id);
  // await user.save()
  await updatedRoadmap.save();

  // Remove the roadmap ID from user.pendingroadmap array
  user.PendingRoadmaps = user.PendingRoadmaps.filter(
    (roadmapId) => roadmapId.toString() !== req.body.id
  );
  // Save the updated user
  await user.save();
  await PendingRoadmap.findByIdAndDelete(req.body.id);

  // Send email with the PDF attachment
  await sendmailuser(req, res, next, response.url, user);

  res.json({
    success: true,
    message: "Roadmap uploaded successfully",
  });
});

//***************** roadmaps related things *****************

// write code for find all roadmaps
exports.pendingroadmap = catchAsyncErrors(async (req, res, next) => {
  const roadmaps = await PendingRoadmap.find().populate("roadmapuser").exec();
  res.status(200).json({
    success: true,
    message: "All roadmaps",
    roadmaps,
  });
});
// write code for find all roadmaps
exports.updatedroadmap = catchAsyncErrors(async (req, res, next) => {
  const roadmaps = await UpdatedRoadmap.find().populate("roadmapuser").exec();
  res.status(200).json({
    success: true,
    message: "All roadmaps",
    roadmaps,
  });
});

// **********************

// internships

// Apply for internship
exports.allinternship = catchAsyncErrors(async (req, res, next) => {
  try {
    let internship = await Internship.find();

    res.status(200).json({
      success: true,
      internshiplength: internship.length,
      internship,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// **********************

// exam preperation in exclusive services

// Create exam
exports.create_exam = catchAsyncErrors(async (req, res, next) => {
  try {
    const { examname,amount, from, to } = req.body;

    // Check if any required field is missing or empty
    if (
      [examname,amount, from, to].some(
        (field) => typeof field === "string" && field.trim() === ""
      )
    ) {
      return next(new ErrorHandler("All fields are required", 401));
    }

    // Create the exam
    let exam = await Exam.create({ examname, from, to ,amount});
    await exam.save();

    // Send response
    res.status(201).json({
      success: true,
      message: "Exam created successfully",
      exam,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete exam
exports.delete_exam = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the exam by ID and delete it
    const exam = await Exam.findByIdAndDelete(id);

    if (!exam) {
      return next(new ErrorHandler("Exam not found", 404));
    }

    // Send response
    res.status(200).json({
      success: true,
      message: "Exam deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update exam
exports.update_exam = catchAsyncErrors(async (req, res, next) => {
  try {
    let { id } = req.params;
    let { from, to,amount } = req.body;

    if (
      [from, to,amount].some(
        (field) => typeof field === "string" && field.trim() === ""
      )
    ) {
      return next(new ErrorHandler("All fields are required", 401));
    }

    // Find the exam by ID and update it
    const exam = await Exam.findByIdAndUpdate(
      id,
      { from, to,amount },
      { new: true, runValidators: true }
    );

    if (!exam) {
      return next(new ErrorHandler("Exam not found", 404));
    }

    await exam.save();
    // Send response
    res.status(200).json({
      success: true,
      message: "Exam updated successfully",
      exam,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ***********************all payments records*************************8


// all portfolio
exports.getallportfolio_payment = catchAsyncErrors(async (req, res, next) => {
  try {
    let Portfoliopay = await PortfolioPayment.find();

    res.status(200).json({
      success: true,
      Portfoliopaylength: Portfoliopay.length,
      Portfoliopay,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// all essay
exports.getallessay_payment = catchAsyncErrors(async (req, res, next) => {
  try {
    let essaypay = await Essaypayment.find();

    res.status(200).json({
      success: true,
      essaypaylength: essaypay.length,
      essaypay,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// all common app
exports.getallcssprofile_payment = catchAsyncErrors(async (req, res, next) => {
  try {
    let cssprofile = await CssProfilePayment.find();

    res.status(200).json({
      success: true,
      cssprofilelength: cssprofile.length,
      cssprofile,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// all portfolio
exports.getallcommonapp_payment = catchAsyncErrors(async (req, res, next) => {
  try {
    let commonapp = await CommanappPayment.find();

    res.status(200).json({
      success: true,
      commonapplength: commonapp.length,
      commonapp,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// all portfolio
exports.getallexamprep_payment = catchAsyncErrors(async (req, res, next) => {
  try {
    let examprep = await Examprep_payment.find();

    res.status(200).json({
      success: true,
      exampreplength: examprep.length,
      examprep,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});







/////////////////////////// ///////IVY all forms/////////////////////////////////////////////

exports.getall_ivy_forms = catchAsyncErrors(async (req, res, next) => {
  const forms = await IVYForm.find();
  res.status(200).json({
    success: true,
    forms
  });
});


/////////////////////////// /////// send IVY confirmation form/////////////////////////////////////////////

exports.send_ivy_form_mail = catchAsyncErrors(async (req, res, next) => {

  const formdata = req.body;
  const name = formdata.fullname;
  const email = formdata.email;

  const user = await User.findOne({ email }).exec();
  
  if (user) {
    user.ivystudent = "yes";
    await user.save();
  }

  const form = await IVYForm.findById(req.body._id);
  if (!form) {
    return next(new ErrorHandler("Form not found", 404));
  }
  form.response = "approved";
  await form.save();


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
    from: "Cross The SKylimits.",
    to: email,
    subject:
      "Congratulations! You have been selected to join the  Ivy Accelerator Program",
    html: `
   <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h1 style="font-size: 24px; font-weight: bold; color: #1a202c; margin-bottom: 20px;">🎉 Congratulations! You’re Accepted into the Prestigious Ivy Accelerator Program! 🎉</h1>
        <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">Dear <b>${name}</b></p>
        <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
         Congratulations! Out of a competitive pool of applicants, you have been selected to join the elite Ivy Accelerator Program—a rare opportunity designed to transform your college application journey. This is a big step forward toward your dreams!
        </p>
        
        <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
        <span style="font-weight: bold;">What’s Next?</span> <br>
          
          As a new member of Ivy Accelerator, you’re on a path to boost your admission chances by an incredible 600%. Here, we’ll guide you through every aspect of the college application process, sharing innovative strategies and personalized support. We’ve built this program over 5 years, and it’s the most innovative opportunity available for students serious about reaching top universities.
        </p>

<p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
To begin, you’re invited to schedule a one-on-one session with none other than Krishna MIT, the visionary behind this program. In this exclusive session, Krishna will walk you through your personalized roadmap and the next steps, giving you insider guidance to set you up for success.
</p>
        <div style="width: 100%; height: 6vh; display: flex; align-items: center; justify-content: center;">
  <a href="https://scheduler.zoom.us/ekiv2mqhqucm9n7w7-4-wg/krishnamit" style="padding: 1.5vh 2vh; border-radius: 1vw; background-color: #008BDC; font-size: 1vw; font-weight: bold; color: white; text-decoration: none;">
    Schedule Your Session
  </a>
  </div>
  <br>
  <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
  Ivy Accelerator Program<br>
  <a href="https://ik.imagekit.io/3olrnmipz/Ivy%20pdf.pdf?updatedAt=1732097919368" style="color: #3182ce;">View PDF</a>
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

    return res.status(200).json({
      message: "mail sent successfully",
      url,
    });
  });

  res.status(201).json({
    success: true,
    message: "Form submitted successfully",
   
  });
});

/////////////////////////// /////// send IVY confirmation form/////////////////////////////////////////////

exports.remove_ivy_approval = catchAsyncErrors(async (req, res, next) => {

  const formdata = req.body;
  const name = formdata.fullname;
  const email = formdata.email;

  const user = await User.findOne({ email }).exec();
  user.ivystudent = "no";
  await user.save();

  const form = await IVYForm.findById(req.body._id);
  if (!form) {
    return next(new ErrorHandler("Form not found", 404));
  }
  form.response = "pending";
  await form.save();

  res.status(201).json({
    success: true,
    message: "Approval removed successfully",
   
  });
});