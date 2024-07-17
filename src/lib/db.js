const mongoose = require("mongoose");
// Connect to MongoDB
const Connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL_CLUSTER);
    console.log("Database connected successfully");
  } catch (error) {
    console.log(error);
    process.exit(0);
    // throw new Error("Error connecting to database");
  }
};

module.exports = { Connect };
