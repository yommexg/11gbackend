const express = require("express");
const router = express.Router();

const newCarController = require("../controllers/newCarController");

router.get("/", newCarController.getAllNewCars);
router.get("/:newCarId", newCarController.getNewCar);

module.exports = router;
