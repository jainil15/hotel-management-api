const mongoose = require("mongoose");

const {
  APIError,
  InternalServerError,
  NotFoundError,
} = require("../lib/CustomErrors");
const propertyService = require("../services/property.service");
const qrCodeScanService = require("../services/qrCodeScan.service");
const { responseHandler } = require("../middlewares/response.middleware");

const create = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId } = req.params;
    const { roomNumber } = req.body;
    const property = await propertyService.getById(propertyId);
    if (!property.property) {
      throw new NotFoundError("Property not found", {
        propertyId: ["Property not found for the given id"],
      });
    }
    const qrCodeScan = await qrCodeScanService.create(
      propertyId,
      roomNumber,
      session,
    );
    await session.commitTransaction();
    session.endSession();
    return responseHandler(
      res,
      qrCodeScan,
      201,
      "QrCodeScan created successfully",
    );
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = { create };
