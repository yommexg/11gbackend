const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const carAssSchema = new Schema({
  itemName: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
    default: 1,
  },

  discount: {
    type: Number,
    required: true,
    default: 0,
  },

  description: {
    type: String,
    required: true,
  },

  itemImage: [
    {
      type: String,
      required: true,
    },
  ],

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("carAss", carAssSchema);
