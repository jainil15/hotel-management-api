const { Connection } = require("mongoose");
const { createApp } = require("./src/app/app");
const logger = require("./src/configs/winston.config");
const { authenticateTokenSocket } = require("./src/middlewares/jwt.middleware");
const {
  checkPropertyAccessSocket,
} = require("./src/middlewares/propertyaccess.middleware");
const { Connect } = require("./src/lib/db");
const { Server } = require("socket.io");
const guestSocket = require("./src/sockets/guest.socket");
const messageSocket = require("./src/sockets/message.socket");
require("dotenv").config();

// Port
const PORT = process.env.PORT || 8000;
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
