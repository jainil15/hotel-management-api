const PropertyAccess = require("../models/propertyaccess.model");

const checkPropertyAccess = async (req, res, next) => {
  try {
    // Check if the user has access to the property

    const propertyAccess = await PropertyAccess.findOne({
      userId: req.user._id,
      propertyId: req.params.propertyId,
    });

    if (!propertyAccess) {
      return res.status(400).json({ error: { auth: "Router Not Accessible" } });
    }
    next();
  } catch (e) {
    return res.status(500).json({ error: { server: "Internal server error" } });
  }
};

const checkPermissions = (requiredFeatures) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(403).json({ error: { auth: "Forbidden" } });
      }
      if (requiredFeatures.includes(user.role)) {
        return next();
      }
      return res.status(403).json({ error: { auth: "Forbidden" } });
    } catch (e) {
      return res
        .status(500)
        .json({ error: { server: "Internal server error" } });
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
