const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const Portfolio = require("../models/portfolio.schema.js");
const User = require("../models/user.schema.js");
const ErrorHandler = require("../utils/ErrorHandler"); // Fixed typo
const { sendtoken } = require("../utils/sendtoken");
const nodemailer = require("nodemailer");
let path = require('path');

let imagekit = require('../utils/imagekit.js').initImageKit();

// home page tasting 
exports.homepage = catchAsyncErrors(async (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "Welcome to crosstheskylimits"
    });
});

// signup student 
exports.signup = catchAsyncErrors(async (req, res, next) => {
    const { name, email, contact, password, avatar, date } = req.body;

    if ([name, email, contact, password].some((field) => field?.trim() === "")) {
        return next(new ErrorHandler("User details required", 401));
    }

    const existedUser = await User.findOne({
        $or: [{ contact }, { email }]
    });

    if (existedUser) {
        return next(new ErrorHandler("User with this email or contact already exists", 409));
    }

    const user = await User.create({
        name,
        email,
        contact,
        date,
        avatar: avatar,
        password,
    });

    sendtoken(user, 200, res);
});

// signin student 
exports.signin = catchAsyncErrors(async (req, res, next) => {
    let user = await User.findOne({ email: req.body.email }).select("+password").exec();

    if (!user) return next(new ErrorHandler("User not found with this email address", 404));

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
    let user = await User.findById(req.id).populate('roadmaps').exec();

    if (!user) return next(new ErrorHandler("User not found", 404));

    res.json({ success: true, user: user });
});

// update student
exports.edituser = catchAsyncErrors(async (req, res, next) => {
    let user = await User.findById(req.params.id);

    if (!user) return next(new ErrorHandler("User not found", 404));

    const updates = { ...req.body };
    delete updates.avatar;

    Object.keys(updates).forEach(key => {
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

    res.status(200).json({ message: 'Education added successfully', user });
});

// Add achievement to user
exports.addAchievement = catchAsyncErrors(async (req, res, next) => {
    const userId = req.params.id;
    const newAchievement = req.body.achievement;

    const user = await User.findById(userId);
    if (!user) return next(new ErrorHandler("User not found", 404));

    user.achievements.push(newAchievement);
    await user.save();

    res.status(200).json({ message: 'Achievement added successfully', user });
});

// Update social media links
exports.updateSocialMedia = catchAsyncErrors(async (req, res, next) => {
    const userId = req.params.id;
    const newSocialMedia = req.body.socialmedia;

    const user = await User.findById(userId);
    if (!user) return next(new ErrorHandler("User not found", 404));

    user.socialmedia = { ...user.socialmedia, ...newSocialMedia };
    await user.save();

    res.status(200).json({ message: 'Social media updated successfully', user });
});

exports.resetpassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.id).exec();
    user.password = req.body.password;
    await user.save();
    sendtoken(user, 201, res);
});

exports.usersendmail = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email }).exec();

    if (!user) return next(new ErrorHandler("User not found with this email address", 404));

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

    if (!user) return next(new ErrorHandler("User not found with this email address", 404));

    if (user.resetPasswordToken == "1") {
        user.resetPasswordToken = "0";
        user.password = req.body.password;
        await user.save();
    } else {
        return next(new ErrorHandler("Invalid Reset Password Link! Please try again", 500));
    }
    res.status(200).json({
        message: "Password has been successfully Changed",
    });
});

exports.studentavatar = catchAsyncErrors(async (req, res, next) => {
    const student = await User.findById(req.params.id).exec();
    const file = req.files.avatar;
    const modifiedFileName = `roadmapbuilder-${Date.now()}${path.extname(file.name)}`;

    if (student.avatar.fileId !== "") {
        await imagekit.deleteFile(student.avatar.fileId);
    }

    const { fileId, url } = await imagekit.upload({
        file: file.data,
        fileName: modifiedFileName,
        folder: 'profileimgcts',
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
        const portfolio = await Portfolio.find()
    if (!portfolio) return next(new ErrorHandler("portfolios not found", 404));
    res.status(200).json({
        success: true,
        portfolio
    });
    } catch (error) {
        res.status(400).json({
            success: false,
            error
        });
    }
})