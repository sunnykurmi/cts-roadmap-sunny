const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const Portfolio = require("../models/portfolio.schema.js");
const User = require("../models/user.schema.js");
const ErrorHandler = require("../utils/ErrorHandler"); // Fixed typo
const { sendtoken } = require("../utils/sendtoken");
const nodemailer = require("nodemailer");
let path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");

let imagekit = require("../utils/imagekit.js").initImageKit();

// home page tasting
exports.homepage = catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Welcome to crosstheskylimits",
  });
});

// signup student
exports.signup = catchAsyncErrors(async (req, res, next) => {
  // Validate the request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password, avatar, date } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      avatar,
      date,
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    const user = await User.findOne({ email });

    // Optionally set the token in a cookie
    res.cookie("token", token, { httpOnly: true }); // Optional: Use secure: true in production
    res
      .status(201)
      .json({ message: "User registered successfully.", newUser: user, token });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error registering user.", error: error.message });
    console.log(error);
  }
});

// signin student
exports.signin = catchAsyncErrors(async (req, res, next) => {
  // Validate the request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select("password");
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const loggedinUser = await User.findOne({ email }).exec();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.cookie("token", token, { httpOnly: true });
    res
      .status(200)
      .json({ message: "Login successful.", user: loggedinUser, token });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error logging in.", error: error });
  }
});

// signout student
exports.signout = catchAsyncErrors(async (req, res, next) => {
  res.clearCookie("token"); // Clear the cookie if you are using it
  res.json({
    message: "Logout successful. Please remove the token from the client.",
  });
});

// current student
exports.currentuser = catchAsyncErrors(async (req, res, next) => {
  try {
    console.log('crnt user id :',req.id);
    let user = await User.findById(req.id).populate("roadmaps");
    console.log(user.email)

      // If user not found
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

    res.status(200).json({ success: true, user: user });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
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

  const url = `${req.protocol}://crosstheskylimits.online/forget-link/${user._id}`;

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

// Validation rules for registration and login
exports.validateRegistration = [
    check("name").not().isEmpty().withMessage("Name is required"),
    check("email").isEmail().withMessage("Please enter a valid email"),
    check("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/\d/)
      .withMessage("Password must contain a number"),
  ];
  
  exports.validateLogin = [
    check("email").isEmail().withMessage("Please enter a valid email"),
    check("password").not().isEmpty().withMessage("Password is required"),
  ];