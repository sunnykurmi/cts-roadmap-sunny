const nodemailer = require("nodemailer");
const ErorrHandler = require("./ErrorHandler");
const fs = require("fs");
const path = require("path");

exports.sendmailuser = (req, res, next, filepath, student) => {
    const transport = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // Use SSL
        auth: {
            user: process.env.MAIL_EMAIL_ADDRESS,
            pass: process.env.MAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: "crosstheskylimit24@gmail.com",
        to: student.email,
        subject: `${student.name}'s Roadmap from Cross The Skylimits`,
        html: `
            <html>
    <head>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                background-color: #f9fafb;
                color: #333;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                padding-bottom: 20px;
            }
            .header img {
                width: 100%; /* Set the image width to 100% */
                height: auto; /* Keep aspect ratio */
                display: block;
                margin: 0 auto;
            }
            .content {
                font-size: 16px;
                line-height: 1.5;
            }
            .footer {
                text-align: center;
                padding-top: 20px;
                font-size: 14px;
                color: #718096;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src=${'https://ik.imagekit.io/3olrnmipz/Creative%20Director%20Header%20Banner%20(6)%20(1).gif?updatedAt=1725718959074'} alt="Header Image" />
                <h1>Dear ${student.name},</h1>
            </div>
            <div class="content">
                <p>Congratulations! I’m excited to let you know that your personalized <b>Vardhan Roadmap</b> has been successfully created. This roadmap is the result of our in-depth process to ensure you take the right steps to achieve your dream of getting into top-tier universities.</p>
                <h2>Please Check your Attached Roadmap.</h2>
                <p>${student.name}, I must say, your dedication and hard work truly stood out in our recent meeting, and I’m confident that with this roadmap, you’re well on your way to securing a place at one of the world’s top universities.</p>
                <p>I’m just one message away if you have any questions or need further assistance. I’m here to support you on this journey to top-tier universities, every step of the way.</p>
                <p>Thank you once again for trusting <b>Cross the Skylimits</b>. Together, we’ll break barriers and cross the skylimits!</p>
                <p>Warm regards,</p>
                <p>Krishna MIT<br>Founder, Cross The Skylimits</p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Cross The Skylimits. All rights reserved.</p>
            </div>
        </div>
    </body>
</html>

        `,
        attachments: [
            {
                filename: `${req.id}.pdf`,
                path: filepath
            }
        ]
    };

    transport.sendMail(mailOptions, (err, info) => {
        if (err) return next(new ErorrHandler(err, 500));

        return res.status(200).json({
            message: "Mail sent successfully",
            filepath,
        });
    });
};
