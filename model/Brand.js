const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const brandSchema = new Schema({
  brandName: {
    type: String,
    required: true,
  },

  brandImg: {
    data: Buffer,
    contentType: String,
    filename: String,
  },
});

module.exports = mongoose.model("Brand", brandSchema);
