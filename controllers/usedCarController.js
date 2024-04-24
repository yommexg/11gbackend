const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const UsedCar = require("../model/UsedCar");
const User = require("../model/User");

const { sendMessage } = require("../sendEmail");
const { uploadUsedCarImages } = require("../s3service/usedCarS3");

const getAllUsedCars = async (req, res) => {
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
    const cars = await UsedCar.find();
    if (!cars || cars.length === 0) {
      return res.status(204).json({ message: "No Car found" });
    }
    res.json(cars);
  } catch (error) {
    console.error("Error fetching New Cars:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllApprovedUsedCars = async (req, res) => {
  try {
    const cars = await UsedCar.find({ status: 1 });
    if (!cars || cars.length === 0) {
      return res.status(204).json({ message: "No Car found" });
    }
    res.json(cars);
  } catch (error) {
    console.error("Error fetching New Cars:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const handleUsedCar = async (req, res) => {
  const {
    carName,
    carBrand,
    year,
    price,
    discount,
    description,
    engineType,
    engineNumber,
    carColor,
    quantity,
    carLocation,
    plateNumber,
    gearType,
    energyType,
  } = req.body;

  const { userId } = req?.params;
  const files = req?.files;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Valid User ID required" });
  }

  if (
    !carName ||
    !carBrand ||
    !year ||
    !price ||
    !description ||
    !engineType ||
    !engineNumber ||
    !carColor ||
    !carLocation ||
    !plateNumber ||
    !gearType ||
    !energyType
  ) {
    return res.status(400).json({ message: "Incomplete Used Car Details" });
  }

  if (!files) {
    return res.status(400).json({ message: "Car Image(s) is/are required" });
  }
  const foundUser = await User.findOne({
    _id: userId,
    status: 2,
  }).exec();

  const admin = await User.find({
    "roles.Admin": { $exists: true, $ne: null },
  }).exec();

  if (!foundUser) {
    return res
      .status(401)
      .json({ message: "Access Denied, You are not a seller" });
  }

  if (foundUser) {
    try {
      const usedCarImages = await uploadUsedCarImages(files, carName, carBrand);

      await UsedCar.create({
        carName,
        carBrand,
        year,
        price,
        discount,
        description,
        engineNumber,
        engineType,
        carColor,
        quantity,
        carImage: usedCarImages,
        carLocation,
        plateNumber,
        gearType,
        energyType,
        user: userId,
      });

      const message = `Car Requested for Selling`;

      if (admin.length > 0) {
        for (const adminUser of admin) {
          await sendMessage(
            adminUser.email,
            `${message}`,
            `A ${carColor} Color ${carName} of Brand ${carBrand} has been requested to be on sale by  user ${foundUser?.username} with email ${foundUser.email} and phone number ${foundUser?.phoneNumber}`,
            "navy"
          );
        }
      }

      await sendMessage(
        foundUser?.email,
        `${message}`,
        `Your request for selling of ${carColor} Color ${carName} of Brand ${carBrand} has been sent to admin. Please We will respond to you within 24hrs `,
        "green"
      );

      res.status(201).json({
        success: message,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

const handleApproveUsedCar = async (req, res) => {
  const { userId, carId } = req?.params;
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Valid User ID required" });
  }

  if (!carId || !mongoose.Types.ObjectId.isValid(carId)) {
    return res.status(400).json({ message: "Valid Car ID required" });
  }

  const foundAdmin = await User.findOne({
    _id: userId,
  }).exec();

  const foundUsedCar = await UsedCar.findOne({
    _id: carId,
  }).exec();

  const foundUser = await User.findOne({
    _id: foundUsedCar.user,
  });

  const admin = await User.find({
    "roles.Admin": { $exists: true, $ne: null },
  }).exec();

  if (!foundAdmin) {
    return res.status(401).json({ message: "Access Denied / Unauthorized" });
  }

  if (!foundUsedCar || foundUsedCar.status !== 0) {
    return res.status(401).json({ message: "Car Not Availiable" });
  }

  if (foundAdmin && foundUsedCar.status === 0) {
    try {
      foundUsedCar.status = 1;

      await foundUsedCar.save();

      const message = `Car Approved Successfully For Sale`;

      if (admin.length > 0) {
        for (const adminUser of admin) {
          await sendMessage(
            adminUser.email,
            `${message}`,
            `A ${foundUsedCar?.carColor} Color ${foundUsedCar?.carName} of Brand ${foundUsedCar?.carBrand} has been made availiable for sale by admin ${foundUser?.username}`,
            "green"
          );
        }

        await sendMessage(
          foundUser?.email,
          `${message}`,
          `Your request for selling of ${foundUsedCar?.carColor} Color ${foundUsedCar?.carName} of Brand ${foundUsedCar?.carBrand} has been Approved`,
          "green"
        );
      }

      res.status(200).json({
        success: message,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

const handleDeclineUsedCar = async (req, res) => {
  const { userId, carId } = req?.params;
  const { reason } = req?.body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Valid User ID required" });
  }

  if (!carId || !mongoose.Types.ObjectId.isValid(carId)) {
    return res.status(400).json({ message: "Valid Car ID required" });
  }

  if (!reason) {
    return res.status(400).json({ message: "Reason for Decline Required" });
  }

  const foundAdmin = await User.findOne({
    _id: userId,
    "roles.Admin": { $exists: true, $ne: null },
  }).exec();

  const foundUsedCar = await UsedCar.findOne({
    _id: carId,
  }).exec();

  const foundUser = await User.findOne({
    _id: foundUsedCar.user,
  });

  const admin = await User.find({
    "roles.Admin": { $exists: true, $ne: null },
  }).exec();

  if (!foundAdmin) {
    return res.status(401).json({ message: "Access Denied / Unauthorized" });
  }

  if (!foundUsedCar || foundUsedCar.status !== 0) {
    return res.status(401).json({ message: "Car Not Availiable" });
  }

  if (foundAdmin && foundUsedCar.status === 0) {
    try {
      foundUsedCar.status = -2;

      await foundUsedCar.save();

      const message = `Car Declined For Sale`;

      if (admin.length > 0) {
        for (const adminUser of admin) {
          await sendMessage(
            adminUser.email,
            `${message}`,
            `A ${foundUsedCar?.carColor} Color ${foundUsedCar?.carName} of Brand ${foundUsedCar?.carBrand} was declined by admin ${foundUser?.username} due to "${reason}"`,
            "red"
          );
        }

        await sendMessage(
          foundUser?.email,
          `${message}`,
          `Your request for selling of ${foundUsedCar?.carColor} Color ${foundUsedCar?.carName} of Brand ${foundUsedCar?.carBrand} has been Declined due to "${reason}"`,
          "red"
        );
      }

      res.status(200).json({
        success: message,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

const handleDeleteUsedCar = async (req, res) => {
  const { userId, carId } = req?.params;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Valid User ID required" });
  }

  if (!carId || !mongoose.Types.ObjectId.isValid(carId)) {
    return res.status(400).json({ message: "Valid Car ID required" });
  }

  const foundUser = await User.findOne({
    _id: userId,
  }).exec();

  const foundUsedCar = await UsedCar.findOne({
    _id: carId,
  }).exec();

  const admin = await User.find({
    "roles.Admin": { $exists: true, $ne: null },
  }).exec();

  if (!foundUser) {
    return res.status(401).json({ message: "Access Denied" });
  }

  if (!foundUsedCar) {
    return res.status(401).json({ message: "Car Not Availiable" });
  }

  if (foundUser) {
    try {
      const message = `Used Car Deleted Successfully`;

      if (admin.length > 0) {
        for (const adminUser of admin) {
          await sendMessage(
            adminUser.email,
            `${message}`,
            `A ${foundUsedCar?.carColor} Color ${foundUsedCar?.carName} of Brand ${foundUsedCar?.carBrand} was deleted by admin ${foundUser?.username}`,
            "red"
          );
        }
      }

      await UsedCar.deleteOne({
        _id: foundUsedCar._id,
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
  handleUsedCar,
  handleApproveUsedCar,
  handleDeclineUsedCar,
  handleDeleteUsedCar,
  getAllUsedCars,
  getAllApprovedUsedCars,
};
