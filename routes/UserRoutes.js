const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const userController = require("../controllers/UserController");
const auth = require("../middlewares/auth");

// Route for the registration
router.post(
  "/register",
  userController.uploadProfilePicture, // Upload profile picture first
  [
    check("firstname", "Firstname is required").not().isEmpty(),
    check("lastname", "Lastname is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be at least 6 characters").isLength({
      min: 6,
    }),
  ],
  userController.register
);

// Route for the login
router.post("/login", userController.login);

// Route to fetch the user data
router.get("/me", auth, userController.getUser);

// Route to update the user data
router.put(
  "/me",
  auth,
  userController.uploadProfilePicture,
  userController.updateUser
);

module.exports = router;
