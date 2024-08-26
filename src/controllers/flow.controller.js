const { default: mongoose } = require("mongoose");
const { responseHandler } = require("../middlewares/response.middleware");
const { CreateFlowSchemaValidation } = require("../models/flow.model");
const flowService = require("../services/flow.service");
const { ValidationError, InternalServerError } = require("../lib/CustomErrors");

const create = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId } = req.params;
    const flow = req.body;
    const flowResult = CreateFlowSchemaValidation.safeParse(flow);
    if (!flowResult.success) {
      throw new ValidationError(
        "Validation Error",
        flowResult.error.flatten().fieldErrors,
      );
    }
    const newFlow = await flowService.create(propertyId, flowResult.data);
    await session.commitTransaction();
    session.endSession();
    return responseHandler(res, { flow: newFlow });
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
