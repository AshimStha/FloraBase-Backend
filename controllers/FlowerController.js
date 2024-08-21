const mongoose = require("mongoose");
const axios = require("axios");
const Flower = require("../models/Flower");
const { S3Client } = require("@aws-sdk/client-s3"); // Updated to use AWS SDK v3
const multer = require("multer");
const multerS3 = require("multer-s3");

// Configure AWS SDK for S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure multer to use S3 for storage
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + "-" + file.originalname); // Unique file name
    },
  }),
}).single("image"); // Single image upload

// Upload image to S3 route
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Generate the public HTTP URL for the uploaded file
    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${
      process.env.AWS_REGION
    }.amazonaws.com/${encodeURIComponent(req.file.key)}`;

    // Return the publicly accessible HTTP URL
    res.json({ imageUrl: fileUrl });
  } catch (err) {
    console.error("Error uploading image:", err);
    res.status(500).json({ message: "Failed to upload image" });
  }
};

// Fetch flowers from Trefle API
const getFlowersFromTrefle = async (req, res) => {
  try {
    const { page = 1, q = "" } = req.query; // Expecting 'q' instead of 'search'
    let apiUrl = "https://trefle.io/api/v1/plants";
    const params = {
      token: process.env.TREFLE_API_TOKEN,
      page: page,
      distribution: "Canada",
      category: "flower",
    };

    if (q) {
      apiUrl = "https://trefle.io/api/v1/plants/search";
      params.q = q;
    }

    const response = await axios.get(apiUrl, { params });

    console.log("Trefle API response:", response.data);
    res.json(response.data);
  } catch (err) {
    console.error("Error fetching data from Trefle API:", err);
    res.status(500).json({ message: "Error fetching data from Trefle API" });
  }
};

// To get the flower details from the API
const getFlowerDetailsFromTrefle = async (req, res) => {
  const { id } = req.params;
  try {
    const response = await axios.get(
      `https://trefle.io/api/v1/plants/${id}?token=${process.env.TREFLE_API_TOKEN}`
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all flowers from MongoDB
const getFlowers = async (req, res) => {
  try {
    const flowers = await Flower.find();
    res.json(flowers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new flower
const createFlower = async (req, res) => {
  const {
    common_name,
    scientific_name,
    family,
    genus,
    observations,
    bibliography,
    synonyms,
    varieties,
    vegetable,
    edible,
    image_url,
    location, // Add the location field
  } = req.body;

  const flower = new Flower({
    common_name,
    scientific_name,
    family,
    genus,
    observations,
    bibliography,
    synonyms: Array.isArray(synonyms)
      ? synonyms
      : synonyms.split(",").map((s) => s.trim()),
    varieties: Array.isArray(varieties)
      ? varieties
      : varieties.split(",").map((v) => v.trim()),
    vegetable,
    edible,
    image_url,
    location,
    user: req.user.id, // Associate the flower with the current user
  });

  try {
    const newFlower = await flower.save();
    res.status(201).json(newFlower);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get flowers by user
const getFlowersByUser = async (req, res) => {
  try {
    const flowers = await Flower.find({ user: req.user.id });
    res.json(flowers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single flower (details) from MongoDB by ID
const getFlowerById = async (req, res) => {
  const { id } = req.params;

  // Validate the ID format before querying
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid Flower ID format" });
  }

  try {
    const flower = await Flower.findById(id);
    if (!flower) {
      console.log("Flower not found for ID:", id);
      return res.status(404).json({ message: "Flower not found" });
    }
    res.json(flower);
  } catch (err) {
    console.error("Error retrieving flower details:", err);
    res.status(500).json({ message: "Could not retrieve flower details" });
  }
};

// Update a flower
const updateFlower = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the flower by ID
    const flower = await Flower.findById(id);
    if (!flower) {
      return res.status(404).json({ message: "Flower not found" });
    }

    // Update the flower fields if provided in the request body
    const updatedFields = {
      common_name: req.body.common_name || flower.common_name,
      scientific_name: req.body.scientific_name || flower.scientific_name,
      family: req.body.family || flower.family,
      genus: req.body.genus || flower.genus,
      observations: req.body.observations || flower.observations,
      bibliography: req.body.bibliography || flower.bibliography,
      synonyms: Array.isArray(req.body.synonyms)
        ? req.body.synonyms
        : req.body.synonyms
        ? req.body.synonyms.split(",").map((s) => s.trim())
        : flower.synonyms,
      varieties: Array.isArray(req.body.varieties)
        ? req.body.varieties
        : req.body.varieties
        ? req.body.varieties.split(",").map((v) => v.trim())
        : flower.varieties,
      vegetable:
        req.body.vegetable !== undefined
          ? req.body.vegetable
          : flower.vegetable,
      edible: req.body.edible !== undefined ? req.body.edible : flower.edible,
      image_url: req.body.image_url || flower.image_url,
    };

    // Apply the updates
    Object.assign(flower, updatedFields);

    // Save the updated flower
    const updatedFlower = await flower.save();
    res.json(updatedFlower);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a flower
const deleteFlower = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the flower by ID
    const flower = await Flower.findById(id);
    if (!flower) {
      return res.status(404).json({ message: "Flower not found" });
    }

    // Delete the flower
    await flower.deleteOne();
    res.json({ message: "Flower deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getFlowersFromTrefle,
  getFlowerDetailsFromTrefle,
  getFlowers,
  createFlower,
  getFlowersByUser,
  getFlowerById,
  updateFlower,
  deleteFlower,
  uploadImage,
  upload,
};
