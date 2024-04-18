const express = require("express");
const router = express.Router();
const multer = require("multer");

const newCarController = require("../../../controllers/newCarController");
const verifyRoles = require("../../../middleware/verifyRoles");
const ROLES_LIST = require("../../../config/roles_list");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file?.mimetype.split("/")[0] === "image") {
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1000000,
    files: 4,
  },
});

router.post(
  "/:userId/create",
  verifyRoles(ROLES_LIST.Admin),
  upload.array("New Car"),
  newCarController.handleNewCar
);

router.delete(
  "/:userId/delete/:carId",
  verifyRoles(ROLES_LIST.Admin),
  newCarController.handleDeleteNewCar
);

module.exports = router;
