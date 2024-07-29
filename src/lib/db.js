const mongoose = require("mongoose");
const logger = require("../configs/winston.config");
// Connect to MongoDB
const Connect = async (mongoUrl = process.env.MONGO_URL_CLUSTER) => {
  try {
    await mongoose.connect(mongoUrl);
  } catch (error) {
    logger.error(error);
    process.exit(0);
  }
};

module.exports = { Connect };
