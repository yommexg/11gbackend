const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const CarAss = require("../model/CarAss");
const User = require("../model/User");

const { sendMessage } = require("../sendEmail");
const { uploadCarAssImages } = require("../s3service/carAssS3");

const getAllCarAss = async (req, res) => {
  try {
    const items = await CarAss.find();
    if (!items || items.length === 0) {
      return res.status(204).json({ message: "No Car Assesory found" });
    }
    res.json(items);
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
            `Item "${foundCarAss.itemName}" was deleted from the car assesory by admin ${foundUser?.username}`,
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

module.exports = { handleNewCarAss, handleDeleteCarAss, getAllCarAss };
