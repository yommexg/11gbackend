const express = require("express");
const router = express.Router();

const newCarController = require("../controllers/newCarController");

router.get("/", newCarController.getAllApprovedNewCars);
// router.get("/:newCarId", newCarController.getNewCar);

module.exports = router;
