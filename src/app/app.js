// node_modules imports
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const responseTime = require("response-time");
// Routes imports
const userRoutes = require("../routes/user.route");
const authRoutes = require("../routes/auth.route");
const propertyRoutes = require("../routes/property.route");
const guestRoutes = require("../routes/guest.route");
const messageRoutes = require("../routes/message.route");
const twilioRoutes = require("../routes/twilio.route");
const countryRoutes = require("../routes/country.route");
const guestStatusRoutes = require("../routes/guestStatus.route");
const messageTemplateRoutes = require("../routes/messageTemplate.route");

// Socket imports
const guestSocket = require("../sockets/guest.socket");

// db imports
const { Connect } = require("../lib/db");

// config imports
const { corsOptionsDelegate } = require("../configs/cors.config");
const {
  authenticateTokenSocket,
  authenticateToken,
} = require("../middlewares/jwt.middleware");

// env imports
require("dotenv").config();

// Socket io imports
const { Server } = require("socket.io");
const {
  checkPropertyAccessSocket,
} = require("../middlewares/propertyaccess.middleware");

// Swagger imports
const swaggerUi = require("swagger-ui-express");
const yaml = require("yamljs");

// Sockets import
const messageSocket = require("../sockets/message.socket");

const { errorMiddleware } = require("../middlewares/error.middleware");
const logger = require("../configs/winston.config");

const { NotFoundError } = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");
const { loggerMiddleware } = require("../middlewares/logger.middleware");
const { checkGuestAccess } = require("../middlewares/guestAccess.middleware");

// Setup
const PORT = process.env.PORT || 8000;

// Connect().then();
/**
 * Create express app
 * @returns {import("express").Application} - Express app
 */
const createApp = () => {
  const app = express();
  const specs = yaml.load("./docs/v1/swagger.yaml");
  app.use(responseTime());
  // app.use(helmet());

  // Logging

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
    })
  );

  // Middlewares
  app.use(loggerMiddleware);
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    bodyParser.urlencoded({
      extended: true,
    })
  );
  app.use(cors(corsOptionsDelegate));

  // Routers
  app.use("/user", userRoutes);
  app.use("/auth", authRoutes);
  app.use("/country", countryRoutes);
  app.use("/property", propertyRoutes);
  app.use("*",authenticateToken)
  app.use("/guest", guestRoutes);
  app.use("/message", messageRoutes);
  app.use("/twilio", twilioRoutes);
  app.use("/guestStatus", guestStatusRoutes);
  app.use("/messageTemplate", messageTemplateRoutes);

  // Health Check
  app.get("/health", (req, res, next) => {
    return responseHandler(res, {}, 200, "Server is running");
  });

  // Catch all route
  app.all("*", (req, res, next) => {
    return next(
      new NotFoundError("Route not found.", {
        req: [req.url],
        method: [req.method],
      })
    );
  });

  // Error handling
  app.use(errorMiddleware);

  const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}.`);
  });

  // Sockets
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  // Sockets middlewares
  io.use(authenticateTokenSocket);
  io.use(checkPropertyAccessSocket);

  // Sockets onConnection
  const onConnection = async (socket) => {
    const { propertyId } = socket.handshake.query;
    socket.join(`property:${propertyId}`);
    guestSocket(io, socket);
    messageSocket(io, socket);
  };

  // Sockets connection
  io.on("connection", onConnection);
  app.io = io;
  return app;
};

module.exports = { createApp };
