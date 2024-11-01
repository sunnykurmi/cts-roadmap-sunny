const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const Portfolio = require("../models/portfolio.schema.js");
const User = require("../models/user.schema.js");
const ErrorHandler = require("../utils/ErrorHandler"); // Fixed typo
const { sendtoken } = require("../utils/sendtoken");
const nodemailer = require("nodemailer");
let path = require("path");
let imagekit = require("../utils/imagekit.js").initImageKit();
const Exams = require("../models/exclusive-services/exam-preperation/examtiming.schema.js");
const IVYForm = require("../models/ivyForm.schema.js");

// home page tasting
exports.homepage = catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Welcome to crosstheskylimits",
  });
});

// signup student
exports.signup = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, avatar, date } = req.body;

  if ([name, email, password].some((field) => field?.trim() === "")) {
    return next(new ErrorHandler("User details required", 401));
  }

  const existedUser = await User.findOne({ email });

  if (existedUser) {
    return next(
      new ErrorHandler("User with this email or contact already exists", 409)
    );
  }

  const user = await User.create({
    name,
    email,
    date,
    avatar: avatar,
    password,
  });

  sendtoken(user, 200, res);
});

// signin student
exports.signin = catchAsyncErrors(async (req, res, next) => {
  console.log(req.body);
  let user = await User.findOne({ email: req.body.email })
    .select("+password")
    .exec();
  console.log("Ddd",user);
  if (!user)
    return next(
      new ErrorHandler("User not found with this email address", 404)
    );

  const isMatch = await user.comparepassword(req.body.password);
  if (!isMatch) return next(new ErrorHandler("Incorrect password", 400));

  sendtoken(user, 200, res);
  
});

// signout student
exports.signout = catchAsyncErrors(async (req, res, next) => {
  res.clearCookie("token");
  res.json({ message: "Successfully signout!" });
});

// current student
exports.currentuser = catchAsyncErrors(async (req, res, next) => {
  let user = await User.findById(req.id).populate("roadmaps").exec();

  if (!user) return next(new ErrorHandler("User not found", 404));

  res.json({ success: true, user: user });
});

// update student
exports.edituser = catchAsyncErrors(async (req, res, next) => {
  let user = await User.findById(req.params.id);

  if (!user) return next(new ErrorHandler("User not found", 404));

  const updates = { ...req.body };
  delete updates.avatar;

  Object.keys(updates).forEach((key) => {
    user[key] = updates[key];
  });

  await user.save();

  res.json({ success: true, message: "User updated successfully" });
});

// Add education to user
exports.addEducation = catchAsyncErrors(async (req, res, next) => {
  const userId = req.params.id;
  const newEducation = req.body;

  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  user.education = newEducation; // Replace the existing education object
  await user.save();

  res.status(200).json({ message: "Education added successfully", user });
});

// Add achievement to user
exports.addAchievement = catchAsyncErrors(async (req, res, next) => {
  const userId = req.params.id;
  const newAchievement = req.body.achievement;

  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  user.achievements.push(newAchievement);
  await user.save();

  res.status(200).json({ message: "Achievement added successfully", user });
});

// Update social media links
exports.updateSocialMedia = catchAsyncErrors(async (req, res, next) => {
  const userId = req.params.id;
  const newSocialMedia = req.body.socialmedia;

  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  user.socialmedia = { ...user.socialmedia, ...newSocialMedia };
  await user.save();

  res.status(200).json({ message: "Social media updated successfully", user });
});

exports.resetpassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.id).exec();
  user.password = req.body.password;
  await user.save();
  sendtoken(user, 201, res);
});

exports.usersendmail = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email }).exec();

  if (!user)
    return next(
      new ErrorHandler("User not found with this email address", 404)
    );

  const url = `${process.env.HOST}/forget-link/${user._id}`;

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
    to: req.body.email,
    subject: "Password Reset Link",
    html: `
            <div style="text-align: center; font-family: Arial, sans-serif; color: #333;">
                <h1 style="color: #4CAF50;">Password Reset Request</h1>
                <p style="margin: 0 0 15px 0;">Click the button below to reset your password.</p>
                
                <div style="text-align: center;">
                    <a href="${url}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #4CAF50; border-radius: 5px; text-decoration: none;">Reset Password</a>
                </div>
                <p style="margin-top: 20px;">If you did not request a password reset, please ignore this email.</p>
            </div>
        `,
  };

  // <img src="https://ik.imagekit.io/3olrnmipz/passresetuser.gif?updatedAt=1727437323262" alt="Password Reset" style="width: 100%; max-width: 600px; height: auto; margin: 20px 0;">

  transport.sendMail(mailOptions, (err, info) => {
    if (err) return next(new ErrorHandler(err, 500));

    return res.status(200).json({
      message: "mail sent successfully",
      url,
    });
  });

  user.resetPasswordToken = "1";
  await user.save();
  res.json({ user, url });
});

