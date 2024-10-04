const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");
const Portfolio = require("../models/portfolio.schema.js");
const ErrorHandler = require("../utils/ErrorHandler.js");
const imagekit = require('../utils/imagekit.js').initImageKit();
let path = require('path');

// create portfolio
exports.createportfolio = catchAsyncErrors(async (req, res, next) => {
    try {
        const { name, livelink, price, description,purchased } = req.body;

        if (!name || !livelink || !price || !description || !purchased) {
            return next(new ErrorHandler("Please enter all fields", 400));
        }

        let videoDetails = {
            fileId: "",
            url: ""
        };

        // Check if a video file is uploaded
        if (req.files && req.files.video) {
            const videoFile = req.files.video;
            const modifiedFileName = `portfolio-video-${Date.now()}${path.extname(videoFile.name)}`;

            // Upload video to ImageKit
            const uploadResponse = await imagekit.upload({
                file: videoFile.data,
                fileName: modifiedFileName,
                folder: '/portfolio-videos'
            });

            videoDetails = {
                fileId: uploadResponse.fileId,
                url: uploadResponse.url
            };
        }

        // Create new portfolio
        const portfolio = await Portfolio.create({
            name,
            livelink,
            price,
            description,
            video: videoDetails,
            purchased
        });

        res.status(200).json({
            success: true,
            message: "Portfolio created successfully",
            portfolio
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// delete portfolio
exports.deleteportfolio = catchAsyncErrors(async (req, res, next) => {
    try {
        // Retrieve the portfolio to get the video fileId
        const portfolio = await Portfolio.findById(req.params.id);
        if (!portfolio) {
            return next(new ErrorHandler("Portfolio not found", 404));
        }

        // Delete the portfolio document
        await Portfolio.findByIdAndDelete(req.params.id);

        // If the portfolio has a video, delete it from ImageKit
        if (portfolio.video && portfolio.video.fileId) {
            await imagekit.deleteFile(portfolio.video.fileId);
        }

        res.status(200).json({
            success: true,
            message: "Portfolio deleted successfully",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// update portfolio
exports.updateportfolio = catchAsyncErrors(async (req, res, next) => {
    try {
        const updateFields = {};

        // Add fields to updateFields object only if they are provided in the request body
        if (req.body.name) updateFields.name = req.body.name;
        if (req.body.livelink) updateFields.livelink = req.body.livelink;
        if (req.body.price) updateFields.price = req.body.price;
        if (req.body.description) updateFields.description = req.body.description;
        if (req.body.purchased) updateFields.purchased = req.body.purchased;

        // Check if updateFields is empty
        if (Object.keys(updateFields).length === 0 && !req.files?.video) {
            return next(new ErrorHandler("Please provide at least one field to update", 400));
        }

        // Handle video update
        if (req.files && req.files.video) {
            const videoFile = req.files.video;
            const modifiedFileName = `portfolio-video-${Date.now()}${path.extname(videoFile.name)}`;

            // Upload new video to ImageKit
            const uploadResponse = await imagekit.upload({
                file: videoFile.data,
                fileName: modifiedFileName,
                folder: 'portfolio-videos'
            });

            // Add video details to updateFields
            updateFields.video = {
                fileId: uploadResponse.fileId,
                url: uploadResponse.url
            };

            // Retrieve the existing portfolio to get the old video fileId
            const existingPortfolio = await Portfolio.findById(req.params.id);
            if (existingPortfolio && existingPortfolio.video && existingPortfolio.video.fileId) {
                // Delete the old video from ImageKit
                await imagekit.deleteFile(existingPortfolio.video.fileId);
            }
        }

        // Update portfolio
        const portfolio = await Portfolio.findByIdAndUpdate(req.params.id, {
            $set: updateFields
        }, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        });

        if (!portfolio) {
            return next(new ErrorHandler("Portfolio not found", 404));
        }

        res.status(200).json({
            success: true,
            message: "Portfolio updated successfully",
            portfolio
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

