const otpGenerator = require("otp-generator");
const mongoose = require("mongoose");

const User = require("../model/User");
const { sendMessage } = require("../sendEmail");

const handleDeleteVerification = async (req, res) => {
  const { userId } = req.params;

  const { email } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Valid User ID required" });
  }

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  const foundUser = await User.findOne({
    email,
    _id: userId,
  }).exec();

  if (!foundUser) {
    return res
      .status(401)
      .json({ message: "User does not Exist / Wrong userId / Wrong Email" });
  }
  if (foundUser && foundUser?.status === 0) {
    return res.status(401).json({ message: "Please Register your Account!!" });
  }
  if (foundUser && foundUser?.status === -1) {
    return res.status(401).json({ message: "Account Under Review" });
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
        "Delete Your Account",
        `${otp} ${succMessage}`,
        "#9C661F"
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

const handleDeleteOTPRequest = async (req, res) => {
  const { userId } = req.params;

  const { OTP, email } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Valid User ID required" });
  }

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  const foundUser = await User.findOne({
    email,
    _id: userId,
  }).exec();

  if (!foundUser) {
    return res
      .status(401)
      .json({ message: "User does not Exist / Wrong userId / Wrong Email" });
  }

  try {
    if (
      OTP !== foundUser?.otp.code ||
      new Date(foundUser.otp.expiresAt) < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (foundUser && foundUser.status !== 0) {
      foundUser.otp.code = process.env.DELETE_CONFIRM;
      foundUser.otp.expiresAt = "";
      await foundUser.save();
    }

    await res.status(201).json({
      success: `OTP Sucessful, You can now Proceed to Delete Account`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const handleDeleteMessage = async (req, res) => {
  const { userId } = req.params;

  const { deleteMessage, email } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Valid User ID required" });
  }

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (!deleteMessage) {
    return res.status(400).json({ message: "Reason for deletion required!!!" });
  }

  const admin = await User.find({
    "roles.Admin": { $exists: true, $ne: null },
  }).exec();

  const foundUser = await User.findOne({
    email,
    _id: userId,
  }).exec();

  if (!foundUser) {
    return res.status(401).json({
      message: "User does not Exist / Wrong userId / Wrong Email",
    });
  }

  if (foundUser && foundUser?.status === 0) {
    return res.status(401).json({ message: "Please Register your Account!!" });
  }
  if (foundUser && foundUser?.status === -1) {
    return res.status(401).json({ message: "Account Under Review" });
  }
  if (foundUser && foundUser?.status === 0) {
    return res.status(401).json({ message: "Please Register your Account!!" });
  }
  if (foundUser && foundUser?.otp.code !== process.env.DELETE_CONFIRM) {
    return res.status(401).json({ message: "Not Allowed" });
  }

  if (
    (foundUser.otp.code === process.env.DELETE_CONFIRM &&
      foundUser?.status === 1) ||
    (foundUser.otp.code === process.env.DELETE_CONFIRM &&
      foundUser?.status === 2)
  ) {
    try {
      foundUser.deleteMessage = deleteMessage;
      foundUser.otp.code = "";
      foundUser.status = -1;
      await foundUser.save();
      if (admin.length > 0) {
        for (const adminUser of admin) {
          await sendMessage(
            adminUser.email,
            `Request for Account Deletion with reason from ${foundUser.email}"`,
            `${foundUser.username} has requested for deletion of account due to "${deleteMessage}" reason`,
            "#E30B5D"
          );
        }
      }

      await sendMessage(
        email,
        `Request for Account Deletion with reason "${deleteMessage}"`,
        "Your request for account deletion has been passed to the admin. Please kindly wait for 24hrs for your request.",
        "#E30B5D"
      );
      res.status(201).json({ success: `Account Requested for Deletion` });
    } catch (error) {
      res.status(500).json({ error: `An error occurred: ${error}` });
    }
  }
};

const handleDelete = async (req, res) => {
  const { userId } = req.params;

  const { email, adminEmail } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Valid User ID required" });
  }

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (!adminEmail) {
    return res.status(400).json({ message: "Admin Email is required" });
  }

  if (!emailRegex.test(email) || !emailRegex.test(adminEmail)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  const admin = await User.find({
    "roles.Admin": { $exists: true, $ne: null },
  }).exec();

  const foundUser = await User.findOne({
    email,
  }).exec();

  const foundAdmin = await User.findOne({
    _id: userId,
    email: adminEmail,
  }).exec();

  if (!foundUser) {
    return res.status(400).json({
      message: "User does not Exist",
    });
  }
  if (!foundAdmin) {
    return res.status(401).json({
      message:
        "Admin User does not Exist / Wrong Admin UserId / Wrong Admin Email",
    });
  }

  if (!foundAdmin.roles.Admin || foundAdmin.roles.Admin !== 5150) {
    return res.status(401).json({
      message: "Acccess Denied!!",
    });
  }

  if (
    (foundUser && foundUser.roles.Admin) ||
    (foundUser && foundUser.roles.Admin === 5150)
  ) {
    return res.status(400).json({
      message: "Admin User cannot be deleted",
    });
  }

  if (foundUser && foundUser?.status !== -1) {
    return res.status(400).json({
      message: "User cannot be deleted because account is not yet suspended",
    });
  }

  try {
    if (admin.length > 0) {
      for (const adminUser of admin) {
        await sendMessage(
          adminUser.email,
          `Account Deleted Successfully`,
          `User ${foundUser.username} with email ${foundUser.email} account has been deleted by Admin ${foundAdmin.username}`,
          "#E30B5D"
        );
      }
    }

    await User.deleteOne({
      _id: foundUser._id,
    });

    await sendMessage(
      email,
      `Account Deleted Successfully`,
      `Your Acccount has been deleted from 11GAutos`,
      "#E30B5D"
    );
    res.status(201).json({ success: `Account Deleted Successfully` });
  } catch (error) {
    res.status(500).json({ error: `An error occurred: ${error}` });
  }
};

module.exports = {
  handleDeleteVerification,
  handleDeleteOTPRequest,
  handleDeleteMessage,
  handleDelete,
};
