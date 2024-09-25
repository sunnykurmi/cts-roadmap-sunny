const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/ErrorHandler");
const { catchAsyncErrors } = require("./catchAsyncErrors");
const User = require("../models/user.schema");

exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
    let token
    // Check for token in headers if not found in cookies
    if (!token && req.query.token) {
        token = req.query.token;
      }

    if (!token) {
        return next(
            new ErrorHandler("Please login to access the resource", 401)
        );
    }

    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id);

    if (!user) {
        return next(
            new ErrorHandler("User not found", 404)
        );
    }

    req.user = user;
    req.id = id;
    next();
});