const express = require("express");
const router = express.Router();

const deleteUserController = require("../../../controllers/deleteUserController");
const verifyRoles = require("../../../middleware/verifyRoles");
const ROLES_LIST = require("../../../config/roles_list");

router.post(
  "/:userId",
  verifyRoles(ROLES_LIST.User),
  deleteUserController.handleDeleteVerification
);

router.post(
  "/:userId/verify-otp",
  verifyRoles(ROLES_LIST.User),
  deleteUserController.handleDeleteOTPRequest
);
router.post(
  "/:userId/message",
  verifyRoles(ROLES_LIST.User),
  deleteUserController.handleDeleteMessage
);

module.exports = router;
