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
        console.error("Error getting token:", error.response ? error.response.data : error.message);
        return res.status(401).json({ message: "Failed to get token from Google API" });
    }

    oauth2Client.setCredentials(googleRes.tokens);
    console.log("Access Token:", googleRes.tokens.access_token);

    let userRes;
    try {
        userRes = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`);
        console.log("User Info:", userRes.data);
    } catch (error) {
        console.error("Error fetching user info:", error.response ? error.response.data : error.message);
        return res.status(401).json({ message: "Failed to fetch user info from Google API" });
    }

    const { email, name, picture } = userRes.data;

    let user;
    try {
        user = await userSchema.findOne({ email });
        if (!user) {
            console.log("User not found, creating new user...");
            user = new userSchema({
                name,
                email,
                avatar: {
                    fileId: "",
                    url: picture
                }
            });
            await user.save();
            console.log("New user created:", user);
        } else {
            console.log("User found:", user);
        }
    } catch (error) {
        console.error("Error finding or creating user:", error.message);
        return res.status(500).json({ message: "Failed to find or create user" });
    }

    try {
        sendtoken(user, 200, res);
    } catch (error) {
        console.error("Error sending token:", error.message);
        return res.status(500).json({ message: "Failed to send token" });
    }
});