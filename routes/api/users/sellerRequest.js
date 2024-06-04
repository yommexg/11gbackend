const express = require("express");
const router = express.Router();
const multer = require("multer");

const usersController = require("../../../controllers/usersController");
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
    files: 1,
  },
});

router.patch(
  "/:userId",
  verifyRoles(ROLES_LIST.User),
  upload.single("Document"),
  usersController.sellCarRequest
);

module.exports = router;
