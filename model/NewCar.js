const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const newCarSchema = new Schema({
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

module.exports = mongoose.model("newCar", newCarSchema);

// const mongoose = require("mongoose");
// const Schema = mongoose.Schema;
// const slugify = require("slugify");

// const productSchema = new Schema({
//   name: {
//     type: String,
//     required: true,
//   },

//   newCar: {
//     type: String,
//     required: true,
//   },

//   category: {
//     type: String,
//     required: true,
//   },

//   details: {
//     type: String,
//     required: true,
//   },

//   slug: {
//     type: String,
//     required: true,
//   },

//   price: {
//     type: String,
//     required: true,
//   },

//   discount: {
//     type: String,
//     required: true,
//   },

//   stock: {
//     type: String,
//     required: true,
//   },

//   size: {
//     type: String,
//     required: true,
//   },

//   productImg: [
//     {
//       data: Buffer,
//       contentType: String,
//       filename: String,
//     },
//   ],
// });

// // Pre-save middleware to generate the slug
// productSchema.pre("save", function (next) {
//   productSlug = this.slug;
//   const productName = this.name;

//   // Generate the slug from the name field
//   const slug = slugify(productName, { lower: true });

//   // Store the generated slug in the slug field
//   productSlug = slug;

//   next();
// });

// module.exports = mongoose.model("Product", productSchema);
