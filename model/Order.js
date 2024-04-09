const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  // productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  // quantity: { type: Number, required: true },
  // size: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);
