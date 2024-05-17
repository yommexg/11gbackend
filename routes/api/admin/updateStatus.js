const express = require("express");
const router = express.Router();
const usersController = require("../../../controllers/usersController");
const verifyRoles = require("../../../middleware/verifyRoles");
const ROLES_LIST = require("../../../config/roles_list");

router.patch(
  "/:userId",
  verifyRoles(ROLES_LIST.Admin),
  usersController.updateUserStatus
);

module.exports = router;
