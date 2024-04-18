const express = require("express");
const router = express.Router();

const carAssController = require("../controllers/carAssController");

router.get("/", carAssController.getAllCarAss);

module.exports = router;
