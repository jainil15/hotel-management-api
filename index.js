const { createApp } = require("./src/app/app");
const logger = require("./src/configs/winston.config");
const { Connect } = require("./src/lib/db");
require("dotenv").config();

// App
Connect().then(() => {
  logger.info("Database connected successfully");
});
try {
  const app = createApp();
} catch (error) {
  process.exit(1);
}
// Listener
