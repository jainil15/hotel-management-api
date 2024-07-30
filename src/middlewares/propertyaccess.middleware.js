const {
  UnauthorizedError,
  ForbiddenError,
  APIError,
  InternalServerError,
} = require("../lib/CustomErrors");
const PropertyAccess = require("../models/propertyaccess.model");

const checkPropertyAccess = async (req, res, next) => {
  try {
    // Check if the user has access to the property

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
