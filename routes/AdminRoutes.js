const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middlewares/auth");

// Middleware to check if the user is an admin
const adminAuth = (req, res, next) => {
  console.log("Admin Auth Middleware: ", req.user);
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};

// Route to get all users (accessible only by admin)
router.get("/users", auth, adminAuth, async (req, res) => {
    console.log("Admin /users route hit");
  try {
    console.log("Fetching users...");
    const users = await User.find().select("-password"); // Exclude password from the results
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Route to delete a user (accessible only by admin)
router.delete("/users/:id", auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
