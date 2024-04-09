const User = require("../model/User");
const otpGenerator = require("otp-generator");
const { sendOTP, sendMessage } = require("../sendEmail");

const handleNewUserVerification = async (req, res) => {
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

  if (foundUser && foundUser?.status !== 0) {
    return res.status(409).json({ message: "Email Already Exists" });
  }
  try {
    const otp = otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    req.session.otp = otp;
    req.session.otpExpiry = new Date(Date.now() + 5 * 60000);

    const succMessage =
      "Please note that your OTP code is valid for 5 minutes. Ensure to use it within this time frame.";

    await sendMessage(
      req.body?.email,
      "Register for 11GAutos",
      `${otp} ${succMessage}`,
      "blue"
    );

    res.status(200).json({
      success: `OTP Sent Successfully to ${req.body?.email}`,
      message: succMessage,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const handleOTPRequest = async (req, res) => {
  const { OTP, email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  if (!OTP) return res.status(400).json({ message: "OTP Required" });

  const foundUser = await User.findOne({
    email,
  }).exec();

  try {
    if (
      OTP !== req.session.otp ||
      new Date(req.session.otpExpiry) < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (foundUser && foundUser.status === 0) {
      await foundUser.save();
    } else {
      await User.create({
        email,
      });
    }

    req.session.otp = "";
    req.session.otpExpiry = "";

    await res
      .status(201)
      .json({ success: `OTP Sucessful, You can now Register` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { handleNewUserVerification, handleOTPRequest };
