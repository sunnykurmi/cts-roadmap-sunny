const axios = require("axios");
const { oauth2Client } = require("../utils/googleConfig");
const userSchema = require("../models/user.schema");
const { sendtoken } = require("../utils/sendtoken");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");

//testing page
exports.google = catchAsyncErrors(async (req, res, next) => {
    let code = req.query.code;
    let googleRes;
    try {
        googleRes = await oauth2Client.getToken(code);
    } catch (error) {
        return res.status(401).json({ message: "Failed to get token from Google API" });
    }

    oauth2Client.setCredentials(googleRes.tokens);

    let userRes;
    try {
        userRes = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`);
    } catch (error) {
        return res.status(401).json({ message: "Failed to fetch user info from Google API" });
    }

    const { email, name, picture } = userRes.data;

    let user;
    try {
        user = await userSchema.findOne({ email });
        if (!user) {
            user = new userSchema({
                name,
                email,
                avatar: {
                    fileId: "",
                    url: picture
                }
            });
            await user.save();
        } else {
        }
    } catch (error) {
        return res.status(500).json({ message: "Failed to find or create user" });
    }

    try {
        sendtoken(user, 200, res);
    } catch (error) {
        return res.status(500).json({ message: "Failed to send token" });
    }
});