const { ForbiddenError } = require("../lib/CustomErrors");

const checkGuestAccess = async (req, res, next) => {
  if (req.user.role === "guest") {
    
    if (req.user._id === req.params.guestId) {
      return next();
    }
    return next(new ForbiddenError("Forbidden Guest Access", {}));
  }
  next();
};

module.exports = { checkGuestAccess };
