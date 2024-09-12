const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const User = require("../models/user.schema");
const PendingRoadmap = require("../models/pending.roadmap.schema.js");
let {initImageKit} = require('../utils/imagekit.js')
const { sendmailuser } = require('../utils/sendmailuser.js');
const UpdatedRoadmap = require("../models/updated.roadmap.schema.js");
// user related things

exports.getallusers = catchAsyncErrors(async (req, res, next) => {
    const users = await User.find().populate('roadmaps').exec();
    res.status(200).json({
        success: true,
        userlength: users.length,
        users,
    });
})



exports.upload_update_roadmap = catchAsyncErrors(async (req, res, next) => {
    // Find user by email
    const user = await User.findOne({ email: req.body.email }).exec();
    if (!user) {
        return res.status(400).json({
            success: false,
            message: "User not found"
        });
    }

    const data = req.body;

    // Initialize ImageKit
    const imagekit = initImageKit();

    // Upload the PDF file to ImageKit
    const response = await imagekit.upload({
        file: req.files.file.data, // the file as a Buffer
        fileName: req.files.file.name,
        folder: '/pdfs', // optional: folder in ImageKit where the file should be stored
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
        roadmapId => roadmapId.toString() !== req.body.id
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
    const roadmaps = await PendingRoadmap.find().populate('roadmapuser').exec();
    res.status(200).json({
        success: true,
        message: "All roadmaps",
        roadmaps
    })
})
// write code for find all roadmaps
exports.updatedroadmap = catchAsyncErrors(async (req, res, next) => {
    const roadmaps = await UpdatedRoadmap.find().populate('roadmapuser').exec();
    res.status(200).json({
        success: true,
        message: "All roadmaps",
        roadmaps
    })
})

