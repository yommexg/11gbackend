const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
  },

  email: {
    type: String,
    required: true,
  },

  otp: {
    code: {
      type: String,
    },

    expiresAt: {
      type: Date,
    },
  },

  phoneNumber: {
    type: String,
  },

  deleteMessage: {
    type: String,
  },

  avatar: {
    type: String,
  },

  status: {
    type: Number,
    default: 0,
  },

  roles: {
    User: {
      type: Number,
      default: 2001,
    },
    Admin: Number,
  },

  password: {
    type: String,
  },

  refreshToken: [String],

  createdAt: { type: Date, default: Date.now },

  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    houseNo: String,
  },

  // wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
});

module.exports = mongoose.model("User", userSchema);
