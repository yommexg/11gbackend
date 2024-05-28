const express = require("express");
const router = express.Router();

const carAssController = require("../controllers/carAssController");

router.get("/", carAssController.getAllApprovedCarAss);
router.get("/:itemId", carAssController.getCarAss);

module.exports = router;
