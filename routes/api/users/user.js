const express = require("express");
const router = express.Router();

const usersController = require("../../../controllers/usersController");
const verifyRoles = require("../../../middleware/verifyRoles");
const ROLES_LIST = require("../../../config/roles_list");

router.patch(
  "/update/:userId",
  verifyRoles(ROLES_LIST.User),
  usersController.updateUser
);
router.get("/:userId", verifyRoles(ROLES_LIST.User), usersController.getUser);

module.exports = router;
