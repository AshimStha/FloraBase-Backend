// the flower model
const mongoose = require("mongoose");

const FlowerSchema = new mongoose.Schema({
  common_name: {
    type: String,
    required: true,
  },
  scientific_name: {
    type: String,
    required: true,
  },
  family: {
    type: String,
    required: true,
  },
  genus: {
    type: String,
    required: true,
  },
  observations: {
    type: String,
    required: false,
  },
  bibliography: {
    type: String,
    required: false,
  },
  synonyms: {
    // Allow synonyms to be an array of strings
    type: [String],
    required: false,
  },
  varieties: {
    // Allow varieties to be an array of strings
    type: [String],
    required: false,
  },
  vegetable: {
    type: Boolean,
    required: true,
    default: false,
  },
  edible: {
    type: Boolean,
    required: true,
    default: false,
  },
  image_url: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  location: { type: String, required: true },
});

module.exports = mongoose.model("Flower", FlowerSchema);
