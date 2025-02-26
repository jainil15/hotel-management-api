const { default: mongoose } = require("mongoose");
const { responseHandler } = require("../middlewares/response.middleware");
const {
  CreateFlowSchemaValidation,
  Flow,
  UpdateFlowSchemaValidation,
} = require("../models/flow.model");
const flowService = require("../services/flow.service");
const addOnsFlowService = require("../services/addOnsFlow.service");
const {
  ValidationError,
  InternalServerError,
  APIError,
} = require("../lib/CustomErrors");

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
    return responseHandler(res, { flow: newFlow }, 201, "Flow Created");
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const getCustomFlow = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const customFlow = await flowService.getAllByPropertyId(propertyId);
    return responseHandler(res, {
      customFlow,
    });
  } catch (error) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const update = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId } = req.params;
    const flow = req.body;
    const flowResult = UpdateFlowSchemaValidation.safeParse(flow);
    if (!flowResult.success) {
      throw new ValidationError(
        "Validation Error",
        flowResult.error.flatten().fieldErrors,
      );
    }
    //console.log("DATA",flowResult.data)
    const updatedFlow = await flowService.update(
      flow._id,
      flowResult.data,
      session,
    );
    // console.log("Updated Flow    ",updatedFlow)
    await session.commitTransaction();
    session.endSession();
    return responseHandler(res, { flow: updatedFlow });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = {
  create,
  getCustomFlow,
  update,
};
