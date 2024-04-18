const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const usedCarSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  carName: {
    type: String,
    required: true,
  },

  carLocation: {
    busStop: String,
    city: String,
    state: String,
    country: String,
  },

  carBrand: {
    type: String,
    required: true,
  },

  year: {
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

  plateNumber: {
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

  carImage: [
    {
      type: String,
      required: true,
    },
  ],

  status: {
    type: Number,
    default: 0,
  },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("usedCar", usedCarSchema);
