const {
	UnauthorizedError,
	ForbiddenError,
	APIError,
	InternalServerError,
} = require("../lib/CustomErrors");
const { Guest } = require("../models/guest.model");
const PropertyAccess = require("../models/propertyaccess.model");

/**
 * Check if the user has access to the property
 * @param {import("express").Request} req - Request object
 * @param {import("express").Response} res - Response object
 * @param {import("express").NextFunction} next - Next function
 * @returns {import("express").NextFunction} - Next function
 */
const checkPropertyAccess = async (req, res, next) => {
	try {
		// Check if the user has access to the property
		if (req.user.role === "guest") {
			const propertyAccess = await Guest.findOne({
				_id: req.user._id,
			});
			if (!propertyAccess) {
				throw new ForbiddenError("Property Access Denied", {});
			}
			return next();
		}
		const propertyAccess = await PropertyAccess.findOne({
			userId: req.user._id,
			propertyId: req.params.propertyId,
		});

		if (!propertyAccess) {
			throw new ForbiddenError("Property Access Denied", {});
		}
		next();
	} catch (e) {
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError(e.message));
	}
};

/**
 * Check if the user has the required permissions
 * @param {Array} requiredFeatures - Required permissions
 * @returns {Function} - Middleware function
 */
const checkPermissions = (requiredFeatures) => {
	return (req, res, next) => {
		try {
			const user = req.user;
			if (!user) {
				throw new ForbiddenError("Forbidden", {});
			}
			if (requiredFeatures.includes(user.role)) {
				return next();
			}
			throw new ForbiddenError("Forbidden", {});
		} catch (e) {
			if (e instanceof APIError) {
				return next(e);
			}
			return next(new InternalServerError());
		}
	};
};

/**
 * Check if the user has access to the property
 * @param {import("socket.io").Socket} socket - Socket object
 * @param {Function} next - Next function
 * @returns {Function} next - Next function
 */
const checkPropertyAccessSocket = async (socket, next) => {
	try {
		// Check if the user has access to the property
		const propertyAccess = await PropertyAccess.findOne({
			userId: socket.user._id,
			propertyId: socket.handshake.query.propertyId,
		});

		if (!propertyAccess) {
			return next(new Error("Router Not Accessible"));
		}
		next();
	} catch (e) {
		return next(new Error("Internal server error"));
	}
};

module.exports = {
	checkPropertyAccess,
	checkPermissions,
	checkPropertyAccessSocket,
};
