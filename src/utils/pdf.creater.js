const ErorrHandler = require('../utils/ErrorHandler');
const PDFDocument = require('pdfkit');
const path = require('path');
const ImageKit = require("imagekit");
const sizeOf = require('image-size'); // Import image-size

// Initialize ImageKit
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_ENDPOINT
});

exports.pdfcreater = async (pdfname, roadmap,roadmapuserfullname) => {
    return new Promise((resolve, reject) => {
        try {
            // Create a new PDF document
            const doc = new PDFDocument();

            // Store the PDF document in a Buffer
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', async () => {
                try {
                    let pdfBuffer = Buffer.concat(buffers);

                    // Upload the PDF to ImageKit
                    const response = await imagekit.upload({
                        file: pdfBuffer, // the file as a Buffer
                        fileName: `${pdfname}.pdf`,
                        folder: '/roadmaps', // optional: folder in ImageKit where the file should be stored
                        useUniqueFileName: true, // to prevent file overwriting
                    });

                    resolve({
                        pdfname: `${pdfname}.pdf`,
                        pdfpath: response.url // URL of the uploaded PDF in ImageKit
                    });
                } catch (error) {
                    reject(new ErorrHandler('PDF upload failed', 500));
                }
            });

            // Define the path to the header image
            const headerPath = path.join(__dirname, '..', 'public', 'images', 'header.jpg'); 

            // Get the dimensions of the header image
            const dimensions = sizeOf(headerPath);
            const imageWidth = dimensions.width;
            const imageHeight = dimensions.height;

            // Get the dimensions of the PDF document
            const pdfWidth = doc.page.width;

            // Calculate the proportional height for the image
            const calculatedHeight = (imageHeight / imageWidth) * pdfWidth;

            // Add the header image to the PDF at the top with 100% width and calculated height
            doc.image(headerPath, 0, 0, {
                width: pdfWidth,
                height: calculatedHeight
            });

            // Move down a bit after the header image
            doc.moveDown(calculatedHeight / 20); // Adjust the spacing as needed

            // Clean up the roadmap text by removing ** and ### symbols
            const cleanedRoadmap = roadmap.replace(/(\*\*|###)/g, '');

            // Add title and roadmap content
            doc.fontSize(16).text(`${roadmapuserfullname}'s roadmap`.toUpperCase(), { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(cleanedRoadmap);

            // Define the path to the footer image
            const footerPath = path.join(__dirname, '..', 'public', 'images', 'footer.jpg');

            // Get the dimensions of the footer image
            const footerDimensions = sizeOf(footerPath);
            const footerWidth = footerDimensions.width;
            const footerHeight = footerDimensions.height;

            // Calculate the proportional width for the footer image based on the PDF width
            const calculatedFooterHeight = (footerHeight / footerWidth) * pdfWidth;

            // Add the footer image to the PDF at the bottom
            doc.image(footerPath, 0, doc.page.height - calculatedFooterHeight, {
                width: pdfWidth,
                height: calculatedFooterHeight
            });

            // Finalize the PDF file
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};
