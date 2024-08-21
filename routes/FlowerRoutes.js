// routes for the flower entity
const express = require("express");
const router = express.Router();
const flowerController = require("../controllers/FlowerController");
const auth = require("../middlewares/auth");

// For the API requests (Trefle API)
router.get("/trefle", flowerController.getFlowersFromTrefle);
router.get("/trefle/:id", flowerController.getFlowerDetailsFromTrefle);

// For MongoDB CRUD operations
router.get("/", auth, flowerController.getFlowers);
router.get("/user", auth, flowerController.getFlowersByUser);
router.post("/", auth, flowerController.createFlower);
router.put("/:id", auth, flowerController.updateFlower);
router.delete("/:id", auth, flowerController.deleteFlower);

// Upload image to S3
router.post(
  "/upload",
  auth,
  flowerController.upload,
  flowerController.uploadImage
);

// Get a single flower from MongoDB by ID
router.get("/:id", auth, flowerController.getFlowerById);

module.exports = router;
