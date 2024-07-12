// node_modules imports
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

// Routes imports
const userRoutes = require("./src/routes/user.route");
const authRoutes = require("./src/routes/auth.route");
const propertyRoutes = require("./src/routes/property.route");
const guestRoutes = require("./src/routes/guest.route");
// db imports
const { Connect } = require("./src/lib/db");

// config imports
const corsOptions = require("./src/configs/cors.config");
const { authenticateToken } = require("./src/middlewares/jwt.middleware");

require("dotenv").config();

// Setup
const PORT = process.env.PORT || 8000;
Connect();
const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));
// Routers
app.use("/user", userRoutes);
app.use("/auth", authRoutes);
app.use("/property", propertyRoutes);
app.use("/guest", authenticateToken, guestRoutes);

// Listener
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
