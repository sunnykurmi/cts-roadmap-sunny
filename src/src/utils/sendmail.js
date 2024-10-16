const nodemailer = require("nodemailer");
const ErorrHandler = require("./ErrorHandler");

exports.sendmail = (req, res, next, filepath, student) => {
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
        subject: `${student.name}'s roadmap from Cross The Skylimits`,
        text: "Please find attached your roadmap.",
        attachments: [
            {
                filename: `${req.id}.txt`,
                path: filepath
            }
        ]
    };
    
    transport.sendMail(mailOptions, (err, info) => {
        if (err) return next(new ErorrHandler(err, 500));
        // console.log(info);

        return res.status(200).json({
            message: "mail sent successfully",
            filepath,
        });
    });
};