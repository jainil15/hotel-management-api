const mongoose = require("mongoose");
const logger = require("../configs/winston.config");
// Connect to MongoDB
const Connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL_CLUSTER);
    logger.info("Database connected successfully");
  } catch (error) {
    logger.error(error);
    process.exit(0);
  }
};

module.exports = { Connect };
