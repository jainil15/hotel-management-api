const { APIError, InternalServerError } = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");
const reviewService = require("../services/review.service");
/**
 * Get all review requests by property id
 * @param {import('express').Request} req - Request
 * @param {import('express').Response} res - Response
 * @param {import('express').NextFunction} next - NextFunction
 * @returns {Promise<import('express').Response>} - Response
 */

const getAllByPropertyId = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const reviews = await reviewService.getByPropertyId(propertyId);
    return responseHandler(res, { reviews }, 200);
  } catch (e) {
    console.log(e);
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = {
    getAllByPropertyId
}
