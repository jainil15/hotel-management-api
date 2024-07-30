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
const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}.`);
});

// Sockets
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//   },
// });

// // Sockets middlewares
// io.use(authenticateTokenSocket);
// io.use(checkPropertyAccessSocket);

// // Sockets onConnection
// const onConnection = async (socket) => {
//   guestSocket(io, socket);
//   messageSocket(io, socket);
// };

// // Sockets connection
// io.on("connection", onConnection);
