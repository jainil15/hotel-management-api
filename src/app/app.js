// node_modules imports
const { instrument } = require("@socket.io/admin-ui");
const path = require("node:path");
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
const chatListRoutes = require("../routes/chatList.route");
const smsRoutes = require("../routes/sms.route");
const checkInOutRequestRoutes = require("../routes/checkInOutRequest.route");
const broadcastRoutes = require("../routes/broadcast.route");
const preArrivalFlowRoutes = require("../routes/preArrivalFlow.route");

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
const swaggerOptions = require("../configs/swagger.config");

const { SwaggerTheme, SwaggerThemeNameEnum } = require("swagger-themes");

const theme = new SwaggerTheme();
// Setup
const PORT = process.env.PORT || 8000;

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
			customCss: theme.getBuffer(SwaggerThemeNameEnum.ONE_DARK),
		}),
	);

	// Middlewares
	app.use(loggerMiddleware);
	app.use(express.json());
	app.use(cookieParser());
	app.use(
		bodyParser.urlencoded({
			extended: true,
		}),
	);
	app.use(cors(corsOptionsDelegate));

	// Routers
	app.use("/user", userRoutes);
	app.use("/auth", authRoutes);
	app.use("/country", countryRoutes);
	app.use("/property", propertyRoutes);
	app.use("/guest", guestRoutes);
	app.use("/message", messageRoutes);
	app.use("/twilio", twilioRoutes);
	app.use("/guestStatus", guestStatusRoutes);
	app.use("/messageTemplate", messageTemplateRoutes);
	app.use("/chatList", chatListRoutes);
	app.use("/sms", smsRoutes);
	app.use("/checkInOutRequest", checkInOutRequestRoutes);
	app.use("/broadcast", broadcastRoutes);
	// app.use("/preArrivalFlow", preArrivalFlowRoutes);

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
			}),
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

	// Admin UI
	instrument(io, {
		auth: {
			type: "basic",
			username: "admin",
			password: "$2b$10$heqvAkYMez.Va6Et2uXInOnkCT6/uQj1brkrbyG3LpopDklcq7ZOS", // "changeit" encrypted with bcrypt
		},
	});

	// Sockets middlewares
	io.use(authenticateTokenSocket);
	io.use(checkPropertyAccessSocket);

	// Sockets onConnection
	const onConnection = async (socket) => {
		const { propertyId } = socket.handshake.query;
		logger.info(`connected to property: ${propertyId}`);
		socket.join(`property:${propertyId}`);
		// useless for now
		guestSocket(io, socket);
		messageSocket(io, socket);
	};

	// Sockets connection
	io.on("connection", onConnection);
	io.on("disconnect", (socket) => {
		logger.info("disconnected from property");
	});
	app.io = io;
	return app;
};

module.exports = { createApp };
