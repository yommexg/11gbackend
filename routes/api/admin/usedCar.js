const express = require("express");
const router = express.Router();

const usedCarController = require("../../../controllers/usedCarController");
const verifyRoles = require("../../../middleware/verifyRoles");
const ROLES_LIST = require("../../../config/roles_list");

router.patch(
  "/:userId/change-status/:carId",
  verifyRoles(ROLES_LIST.Admin),
  usedCarController.handleChangeUsedCarStatus
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
router.get(
  "/:userId/:usedCarId",
  verifyRoles(ROLES_LIST.Admin),
  usedCarController.getUsedCar
);

module.exports = router;
