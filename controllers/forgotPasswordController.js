const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");

const User = require("../model/User");
const { sendMessage } = require("../sendEmail");

const handleForgetVerification = async (req, res) => {
  const { email } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  const foundUser = await User.findOne({
    email,
  }).exec();

  if (!foundUser) {
    return res.status(401).json({ message: "User does not exist" });
  }
  if (foundUser && foundUser?.status === 0) {
    return res.status(401).json({ message: "Please Register your Account!!" });
  }

  if (
    (foundUser && foundUser?.status === 1) ||
    (foundUser && foundUser?.status === 2)
  ) {
    try {
      const otp = otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });

      foundUser.otp.code = otp;
      foundUser.otp.expiresAt = new Date(Date.now() + 5 * 60000);

      await foundUser.save();

      const succMessage =
        "Please note that your OTP code is valid for 5 minutes. Ensure to use it within this time frame.";

      await sendMessage(
        email,
        "Reset Password",
        `${otp} ${succMessage}`,
        "#4169E1"
      );

      res.status(200).json({
        success: `OTP Sent Successfully to ${req.body?.email}`,
        message: succMessage,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

const handleForgetOTPRequest = async (req, res) => {
  const { OTP, email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  if (!OTP) return res.status(400).json({ message: "OTP Required" });

  const foundUser = await User.findOne({
    email,
  }).exec();

  if (!foundUser) {
    return res.status(401).json({ message: "User does not exist" });
  }

  try {
    if (
      OTP !== foundUser?.otp.code ||
      new Date(foundUser.otp.expiresAt) < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (foundUser && foundUser.status !== 0) {
      foundUser.otp.code = process.env.FORGOT_SUCCESS;
      foundUser.otp.expiresAt = "";
      await foundUser.save();
    }

    await res
      .status(201)
      .json({ success: `OTP Sucessful, You can Change Your Password` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const handleResetPassword = async (req, res) => {
  const { email, pwd } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  if (!pwd) return res.status(400).json({ message: "Password is Required" });

  const foundUser = await User.findOne({ email });

  const admin = await User.find({
    "roles.Admin": { $exists: true, $ne: null },
  }).exec();

  if (!foundUser) {
    return res.status(401).json({ message: "User does not exist" });
  }

  if (foundUser && foundUser?.status === 0) {
    return res.status(401).json({ message: "Please Register your Account!!" });
  }
  if (foundUser && foundUser?.otp.code !== process.env.FORGOT_SUCCESS) {
    return res.status(401).json({ message: "Not Allowed, Please try Again" });
  }

  if (
    (foundUser.otp.code === process.env.FORGOT_SUCCESS &&
      foundUser?.status === 1) ||
    (foundUser.otp.code === process.env.FORGOT_SUCCESS &&
      foundUser?.status === 2)
  ) {
    const hashedPwd = await bcrypt.hash(pwd, 10);

    try {
      foundUser.password = hashedPwd;
      foundUser.otp.code = "";
      await foundUser.save();

      if (admin.length > 0) {
        for (const adminUser of admin) {
          await sendMessage(
            adminUser.email,
            `Password Changed for Account ${foundUser?.email}`,
            `This is to notify that password was changed for the user with email ${foundUser?.email}`,
            "#1E90FF"
          );
        }
      }

      await sendMessage(
        email,
        `Password Changed Sucessfully`,
        "Your password reset was successful, Please contact Us if you did not perform the action",
        "#1E90FF"
      );
      res
        .status(201)
        .json({ success: `${foundUser.username} Password was Changed` });
    } catch (error) {
      res.status(500).json({ error: `An error occurred: ${error}` });
    }
  }
};

module.exports = {
  handleForgetVerification,
  handleForgetOTPRequest,
  handleResetPassword,
};
