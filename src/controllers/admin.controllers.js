const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const User = require("../models/user.schema");
const PendingRoadmap = require("../models/pending.roadmap.schema.js");
let { initImageKit } = require("../utils/imagekit.js");
const { sendmailuser } = require("../utils/sendmailuser.js");
const UpdatedRoadmap = require("../models/updated.roadmap.schema.js");
const Internship = require("../models/internshipApplication.schema.js");
let Exam = require("../models/exclusive-services/exam-preperation/examtiming.schema.js");
const ErrorHandler = require("../utils/ErrorHandler.js");

// payment schema
const PortfolioPayment = require("../models/payment.schema.js");
const CommanappPayment = require("../models/exclusive-services/common.app.schema.js");
const Essaypayment = require("../models/exclusive-services/eassy.editing.schema.js");
const CssProfilePayment = require("../models/exclusive-services/css.profile.schema.js");
const Examprep_payment = require("../models/exclusive-services/exam-preperation/exampayment.schema.js");


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
