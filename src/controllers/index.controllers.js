const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors")
const User = require("../models/user.schema.js")
const ErorrHandler = require("../utils/ErrorHandler")
const { sendtoken } = require("../utils/sendtoken")
const nodemailer = require("nodemailer")
let path = require('path')

let imagekit = require('../utils/imagekit.js').initImageKit()

// home page tasting 
exports.homepage = catchAsyncErrors(async (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "Welcome to crosstheskylimits"
    })
})

// signup student 
exports.signup = catchAsyncErrors(async (req, res, next) => {
    
    const {name, email, contact, password,avatar,date } = req.body
    
    
    if (
        [name, email, contact, password].some((field) => field?.trim() === "")
    ) {
        throw new ErorrHandler("User details required", 401)
    }

    
    const existedUser = await User.findOne({
        $or: [{ contact }, { email }]
    })  
    
    if (existedUser) {
        throw new ErorrHandler("User with this email or contact already exists",409)
    }

    const user = await User.create({
        name,
        email, 
        contact,
        date,
        avatar: avatar,
        password,
    })
    // await user.save()

    sendtoken(user,200,res)
})

// signin student 
exports.signin = catchAsyncErrors(async (req, res, next) => {
    // user found login
    let user = await User.findOne({email:req.body.email}).select("+password").exec()

    // if user not found
    if(!user) return next(new ErorrHandler("User not found with this email address", 404))
    
    // if password is incorrect
    const isMatch = await user.comparepassword(req.body.password)
    if(!isMatch) return next(new ErorrHandler("Incorrect password", 400))
    
    sendtoken(user,200,res)     
})

// signout student 
exports.signout = catchAsyncErrors(async (req, res, next) => {
    res.clearCookie("token");
    res.json({ message: "Successfully signout!" });
})

// current student
exports.currentuser = catchAsyncErrors(async (req, res, next) => {
    
    let user = await User.findById(req.id).populate('roadmaps').exec()

    // if user not found
    if(!user) return next(new ErorrHandler("User not found", 404))

    res.json({ success:true,user:user})
})  

// update student
exports.edituser = catchAsyncErrors(async (req, res, next) => {
    // Fetch the user by ID
    let user = await User.findById(req.params.id);

    // if user not found
    if (!user) return next(new ErorrHandler("User not found", 404));

    // Remove the avatar field from the request body
    const updates = { ...req.body };
    delete updates.avatar;

    // Update user fields except for the avatar field
    Object.keys(updates).forEach(key => {
        user[key] = updates[key];
    });

    // Save the updated user document
    await user.save();

    res.json({ success: true, message: "User updated successfully" });
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
            new ErorrHandler("User not found with this email address", 404)
        );

    const url = `${req.protocol}://${req.get("host")}/api/v1/user/forget-link/${
        user._id
    }`;
    // send forgot password link.

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
        // "text": "Do not share this link to anyone",
        html: `<h1>Click link blow to reset password</h1>
                <a href="${url}">Password Reset Link</a>`,
    };

    transport.sendMail(mailOptions, (err, info) => {
        if (err) return next(new ErorrHandler(err, 500));

        return res.status(200).json({
            message: "mail sent successfully",
            url,
        });
    });

    // *************************
    user.resetPasswordToken = "1";
    await user.save();
    res.json({ user, url });
});

exports.userforgetlink = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id).exec();

    if (!user)
        return next(
            new ErorrHandler("User not found with this email address", 404)
        );

    if (user.resetPasswordToken == "1") {
        user.resetPasswordToken = "0";
        user.password = req.body.password;
        await user.save();
    } else {
        return next(
            new ErorrHandler(
                "Invalid Reset Password Link! Please try again",
                500
            )
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
    if (!user) return next(new ErorrHandler("User not found", 404));
    res.status(200).json({
        success: true,
        message: "User deleted successfully",
    });
})







