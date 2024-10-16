const jwt = require("jsonwebtoken");
const ErorrHandler = require("../utils/ErrorHandler");
const { catchAsyncErrors } = require("./catchAsyncErrors");
const User = require("../models/user.schema");

// List of admin emails
const adminEmails = ['dubeypuran2002@gmail.com', 'crosstheskylimits@gmail.com', 'smarttuttee@gmail.com','sunnykurmiskks@gmail.com'];


exports.isAdmin = catchAsyncErrors(async (req, res, next) => {
    if (req.user && adminEmails.includes(req.user.email)) {
        next();
    } else {
        throw new ErorrHandler("please login with correct email address.", 401)
    }

});