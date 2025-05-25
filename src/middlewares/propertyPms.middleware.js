const propertyService = require("../services/property.service");
const {
  APIError,
  InternalServerError,
  ForbiddenError,
} = require("../lib/CustomErrors");

/**
 * Check if the user has access to the property
 * @param {import("express").Request} req - Request object
 * @param {import("express").Response} res - Response object
 * @param {import("express").NextFunction} next - Next function
 * @returns {import("express").NextFunction} - Next function
 */
const checkPropertyPms = async (req, res, next) => {
  try {
    const pmsId = req.body[0].ClientInformation.ClientID;
    console.log(pmsId);
    const property = await propertyService.findByPmsId(pmsId);
    console.log(pmsId, property);
    if (!property) {
      throw new ForbiddenError("Property Access Denied", {});
    }
    req.params.propertyId = property._id;
    next();
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = {
  checkPropertyPms,
};
