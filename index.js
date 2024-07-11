const express = require("express");
const mongoose = require("mongoose");
const { Connect } = require("./src/lib/db");
const userRoutes = require("./src/routes/user.route");
const authRoutes = require("./src/routes/auth.route");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const corsOptions = require("./src/configs/corsConfig");

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
// Listener
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
