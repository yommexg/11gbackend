const User = require("../model/User");
const mongoose = require("mongoose");

const bcrypt = require("bcrypt");
const { uploadAvatarS3 } = require("../s3service/avatarS3");

const { sendMessage } = require("../sendEmail");
const { uploadDocument } = require("../s3service/document");

const getAllUsers = async (req, res) => {
  const { userId } = req?.params;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Valid User ID required" });
  }

  const foundUser = await User.findOne({
    _id: userId,
  }).exec();

  if (!foundUser) {
    return res.status(401).json({ message: "User Not Found" });
  }

  try {
    const users = await User.find();
    if (!users || users.length === 0) {
      return res.status(204).json({ message: "No User found" });
    }

    const userDetails = users.map((user) => {
      let role = "User"; // Default role
      if (user.roles.Admin === 5150) {
        role = "Admin";
      }

      return {
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        avatar: user.avatar,
        status: user.status,
        username: user.username,
        role,
        date: user.createdAt,
      };
    });

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

  if (!user) return res.status(404).json({ message: "User Not Found" });
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
      return res.status(404).json({ message: `User Not Found` });
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
    return res.status(404).json({ message: `User Not found` });
  } else {
    try {
      const response = await uploadAvatarS3(file, foundUser?.username);

      foundUser.avatar = response;

      await foundUser.save();

      return res.status(200).json({ message: `Profile Picture Updated` });
    } catch (error) {
      console.log("Avatar Upload", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

const sellCarRequest = async (req, res) => {
  const { documentName } = req?.body;
  const { userId } = req?.params;
  const file = req?.file;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Valid User ID required" });
  }

  if (!file) {
    return res.status(400).json({ message: "Image is required" });
  }

  const foundUser = await User.findOne({ _id: userId }).exec();

  const admin = await User.find({
    "roles.Admin": { $exists: true, $ne: null },
  }).exec();

  if (!foundUser) {
    return res.status(404).json({ message: `User Not found` });
  } else {
    try {
      const response = await uploadDocument(
        file,
        foundUser?.username,
        documentName
      );

      foundUser.document.name = documentName;
      foundUser.document.file = response;
      foundUser.status = 3;

      await foundUser.save();

      if (admin.length > 0) {
        for (const adminUser of admin) {
          await sendMessage(
            adminUser.email,
            `Awaiting Immediate Response`,
            `User ${foundUser.username} with email ${foundUser.email} has requested to become a seller at 11G Autos. Please Login to Admin dashboard to view and respond`,
            "yellow"
          );
        }
      }

      await sendMessage(
        foundUser.email,
        `Request Submtted`,
        `Your request to become a seller at 11G Autos has been received. Please kindly wait for 24hrs to get a response. If not call +2348153192058`,
        "yellow"
      );

      return res.status(200).json({ message: `Document Uploaded` });
    } catch (error) {
      console.log("Document Upload", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

const updateUserStatus = async (req, res) => {
  const { email, status, reason } = req?.body;
  const { userId } = req?.params;

  const foundAdmin = await User.findOne({
    _id: userId,
  }).exec();

  const admin = await User.find({
    "roles.Admin": { $exists: true, $ne: null },
  }).exec();

  if (!foundAdmin) {
    return res.status(401).json({ message: "Access Denied" });
  }

  if (!userId) {
    return res.status(400).json({ message: "User Id is required" });
  }

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const foundUser = await User.findOne({ email }).exec();

  if (!foundUser) {
    return res.status(404).json({ message: `User Not found` });
  }

  try {
    if (status === 1) {
      if (!reason) {
        return res.status(400).json({ message: "Reason is required" });
      }

      foundUser.status = status;
      await foundUser.save();

      const message = `The account with email ${foundUser?.email} request has been denied due to "${reason}"`;

      if (admin.length > 0) {
        for (const adminUser of admin) {
          await sendMessage(
            adminUser.email,
            `Request Rejected`,
            `${message} by ${foundAdmin.username}`,
            "yellow"
          );
        }
      }

      await sendMessage(
        foundUser.email,
        `Request Rejected`,
        `Your Request to become a seller at 11GAutos has been denied due to ( ${reason} ). Contact us at +2348153192058`,
        "yellow"
      );

      return res.status(200).json({
        message: "Request Denied",
      });
    }
    if (status === 2) {
      foundUser.status = status;
      await foundUser.save();

      if (admin.length > 0) {
        for (const adminUser of admin) {
          await sendMessage(
            adminUser.email,
            `Account Upgraded`,
            `The account with email ${foundUser?.email} has been upgraded to a seller by admin ${foundAdmin.username}`,
            "green"
          );
        }
      }

      await sendMessage(
        foundUser.email,
        `Account Upgraded`,
        `Congratulations!, You have been approved to upload and sell your cars on our website at 11GAutos`,
        "green"
      );

      return res.status(200).json({
        message: `Account has been accepted as a Car Seller`,
      });
    }
    if (status === -1) {
      if (!reason) {
        return res.status(400).json({ message: "Reason is required" });
      }

      foundUser.status = status;
      await foundUser.save();

      if (admin.length > 0) {
        for (const adminUser of admin) {
          await sendMessage(
            adminUser.email,
            `Account Suspended`,
            `The account with email ${foundUser?.email} has been Suspended by admin ${foundAdmin.username} due to ( ${reason} )`,
            "red"
          );
        }
      }

      await sendMessage(
        foundUser.email,
        `Account Suspended`,
        `Your Account has beeen Suspended due to ( ${reason} ), Please contact us at +2348153192058 for more info about this action.`,
        "red"
      );

      return res.status(200).json({
        message: `Account has been SUSPENDED`,
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
  sellCarRequest,
  uploadAvatar,
  updateUserStatus,
};
