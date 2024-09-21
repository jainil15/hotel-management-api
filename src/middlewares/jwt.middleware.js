const jwt = require("jsonwebtoken");
const {
  UnauthorizedError,
  APIError,
  InternalServerError,
} = require("../lib/CustomErrors");
const { generateNewAccessToken } = require("../controllers/auth.controller");

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

    if (!token) {
      throw new UnauthorizedError("Authorization Missing", {});
    }

    // Verify the token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
      // console.log("Authorization", user);
      if (err) {
        if (err.name === "TokenExpiredError") {
          // Attempt to get a new access token
          try {
            const decoded = jwt.decode(token);
            req.email = decoded.email; // Ensure email is available for token generation
            const newAccessToken = await generateNewAccessToken(req, res, next);

            // Respond with the new access token
            if (newAccessToken) {
              res.setHeader("Authorization", `Bearer ${newAccessToken}`);
              req.user = decoded;
              next();
            } else {
              throw new UnauthorizedError("Unable to refresh access token", {});
            }
          } catch (refreshError) {
            next(refreshError); // Handle errors from token refreshing
          }
        } else {
          throw new UnauthorizedError("Invalid Token", {});
        }
      } else {
        req.user = user;
        next();
      }
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
