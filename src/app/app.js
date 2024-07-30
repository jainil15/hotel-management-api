// node_modules imports
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");

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
const { authenticateTokenSocket } = require("../middlewares/jwt.middleware");

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

// Setup
const PORT = process.env.PORT || 8000;

// Connect().then();
const createApp = () => {
  const app = express();
  const specs = yaml.load("./api/v1/swagger.yaml");

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
    })
  );

  // Middlewares
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    bodyParser.urlencoded({
      extended: true,
    })
  );
  app.use(cors(corsOptionsDelegate));

  // Logging
  app.use((req, res, next) => {
    const initialUrl = req.url;
    const uuid = req.headers["x-request-id"];
    const time = new Date();
    // logger.info(`[REQUEST] ${req.method} ${req.url} [${uuid}]`);
    res.on("finish", () => {
      const log = `[RESPONSE] ${req.ip} | ${res.statusCode} | ${initialUrl} [${uuid}] ${new Date() - time}ms`;

      if (res.statusCode >= 400 && res.statusCode < 500) {
        logger.warn(log);
      } else if (res.statusCode >= 500) {
        logger.error(log);
      } else {
        logger.info(log);
      }
    });
    next();
  });

  // Routers
  app.use("/user", userRoutes);
  app.use("/auth", authRoutes);
  app.use("/property", propertyRoutes);
  app.use("/guest", guestRoutes);
  app.use("/message", messageRoutes);
  app.use("/twilio", twilioRoutes);
  app.use("/country", countryRoutes);
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
  return app;
};

module.exports = { createApp };
