const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const Internship = require("../models/internshipApplication.schema.js");
const ErrorHandler = require("../utils/ErrorHandler");

// Apply for internship
exports.applyinternship = catchAsyncErrors(async (req, res, next) => {
   try {
    const { name, email, contact, dateofbirth, classGrade,mode, city, income, board, dreamuniversity, reason, skills, ecs } = req.body;

    // Check if any required field is missing or empty
    if ([name, email, contact, dateofbirth, classGrade, city, income, board, dreamuniversity, reason, skills, ecs].some((field) => typeof field === 'string' && field.trim() === "")) {
        return next(new ErrorHandler("All fields are required", 401));
    }

    // Check if user with the same email or contact already exists
    const existedUser = await Internship.findOne({
        $or: [{ contact }, { email }]
    });

    if (existedUser) {
        return next(new ErrorHandler("User with this email or contact already apply for internship", 409));
    }

    // Create new internship application
    const internship = await Internship.create({
        name,
        email,
        contact,
        dateofbirth,
        mode,
        classGrade,
        city,
        income,
        board,
        dreamuniversity,
        reason,
        skills,
        ecs
    });
    await internship.save();

    res.status(200).json({
        success: true,
        message: "Application submitted successfully",
        internship
    });
   } catch (error) {
    res.status(500).json({ message: error.message
    });
   }
});

