const User = require("../model/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const handleLogin = async (req, res) => {
  const cookies = req.cookies;
  console.log(`cookie avaliable at login: ${JSON.stringify(cookies)}`);
  const { email, pwd } = req.body;
  if (!email || !pwd)
    return res
      .status(400)
      .json({ message: "Email and password are required." });

  const foundUser = await User.findOne({ email }).exec();
  if (!foundUser) return res.sendStatus(401); //Unauthorized
  // evaluate password
  const match = await bcrypt.compare(pwd, foundUser.password);
  if (match) {
    const roles = Object.values(foundUser.roles).filter(Boolean);
    // create JWTs
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
    const newRefreshToken = jwt.sign(
      {
        _id: foundUser._id,
        roles: roles,
      },
      process.env.REFRESH_TOKEN,
      { expiresIn: "1h" }
    );
    // changed to learn keyword
    let newRefreshTokenArray = !cookies?.jwt
      ? foundUser.refreshToken
      : foundUser.refreshToken.filter((rt) => rt !== cookies.jwt);

    if (cookies.jwt) {
      /* 
         Scemario added here
            1) User logs in but never uses RT and does not log out
            2) RT is stolen
            3) If 1 & 2, reuse detection is needed to clear ALL RTs   
      */

      const refreshToken = cookies.jwt;
      const foundToken = await User.findOne({ refreshToken }).exec();

      // Detected refresh token reuse
      if (!foundToken) {
        console.log("attempted to reuse refresh token at Login!!");

        // clear out all previous refresh tokens
        newRefreshTokenArray = [];
      }
      await res.clearCookie("jwt", {
        httpOnly: true,
        secure: true,
        SameSite: "None",
      });
    }

    // Saving refreshToken with current user
    foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
    await foundUser.save();
    console.log(
      `User ${foundUser.username} with email ${foundUser.email} is logged in`
    );

    // Creates Secure Cookie with refresh token
    res.cookie("jwt", newRefreshToken, {
      httpOnly: true,
      secure: true,
      SameSite: "None",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Send authorization roles and access token to user
    res.json({
      accessToken,
      message: `Hello ${foundUser.username}, You are logged in`,
    });
  } else {
    res.sendStatus(401);
  }
};

module.exports = { handleLogin };
