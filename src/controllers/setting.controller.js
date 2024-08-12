const {
  APIError,
  InternalServerError,
  NotFoundError,
} = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");
const settingService = require("../services/setting.service");

const getByPropertyId = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const setting = await settingService.getByPropertyId(propertyId);
    if (!setting) {
      throw new NotFoundError("Setting not found for the property", {
        propertyId: ["Setting not  found for this propertyId"],
      });
    }
    return responseHandler(res, { setting: setting });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = { getByPropertyId };
