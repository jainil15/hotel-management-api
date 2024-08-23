const { ForbiddenError, UnauthorizedError } = require("../lib/CustomErrors");
const guestSessionService = require("../services/guestSession.service");

/**
 * Check if the user has access to the guest
 * @param {import("express").Request} req - Request object
 * @param {import("express").Response} res - Response object
 * @param {import("express").NextFunction} next - Next function
 * @returns {import("express").NextFunction} - Next function
 */
const checkGuestAccess = async (req, res, next) => {
  if (req.user.role === "guest") {
    if (req.user._id === req.params.guestId) {
      return next();
    }
    return next(new ForbiddenError("Forbidden Guest Access", {}));
  }
  next();
};

const authenticateGuest = async (req, res, next) => {
  const { guestSessionId } = req.params;
  if (!guestSessionId) {
    return next(new UnauthorizedError("Unauthorized", {}));
  }
  const guestSession = await guestSessionService.getById(guestSessionId);
  if (!guestSession) {
    return next(new UnauthorizedError("Unauthorized", {}));
  }
  req.guestSession = guestSession;
};

module.exports = { checkGuestAccess, authenticateGuest };
