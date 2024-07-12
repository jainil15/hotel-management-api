const PropertyAccess = require("../models/propertyaccess.model");

const checkPropertyAccess = async (req, res, next) => {
  try {
    // Check if the user has access to the property
    // console.log(req.params.propertyId, req.user._id);
    const propertyAccess = await PropertyAccess.findOne({
      userId: req.user._id,
      propertyId: req.params.propertyId,
    });
    console.log(propertyAccess);

    if (!propertyAccess) {
      return res.status(403).json({ error: { auth: "Router Not Accessible" } });
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
module.exports = { checkPropertyAccess, checkPermissions };
