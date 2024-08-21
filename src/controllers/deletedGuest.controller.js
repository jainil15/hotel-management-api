const { APIError, InternalServerError } = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");
const deletedGuestService = require("../services/deletedGuest.service");

const getAll = async (req, res, next) => {
  try {
    const propertyId = req.params.propertyId;
    const deletedGuests =
      await deletedGuestService.getDeletedGuestsByPropertyId(propertyId);
    return responseHandler(res, { deletedGuests });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = { getAll };
