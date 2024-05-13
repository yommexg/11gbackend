const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const CarAss = require("../model/CarAss");
const User = require("../model/User");

const { sendMessage } = require("../sendEmail");
const { uploadCarAssImages } = require("../s3service/carAssS3");

const getAllCarAss = async (req, res) => {
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
    const carAss = await CarAss.find();
    if (!carAss || carAss.length === 0) {
      return res.status(204).json({ message: "No Assesory found" });
    }
    res.json(carAss);
  } catch (error) {
    console.error("Error fetching Car Assesories:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllApprovedCarAss = async (req, res) => {
  try {
    const carAss = await CarAss.find({ status: 1 });
    if (!carAss || carAss.length === 0) {
      return res.status(204).json({ message: "No Assesory found" });
    }
    res.json(carAss);
  } catch (error) {
    console.error("Error fetching Car Assesories:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getCarAss = async (req, res) => {
  const { itemId } = req.params;

  if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
    return res.status(400).json({ message: "Valid Car Assesory ID required" });
  }

  try {
    const carAss = await CarAss.findOne({ _id: itemId }).exec();

    if (!carAss)
      return res.status(404).json({ message: "Car Assesory Not Found" });

    res.json(carAss);
  } catch (error) {
    console.error("Error fetching Car Assesory:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const handleNewCarAss = async (req, res) => {
  const { itemName, price, discount, description, quantity } = req.body;

  const { userId } = req?.params;
  const files = req?.files;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Valid User ID required" });
  }

  if (!itemName || !price || !description) {
    return res.status(400).json({ message: "Incomplete Item Details" });
  }

  if (!files) {
    return res.status(400).json({ message: "Image is required" });
  }
  const foundUser = await User.findOne({
    _id: userId,
  }).exec();

  const admin = await User.find({
    "roles.Admin": { $exists: true, $ne: null },
  }).exec();

  if (!foundUser) {
    return res.status(401).json({ message: "Access Denied" });
  }

  if (foundUser) {
    try {
      const carAssImages = await uploadCarAssImages(files, itemName);

      await CarAss.create({
        itemName,
        price,
        discount,
        description,
        quantity,
        itemImage: carAssImages,
      });

      const message = `New Car Assesory Uploaded`;

      if (admin.length > 0) {
        for (const adminUser of admin) {
          await sendMessage(
            adminUser.email,
            `${message}`,
            `A ${itemName} was uploaded for sale by admin ${foundUser?.username}.`,
            "green"
          );
        }
      }

      res.status(201).json({
        success: message,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

const handleChangeCarAssStatus = async (req, res) => {
  const { userId, itemId } = req?.params;
  const { itemStatus } = req?.body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Valid User ID required" });
  }

  if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
    return res.status(400).json({ message: "Valid Item ID required" });
  }

  if (itemStatus === undefined || itemStatus === null) {
    return res.status(400).json({ message: "Item Status is required" });
  }

  const foundUser = await User.findOne({
    _id: userId,
  }).exec();

  const foundCarAss = await CarAss.findOne({
    _id: itemId,
  }).exec();

  const admin = await User.find({
    "roles.Admin": { $exists: true, $ne: null },
  }).exec();

  if (!foundUser) {
    return res.status(401).json({ message: "Access Denied" });
  }

  if (!foundCarAss) {
    return res.status(401).json({ message: "Item Not Availiable" });
  }

  if (foundUser) {
    try {
      if (itemStatus === 0) {
        foundCarAss = 0;

        await foundCarAss.save();

        const message = "Item Status Changed to Pending";

        if (admin.length > 0) {
          for (const adminUser of admin) {
            await sendMessage(
              adminUser.email,
              `${message}`,
              `A ${foundCarAss.itemName} with ID (${foundCarAss._id}) status has been changed to Pending by ${foundUser?.username}`,
              "yellow"
            );
          }
        }

        res.status(200).json({
          success: message,
        });
      }
      if (itemStatus === 1) {
        foundCarAss.status = 1;

        await foundCarAss.save();

        const message = "Item Status Changed to Availiable";

        if (admin.length > 0) {
          for (const adminUser of admin) {
            await sendMessage(
              adminUser.email,
              `${message}`,
              `A ${foundCarAss.itemName} with ID (${foundCarAss._id}) status has been changed to Availiable by ${foundUser?.username}`,
              "green"
            );
          }
        }

        res.status(200).json({
          success: message,
        });
      }
      if (itemStatus === -1) {
        foundCarAss.status = -1;

        await foundCarAss.save();

        const message = "Item Status Changed to Sold Out";

        if (admin.length > 0) {
          for (const adminUser of admin) {
            await sendMessage(
              adminUser.email,
              `${message}`,
              `A ${foundCarAss.itemName} with ID (${foundCarAss._id}) status has been changed to Sold Out by ${foundUser?.username}`,
              "red"
            );
          }
        }

        res.status(200).json({
          success: message,
        });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

const handleDeleteCarAss = async (req, res) => {
  const { userId, itemId } = req?.params;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Valid User ID required" });
  }

  if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
    return res.status(400).json({ message: "Valid Item ID required" });
  }

  const foundUser = await User.findOne({
    _id: userId,
  }).exec();

  const foundCarAss = await CarAss.findOne({
    _id: itemId,
  }).exec();

  const admin = await User.find({
    "roles.Admin": { $exists: true, $ne: null },
  }).exec();

  if (!foundUser) {
    return res.status(401).json({ message: "Access Denied" });
  }

  if (!foundCarAss) {
    return res
      .status(401)
      .json({ message: "Car Assesory / Item Not Availiable" });
  }

  if (foundUser) {
    try {
      const message = `Car Assesory Deleted`;

      if (admin.length > 0) {
        for (const adminUser of admin) {
          await sendMessage(
            adminUser.email,
            `${message}`,
            `Item "${foundCarAss.itemName}" with ID (${foundCarAss._id}) was deleted from the car assesory by admin ${foundUser?.username}`,
            "red"
          );
        }
      }

      await CarAss.deleteOne({
        _id: foundCarAss._id,
      });

      res.status(200).json({
        success: message,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = {
  handleNewCarAss,
  handleDeleteCarAss,
  getAllCarAss,
  getAllApprovedCarAss,
  getCarAss,
  handleChangeCarAssStatus,
};
