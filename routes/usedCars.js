const express = require("express");
const router = express.Router();

const usedCarController = require("../controllers/usedCarController");

router.get("/", usedCarController.getAllApprovedUsedCars);
router.get("/:usedCarId", usedCarController.getUsedCar);

module.exports = router;
