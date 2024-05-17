const express = require("express");
const router = express.Router();

const deleteUserController = require("../../../controllers/deleteUserController");
const verifyRoles = require("../../../middleware/verifyRoles");
const ROLES_LIST = require("../../../config/roles_list");

router.delete(
  "/delete/:userId",
  verifyRoles(ROLES_LIST.Admin),
  deleteUserController.handleDelete
);

module.exports = router;
