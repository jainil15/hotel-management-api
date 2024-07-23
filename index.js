// node_modules imports
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");

// Routes imports
const userRoutes = require("./src/routes/user.route");
const authRoutes = require("./src/routes/auth.route");
const propertyRoutes = require("./src/routes/property.route");
const guestRoutes = require("./src/routes/guest.route");
const messageRoutes = require("./src/routes/message.route");
const twilioRoutes = require("./src/routes/twilio.route");
const countryRoutes = require("./src/routes/country.route");
const guestStatusRoutes = require("./src/routes/guestStatus.route");

// Socket imports
const guestSocket = require("./src/sockets/guest.socket");

//TODO: Remove this line
const guestService = require("./src/services/guest.service");
// db imports
const { Connect } = require("./src/lib/db");

// config imports
const { corsOptionsDelegate } = require("./src/configs/cors.config");
const {
  authenticateToken,
  authenticateTokenSocket,
} = require("./src/middlewares/jwt.middleware");
const { awsConfig } = require("./src/configs/aws.config");
require("dotenv").config();
const { Server } = require("socket.io");
const {
  checkPropertyAccessSocket,
} = require("./src/middlewares/propertyaccess.middleware");

// Swagger imports
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const swaggerOptions = require("./src/configs/swagger.config");
const yaml = require("yamljs");
// Sockets import
const messageSocket = require("./src/sockets/message.socket");

const { errorMiddleware } = require("./src/middlewares/error.middleware");
const logger = require("./src/configs/winston.config");
const { GUEST_STATUS } = require("./src/constants/guestStatus.contant");

// Setup
const PORT = process.env.PORT || 8000;

Connect().then();

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

app.use((req, res, next) => {
  const initialUrl = req.url;
  logger.info(`${req.method} ${req.url}`);
  res.on("finish", () => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      logger.error(`${res.statusCode} ${initialUrl}`);
    } else if (res.statusCode >= 500) {
      logger.error(`${res.statusCode} ${initialUrl}`);
    } else {
      logger.info(`${res.statusCode} ${initialUrl}`);
    }
  });
  next();
});

// Routers
app.use("/user", userRoutes);
app.use("/auth", authRoutes);
app.use("/property", propertyRoutes);
app.use("/guest", authenticateToken, guestRoutes);
app.use("/message", messageRoutes);
app.use("/twilio", twilioRoutes);
app.use("/country", countryRoutes);
app.use("/guestStatus", guestStatusRoutes);

// Health Check
app.get("/health", (req, res, next) => {
  return res.status(200).json({ message: "Server is running." });
});

// Listener
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
  guestSocket(io, socket);
  messageSocket(io, socket);
};

// Sockets connection
io.on("connection", onConnection);
