const express = require("express");
const router = express.Router();
const multer = require("multer");

const usedCarController = require("../../../controllers/usedCarController");
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
  "/:userId/create-used-car",
  verifyRoles(ROLES_LIST.User),
  upload.array("Used-Car"),
  usedCarController.handleUsedCar
);

module.exports = router;
