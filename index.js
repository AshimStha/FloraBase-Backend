// Setting up the express server
const express = require("express");
const app = express();
const bcrypt = require("bcryptjs");

const mongoose = require("mongoose");
require("dotenv").config();

const cors = require("cors");
app.use(cors({
  origin: "http://localhost:3000", // frontend's URL
  credentials: true,
}));

const User = require("./models/User");
require("dotenv").config();

const adminRoutes = require("./routes/AdminRoutes");
app.use("/api/admin", adminRoutes);

const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Admin user creation function
const createAdminUser = async () => {
  try {
    const existingAdmin = await User.findOne({
      email: process.env.ADMIN_EMAIL,
    });
    if (!existingAdmin) {
      // Hash the password before saving the admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(
        process.env.ADMIN_PASSWORD,
        salt
      );

      const admin = new User({
        firstname: "Admin", // Set a default firstname
        lastname: "User", // Set a default lastname
        email: process.env.ADMIN_EMAIL,
        phone: "000-000-0000", // Set a default phone number
        address: "Admin Address", // Set a default address
        dateOfBirth: new Date(), // Set a default date of birth
        nationality: "Admin Nationality", // Set a default nationality
        password: hashedPassword, // Store the hashed password
        isAdmin: true, // Admin flag
      });

      await admin.save();
      console.log("Admin user created");
    } else {
      console.log("Admin user already exists");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
};

// Call the function to create the admin user
createAdminUser();

// Database connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Flower Routes
const flowerRoutes = require("./routes/FlowerRoutes");
app.use("/api/flowers", flowerRoutes);

// User Routes
const userRoutes = require("./routes/UserRoutes");
app.use("/api/users", userRoutes);

// Basic route
app.get("/", (req, res) => {
  res.send("Welcome to FloraBase API");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
