const fs = require('fs');
const path = require('path');
const ImageKit = require("imagekit");
const ErorrHandler = require('./ErrorHandler');

// Initialize ImageKit
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_ENDPOINT
});

exports.txtCreater = async (txtname, roadmap, roadmapuserfullname,formdata) => {
    try {
        // Clean up the roadmap text by removing ** and ### symbols
        const cleanedRoadmap = roadmap.replace(/(\*\*|###)/g, '');

        // Prepare the content to be written in the text file
        const fileContent = `${roadmapuserfullname.toUpperCase()}'s Roadmap\n\n ${formdata}'s Roadmap\n\n ${cleanedRoadmap}`;

        // Convert the content to a Buffer
        const fileBuffer = Buffer.from(fileContent, 'utf-8');

        // Upload the text file to ImageKit
        const response = await imagekit.upload({
            file: fileBuffer, // the file as a Buffer
            fileName: `${txtname}.txt`,
            folder: '/roadmap_txt', // optional: folder in ImageKit where the file should be stored
            useUniqueFileName: true, // to prevent file overwriting
        });

        return {
            txtname: `${txtname}.txt`,
            txtpath: response.url // URL of the uploaded text file in ImageKit
        };
    } catch (error) {
        throw new ErorrHandler(error.message || 'Text file creation or upload failed', 500);
    }
};