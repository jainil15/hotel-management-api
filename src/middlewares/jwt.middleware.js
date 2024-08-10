const jwt = require("jsonwebtoken");
const {
	UnauthorizedError,
	APIError,
	InternalServerError,
} = require("../lib/CustomErrors");

/**
 * Authenticate Token middleware
 * @param {import("express").Request} req - Request object
 * @param {import("express").Response} res - Response object
 * @param {import("express").NextFunction} next - Next function
 * @returns {Function} next - Next function
 */
const authenticateToken = async (req, res, next) => {
	try {
		// Get the token from the header
		const authHeader = req.headers.authorization;
		const token = authHeader?.split(" ")[1];
		// || req.cookie?.refreshToken == null

		if (token == null) {
			throw new UnauthorizedError("Authorization Missing", {});
		}
		// Verify the token
		jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
			if (err) {
				throw new UnauthorizedError("Unauthorized", {});
			}
			req.user = user;
			next();
		});
	} catch (e) {
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError());
	}
};

/**
 * Authenticate Token middleware for socket
 * @param {import("socket.io").Socket} socket - Socket object
 * @param {Function} next - Next function
 * @returns {Function} next - Next function
 */
const authenticateTokenSocket = async (socket, next) => {
	try {
		// Get the token from the handshake headers
		const authHeader =
			socket.handshake.auth?.token || socket.handshake.headers?.authorization;

		const token = authHeader?.split(" ")[1];

		if (token == null) {
			return next(new UnauthorizedError("Authorization Token Missing", {}));
		}

		// Verify the token
		jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
			if (err) {
				return next(new UnauthorizedError("Invalid Access Token", {}));
			}

			socket.user = user;
			next();
		});
	} catch (e) {
		next(new InternalServerError("Internal server error"));
	}
};

module.exports = { authenticateToken, authenticateTokenSocket };