exports.userforgetlink = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id).exec();

  if (!user)
    return next(
      new ErrorHandler("User not found with this email address", 404)
    );

  if (user.resetPasswordToken == "1") {
    user.resetPasswordToken = "0";
    user.password = req.body.password;
    await user.save();
  } else {
    return next(
      new ErrorHandler("Invalid Reset Password Link! Please try again", 500)
    );
  }
  res.status(200).json({
    message: "Password has been successfully Changed",
  });
});

exports.studentavatar = catchAsyncErrors(async (req, res, next) => {
  const student = await User.findById(req.params.id).exec();
  const file = req.files.avatar;
  const modifiedFileName = `roadmapbuilder-${Date.now()}${path.extname(
    file.name
  )}`;

  if (student.avatar.fileId !== "") {
    await imagekit.deleteFile(student.avatar.fileId);
  }

  const { fileId, url } = await imagekit.upload({
    file: file.data,
    fileName: modifiedFileName,
    folder: "profileimgcts",
  });
  student.avatar = { fileId, url };
  await student.save();
  res.status(200).json({
    success: true,
    message: "Profile updated!",
  });
});

exports.deleteuser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id).exec();
  if (!user) return next(new ErrorHandler("User not found", 404));
  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

// portfolio controllers

// show all portfolio
exports.showportfolio = catchAsyncErrors(async (req, res, next) => {
  try {
    const portfolio = await Portfolio.find();
    if (!portfolio) return next(new ErrorHandler("portfolios not found", 404));
    res.status(200).json({
      success: true,
      portfolio,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error,
    });
  }
});

// get all exams
exports.allexams = catchAsyncErrors(async (req, res, next) => {
  try {
    const exams = await Exams.find().populate("total_enrolled").exec();
    if (!exams) return next(new ErrorHandler("exams not found", 404));
    res.status(200).json({
      success: true,
      exams,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error,
    });
  }
});

/////////////////////////////// IVY form route /////////////////////////////////////////
exports.submit_ivy_form = catchAsyncErrors(async (req, res, next) => {
  const formdata = req.body;
  console.log(formdata);
  const name = formdata.fullname;
  const email = formdata.email;

  // Fields to exclude from validation
  const excludedFields = [
  "tenthMarks",
      "eleventhMarks",
      "stream",
      "physicaldisabilitiestype",
      "activities",
      "skills",
  ];

  // Validate required fields
  const requiredFields = [
    "fullname",
    "gender",
    "email",
    "contact",
    "city",
    "class",
    "educationBoard", 
    "stream",
    "entranceExam",
    "aboutsatexam",
    "countrypreferance",
    "satScore",
    "dreamuniversity",
    "englishtest",
    "interestField",
    "BecomeInFuture",
    "familyincome",
    "physicaldisabilities",
  ];

  for (const field of requiredFields) {
    if (!excludedFields.includes(field) && !formdata[field]) {
      return next(new ErrorHandler(`${field} is required`, 400));
    }
  }

  // Create a new IVYForm document
  const newForm = new IVYForm(formdata);

  // Save the form data to the database
  await newForm.save();

  console.log(newForm);
  // Send a response to the client by mail

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
          The Ivy Accelerator is not just a program; it’s a powerful, not-for-profit initiative created to give talented students like you an exceptional edge in college admissions. We’re focused on quality over quantity, accepting only a select few. With an acceptance rate of just 16%, you’re part of an exclusive community that has been handpicked for success.
        </p>
        <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
        <span style="font-weight: bold;">What’s Next?</span> <br>
          
          As a new member of Ivy Accelerator, you’re on a path to boost your admission chances by an incredible 600%. Here, we’ll guide you through every aspect of the college application process, sharing innovative strategies and personalized support. We’ve built this program over 5 years, and it’s the most innovative opportunity available for students serious about reaching top universities.
        </p>

<p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
To begin, you’re invited to schedule a one-on-one session with none other than Krishna MIT, the visionary behind this program. In this exclusive session, Krishna will walk you through your personalized roadmap and the next steps, giving you insider guidance to set you up for success.
</p>
        <div style="width: 100%; height: 6vh; display: flex; align-items: center; justify-content: center;">
  <a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ3uebZdgiWELCFCxZ-krU8U1IY8rVT8Wc2lOOgmR5OQP60tAvPrA6wKVDtP7siAgBET1V5p72c2?gv=true" style="padding: 1.5vh 2vh; border-radius: 1vw; background-color: #008BDC; font-size: 1vw; font-weight: bold; color: white; text-decoration: none;">
    Schedule Your Session
  </a>
</div>
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
    data: newForm,
  });
});
