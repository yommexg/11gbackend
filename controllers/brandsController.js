const Brand = require("../model/Brand");
const User = require("../model/User");

const fs = require("fs");

const createNewBrand = async (req, res) => {
  const { brandName, userId, contentType } = req.body;

  const brandImg = {
    data: fs.readFileSync("brandImgUploads/" + req?.file?.filename),
    contentType,
    filename: req?.file?.filename,
  };

  try {
    const user = await User.findOne({ _id: userId }).exec();
    if (user) {
      const duplicate = await Brand.findOne({
        brandName,
      }).exec();
      // conflict
      if (duplicate) return res.sendStatus(409);

      await Brand.create({
        brandName,
        brandImg,
      });

      res.status(201).json({ success: `New Brand ${brandName} created` });
    } else {
      return res.status(204).json({ message: `Unauthorized User` });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const getAllBrands = async (req, res) => {
  const brands = await Brand.find();
  if (!brands) return res.status(204).json({ message: "No brands found" });
  res.json(brands);
};

const deleteBrand = async (req, res) => {
  const { brandName } = req.params;

  if (!brandName)
    return res.status(400).json({ message: "Brand Name required" });

  const brand = await Brand.findOne({ brandName });

  if (brand) {
    const result = await brand.deleteOne({ brandName });
    res.json(result);
  } else {
    return res.status(204).json({ message: ` ${brandName} Brand  not found` });
  }
};

const updateBrand = async (req, res) => {
  const { userId, contentType, brandEditName } = req.body;
  const { brandName } = req.params;
  const user = await User.findOne({ _id: userId }).exec();
  if (user) {
    // Find the brand by its ID
    const brand = await Brand.findOne({ brandName });
    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    // Find all other brands except the one with the specified ID
    const otherBrands = await Brand.find({
      brandName: { $ne: brandName },
    }).exec();

    // Check for duplicates among other brands
    const duplicateBrands = otherBrands.filter(
      (otherBrand) => otherBrand.brandName === brandEditName
    );

    if (duplicateBrands.length > 0) return res.sendStatus(409);

    brand.brandName = brandEditName;
    brand.brandImg = {
      data: fs.readFileSync("brandImgUploads/" + req?.file?.filename),
      contentType,
      filename: req?.file?.filename,
    };

    const result = await brand.save();
    res.json(result);
  } else {
    return res
      .status(204)
      .json({ message: `No Brand matches the ID '${brandEditName}'` });
  }
};

module.exports = {
  getAllBrands,
  deleteBrand,
  createNewBrand,
  updateBrand,
};
