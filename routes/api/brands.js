const express = require("express");
const router = express.Router();
const multer = require("multer");

const brandsController = require("../../controllers/brandsController");
const ROLES_LIST = require("../../config/roles_list");
const verifyRoles = require("../../middleware/verifyRoles");

const upload = multer({ dest: "brandImgUploads/" });

router.post(
  "/new",
  verifyRoles(ROLES_LIST.Admin),
  upload.single("brandImg"),
  brandsController.createNewBrand
);

router.post(
  "/edit/:brandName",
  verifyRoles(ROLES_LIST.Admin),
  upload.single("brandImg"),
  brandsController.updateBrand
);

router.delete(
  "/delete/:brandName",
  verifyRoles(ROLES_LIST.Admin),
  upload.single("brandImg"),
  brandsController.deleteBrand
);

module.exports = router;
