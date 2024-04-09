const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const carAssSchema = new Schema({
  name: {
    type: String,
    required: true,
  },

  img: {
    data: Buffer,
    contentType: String,
    filename: String,
  },
});

module.exports = mongoose.model("carAss", carAssSchema);
