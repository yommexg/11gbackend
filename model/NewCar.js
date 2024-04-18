const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const newCarSchema = new Schema({
  carName: {
    type: String,
    required: true,
  },

  carBrand: {
    type: String,
    required: true,
  },

  year: {
    type: String,
    required: true,
  },

  gearType: {
    type: String,
    required: true,
  },

  energyType: {
    type: String,
    required: true,
  },

  gearType: {
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

  engineType: {
    type: String,
    required: true,
  },

  engineNumber: {
    type: String,
    required: true,
  },

  carColor: {
    type: String,
    required: true,
  },

  carImage: [
    {
      type: String,
      required: true,
    },
  ],

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("newCar", newCarSchema);
