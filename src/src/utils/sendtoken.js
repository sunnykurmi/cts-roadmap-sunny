// const { getiplocation } = require("../utils/getiplocation.js");

exports.sendtoken = async (user, statuscode, res) => {
    let token = user.getjwttoken();

    let options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Set to true in production
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 'None' for production, 'Lax' for development
    };

    // await getiplocation(user);

    res.status(statuscode)
        .cookie("token", token, options)
        .json({
            success: true,
            id: user._id,
            token
        });
};