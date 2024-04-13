const User = require("../model/User");
const mongoose = require("mongoose");

const bcrypt = require("bcrypt");
const { uploadAvatarS3 } = require("../s3service/avatarS3");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    if (!users || users.length === 0) {
      return res.status(204).json({ message: "No users found" });
    }

    const userDetails = users.map((user) => ({
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      avatar: user.avatar,
      status: user.status,
    }));

    res.json(userDetails);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getUser = async (req, res) => {
  const { userId } = req.params;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Valid User ID required" });
  }

  if (!userId) return res.status(400).json({ message: "User ID required" });
  const user = await User.findOne({ _id: userId }).exec();

  if (!user) return res.status(404).json({ message: "User Not Availiable" });
  res.json({
    email: user.email,
    phoneNumber: user.phoneNumber,
    address: user.address,
    avatar: user.avatar,
    status: user.status,
    username: user.username,
  });
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { user, pwd, phoneNumber, address } = req.body;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Valid User ID required" });
    }

    const foundUser = await User.findOne({ _id: userId }).exec();

    if (!foundUser) {
      return res.status(404).json({ message: `User ID ${id} not found` });
    }

    if (user) {
      foundUser.username = user;
    }

    if (pwd) {
      const hashedPwd = await bcrypt.hash(pwd, 10);

      foundUser.password = hashedPwd;
    }

    if (address) {
      if (
        typeof address !== "object" ||
        !address.street ||
        !address.city ||
        !address.state ||
        !address.country ||
        !address.houseNo
      ) {
        return res.status(400).json({
          message: "Invalid Address format / Missing Address details`",
        });
      }
      foundUser.address = address;
    }

    if (phoneNumber) {
      foundUser.phoneNumber = phoneNumber;
    }

    await foundUser.save();

    res.json({ message: "Account Updated Sucessfully" });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const uploadAvatar = async (req, res) => {
  const { userId } = req?.params;
  const file = req?.file;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Valid User ID required" });
  }

  if (!file) {
    return res.status(400).json({ message: "Image is required" });
  }

  const foundUser = await User.findOne({ _id: userId }).exec();

  if (!foundUser) {
    return res.status(404).json({ message: `User ID ${userId} not found` });
  } else {
    try {
      const response = await uploadAvatarS3(file, foundUser?.username);

      foundUser.avatar = response?.Location;

      await foundUser.save();

      return res.status(200).json({ message: `Profile Picture Updated` });
    } catch (error) {
      console.log("Avatar Upload", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

const updateUserStatus = async (req, res) => {
  const { email, status } = req?.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const foundUser = await User.findOne({ email }).exec();

  if (!foundUser) {
    return res.status(404).json({ message: `Email Not found` });
  }

  try {
    if (status === 1) {
      foundUser.status = status;

      await foundUser.save();

      return res.status(200).json({
        message: `This account with email ${email} has been unblocked`,
      });
    }
    if (status === 2) {
      foundUser.status = status;
      await foundUser.save();

      return res.status(200).json({
        message: `Account ${email} has been accepted as a Car Dealer`,
      });
    }
    if (status === -1) {
      foundUser.status = status;

      await foundUser.save();
      return res.status(200).json({
        message: `This account with email ${email} has been SUSPENDED`,
      });
    }

    if (status !== 2 && status !== 1 && status !== -1) {
      return res.status(401).json({
        message: `Status Not allowed`,
      });
    }
  } catch (error) {
    console.log("Update Status", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getAllUsers,
  updateUser,
  getUser,
  uploadAvatar,
  updateUserStatus,
};
