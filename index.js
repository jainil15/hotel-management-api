/**
////////////////////////////////////////////////////////////////////////
/██████╗/███╗///██╗███████╗██╗//██╗///██╗██╗//██╗/////█████╗/██████╗/██╗
██╔═══██╗████╗//██║██╔════╝██║//╚██╗/██╔╝██║/██╔╝////██╔══██╗██╔══██╗██║
██║///██║██╔██╗/██║█████╗//██║///╚████╔╝/█████╔╝/////███████║██████╔╝██║
██║///██║██║╚██╗██║██╔══╝//██║////╚██╔╝//██╔═██╗/////██╔══██║██╔═══╝/██║
╚██████╔╝██║/╚████║███████╗███████╗██║///██║//██╗////██║//██║██║/////██║
/╚═════╝/╚═╝//╚═══╝╚══════╝╚══════╝╚═╝///╚═╝//╚═╝////╚═╝//╚═╝╚═╝/////╚═╝
 */

const { Connection } = require("mongoose");
const { createApp } = require("./src/app/app");
const logger = require("./src/configs/winston.config");
const { authenticateTokenSocket } = require("./src/middlewares/jwt.middleware");
const {
  checkPropertyAccessSocket,
} = require("./src/middlewares/propertyaccess.middleware");
const { Connect } = require("./src/lib/db");
const { cmdLineLogo2 } = require("./src/constants/app.constant");
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

const app = createApp();

// Listener
if (process.env.NODE_ENV === "production") logger.info(cmdLineLogo2);

