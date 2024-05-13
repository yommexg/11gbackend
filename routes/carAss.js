const express = require("express");
const router = express.Router();

const carAssController = require("../controllers/carAssController");

router.get("/", carAssController.getAllApprovedCarAss);

module.exports = router;
