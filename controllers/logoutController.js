const User = require("../model/User");

const handleLogout = async (req, res) => {
  const refreshToken = req.cookies?.jwt;
  if (!refreshToken)
    return res.status(404).json({
      message: `No Cookie Availiable`,
    });

  // is refershToken in db?
  const foundUser = await User.findOne({ refreshToken }).exec();
  if (!foundUser) {
    res.clearCookie("jwt", { httpOnly: true, SameSite: "None", secure: true });
    return res.status(404).json({
      message: `User Not Found`,
    });
  }

  // Delete refreshToken in the db

  // foundUser.refreshToken = foundUser.refreshToken.filter(
  //   (rt) => rt !== refreshToken
  // );

  foundUser.refreshToken = [];

  await foundUser.save();
  console.log(
    `User ${foundUser.username} with email ${foundUser.email} is logged out`
  );
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: true,
    SameSite: "None",
  });
  res.status(200).json({
    message: `Thank You ${foundUser.username}, Your Account is Logged Out`,
    warning: "Delete Access Token from Client",
  });
};

module.exports = { handleLogout };
