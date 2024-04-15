const express = require("express");
const router = express.Router();
const forgetController = require("../controllers/forgotPasswordController");

router.post("/", forgetController.handleForgetVerification);
router.post("/verify-otp", forgetController.handleForgetOTPRequest);
router.patch("/reset", forgetController.handleResetPassword);

module.exports = router;
