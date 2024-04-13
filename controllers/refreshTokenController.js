const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

const User = require("../model/User");

const handleRefreshToken = async (req, res) => {
  const refreshToken = req.cookies?.jwt;
  if (!refreshToken)
    return res.status(401).json({
      message: `No Cookie Availiable`,
    });

  await res.clearCookie("jwt", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  });

  const foundUser = await User.findOne({ refreshToken }).exec();

  // Detected refresh token reuse
  if (!foundUser) {
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN,
      async (err, decoded) => {
        if (err)
          return res.status(403).json({
            message: `Error Occured, ${err}`,
          });
        console.log("attempted refresh token reuse!");
        const hackedUser = await User.findOne({
          _id: decoded._id,
        }).exec();

        hackedUser.refreshToken = [];
        return res.status(403).json({
          message: `Attempted refresh token reuse!!`,
        });

        // const roles = Object.values(hackedUser.roles);
        // const newAccessToken = jwt.sign(
        //   {
        //     UserInfo: {
        //       _id: hackedUser._id,
        //       roles: roles,
        //     },
        //   },
        //   process.env.ACCESS_TOKEN,
        //   { expiresIn: "20s" }
        // );

        // // Send the new access token in the response
        // res.json({
        //   accessToken: newAccessToken,
        //   message: ` Account was refreshed , Please Log Out if action was not perfromed by You`,
        // });
      }
    );
  }

  if (foundUser) {
    const newRefreshTokenArray = foundUser.refreshToken.filter(
      (rt) => rt !== refreshToken
    );
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN,
      async (err, decoded) => {
        if (err) {
          foundUser.refreshToken = [...newRefreshTokenArray];
          await foundUser.save();
        }
        const foundDecodedId = new ObjectId(foundUser._id);
        if (err || foundDecodedId.toString() !== decoded._id)
          return res.status(403).json({
            message: `Expired / Not Valid Refresh Token, ${err}`,
          });
        // Refresh token was still valid
        const roles = Object.values(foundUser.roles);
        const accessToken = jwt.sign(
          {
            UserInfo: {
              _id: foundUser._id,
              roles: roles,
            },
          },
          process.env.ACCESS_TOKEN,
          { expiresIn: "20m" }
        );
        // const newRefreshToken = jwt.sign(
        //   { username: foundUser.username, email: foundUser.email },
        //   process.env.REFRESH_TOKEN,
        //   { expiresIn: "1d" }
        // );
        const newRefreshToken = jwt.sign(
          {
            _id: foundUser._id,
            roles: roles,
          },
          process.env.REFRESH_TOKEN,
          { expiresIn: "1d" }
        );
        // Saving refreshToken with current user
        foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
        await foundUser.save();
        // Creates Secure Cookie with refresh token
        res.cookie("jwt", newRefreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "None",
          maxAge: 24 * 60 * 60 * 1000,
        });
        res.json({ accessToken }); // Return the new access token in the response
      }
    );
  }
};

module.exports = { handleRefreshToken };
