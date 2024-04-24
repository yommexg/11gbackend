const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const NewCar = require("../model/NewCar");
const User = require("../model/User");

const { sendMessage } = require("../sendEmail");
const { uploadNewCarImages } = require("../s3service/newCarS3");

const getAllNewCars = async (req, res) => {
  try {
    const cars = await NewCar.find();
    if (!cars || cars.length === 0) {
      return res.status(204).json({ message: "No Car found" });
    }
    res.json(cars);
  } catch (error) {
    console.error("Error fetching New Cars:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getNewCar = async (req, res) => {
  const { newCarId } = req.params;

  if (!newCarId || !mongoose.Types.ObjectId.isValid(newCarId)) {
    return res.status(400).json({ message: "Valid New Car ID required" });
  }

  try {
    const newCar = await NewCar.findOne({ _id: newCarId }).exec();

    if (!newCar) return res.status(404).json({ message: "New Car Not Found" });

    res.json(newCar);
  } catch (error) {
    console.error("Error fetching New Car:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const handleNewCar = async (req, res) => {
  const {
    carName,
    carBrand,
    gearType,
    year,
    price,
    discount,
    description,
    engineType,
    engineNumber,
    carColor,
    quantity,
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
    !gearType ||
    !energyType
  ) {
    return res.status(400).json({ message: "Incomplete Car Details" });
  }

  if (!files || files?.length === 0) {
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
      const newCarImages = await uploadNewCarImages(files, carName, carBrand);

      await NewCar.create({
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
        gearType,
        energyType,
        carImage: newCarImages,
      });

      const message = `New Car Uploaded`;

      if (admin.length > 0) {
        for (const adminUser of admin) {
          await sendMessage(
            adminUser.email,
            `${message}`,
            `A ${carColor} Color ${carName} of Brand ${carBrand} was uploaded by admin ${foundUser?.username}`,
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

const handleChangeNewCarStatus = async (req, res) => {
  const { userId, carId } = req?.params;
  const { carStatus } = req?.body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Valid User ID required" });
  }

  if (!carId || !mongoose.Types.ObjectId.isValid(carId)) {
    return res.status(400).json({ message: "Valid Car ID required" });
  }

  if (carStatus === undefined || carStatus === null) {
    return res.status(400).json({ message: "Car Status is required" });
  }

  const foundUser = await User.findOne({
    _id: userId,
  }).exec();

  const foundNewCar = await NewCar.findOne({
    _id: carId,
  }).exec();

  const admin = await User.find({
    "roles.Admin": { $exists: true, $ne: null },
  }).exec();

  if (!foundUser) {
    return res.status(401).json({ message: "Access Denied" });
  }

  if (!foundNewCar) {
    return res.status(401).json({ message: "Car Not Availiable" });
  }

  if (foundUser) {
    try {
      if (carStatus === 0) {
        foundNewCar.status = 0;

        await foundNewCar.save();

        const message = "Car Status Changed to Pending";

        if (admin.length > 0) {
          for (const adminUser of admin) {
            await sendMessage(
              adminUser.email,
              `${message}`,
              `A ${foundNewCar?.carColor} Color ${foundNewCar?.carName} of Brand ${foundNewCar?.carBrand} status has been changed to Pending by${foundUser?.username}`,
              "yellow"
            );
          }
        }

        res.status(200).json({
          success: message,
        });
      }
      if (carStatus === 1) {
        foundNewCar.status = 1;

        await foundNewCar.save();

        const message = "Car Status Changed to Availiable";

        if (admin.length > 0) {
          for (const adminUser of admin) {
            await sendMessage(
              adminUser.email,
              `${message}`,
              `A ${foundNewCar?.carColor} Color ${foundNewCar?.carName} of Brand ${foundNewCar?.carBrand} status has been changed to Availiable by ${foundUser?.username}`,
              "green"
            );
          }
        }

        res.status(200).json({
          success: message,
        });
      }
      if (carStatus === -1) {
        foundNewCar.status = -1;

        await foundNewCar.save();

        const message = "Car Status Changed to Sold Out";

        if (admin.length > 0) {
          for (const adminUser of admin) {
            await sendMessage(
              adminUser.email,
              `${message}`,
              `A ${foundNewCar?.carColor} Color ${foundNewCar?.carName} of Brand ${foundNewCar?.carBrand} status has been changed to Sold Out by ${foundUser?.username}`,
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

const handleDeleteNewCar = async (req, res) => {
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

  const foundNewCar = await NewCar.findOne({
    _id: carId,
  }).exec();

  const admin = await User.find({
    "roles.Admin": { $exists: true, $ne: null },
  }).exec();

  if (!foundUser) {
    return res.status(401).json({ message: "Access Denied" });
  }

  if (!foundNewCar) {
    return res.status(401).json({ message: "Car Not Availiable" });
  }

  if (foundUser) {
    try {
      const message = `New Car Deleted`;

      if (admin.length > 0) {
        for (const adminUser of admin) {
          await sendMessage(
            adminUser.email,
            `${message}`,
            `A ${foundNewCar?.carColor} Color ${foundNewCar?.carName} of Brand ${foundNewCar?.carBrand} was deleted by admin ${foundUser?.username}`,
            "red"
          );
        }
      }

      await NewCar.deleteOne({
        _id: foundNewCar._id,
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
  handleNewCar,
  handleDeleteNewCar,
  getAllNewCars,
  getNewCar,
  handleChangeNewCarStatus,
};
