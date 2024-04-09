const express = require("express");
const router = express.Router();
const verificationController = require("../controllers/verificationController");

router.post("/", verificationController.handleNewUserVerification);
router.post("/otp", verificationController.handleOTPRequest);

module.exports = router;
