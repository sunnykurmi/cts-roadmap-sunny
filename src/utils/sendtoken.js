// const { getiplocation } = require("../utils/getiplocation.js");
let jwt = require("jsonwebtoken");

exports.sendtoken = async (user, statuscode, res) => {
  
  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  // await getiplocation(user);

  res.cookie("token", token, { httpOnly: true }); // Optional: Use secure: true in production
  res
    .status(statuscode)
    .json({ success: true, id: user._id, token });
};
