const { APIError, BadRequestError } = require("../lib/CustomErrors");

/**
 * Error middleware
 * @param {BadRequestError} err - Error object
 * @param {import("express").Request} req - Request object
 * @param {import("express").Response} res - Response object
 * @param {import("express").NextFunction} next - Next function
 * @returns {import("express").Response} - Response object
 */
const errorMiddleware = async (err, req, res, next) => {
  return res.status(err.statusCode).json({
    status: "error",
    statusCode: err.statusCode || 500,
    error: err.error,
    type: err.statusName || "INTERNAL_SERVER_ERROR",
    message: err.message || "Something went wrong on the server.",
    stack: process.env.NODE_ENV === "development1" ? err.stack : {},
  });
};

module.exports = { errorMiddleware };
