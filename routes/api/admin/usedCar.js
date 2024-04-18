const express = require("express");
const router = express.Router();

const usedCarController = require("../../../controllers/usedCarController");
const verifyRoles = require("../../../middleware/verifyRoles");
const ROLES_LIST = require("../../../config/roles_list");

router.post(
  "/:userId/approve/:carId",
  verifyRoles(ROLES_LIST.Admin),
  usedCarController.handleApproveUsedCar
);

router.post(
  "/:userId/decline/:carId",
  verifyRoles(ROLES_LIST.Admin),
  usedCarController.handleDeclineUsedCar
);

router.delete(
  "/:userId/delete/:carId",
  verifyRoles(ROLES_LIST.Admin),
  usedCarController.handleDeleteUsedCar
);

router.get(
  "/:userId",
  verifyRoles(ROLES_LIST.Admin),
  usedCarController.getAllUsedCars
);

module.exports = router;
