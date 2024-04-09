const express = require("express");
const router = express.Router();
const registerController = require("../controllers/registerController");

router.patch("/", registerController.handleNewUser);

module.exports = router;
