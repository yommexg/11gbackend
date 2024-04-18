const express = require("express");
const router = express.Router();

const usedCarController = require("../controllers/usedCarController");

router.get("/", usedCarController.getAllApprovedUsedCars);

module.exports = router;
