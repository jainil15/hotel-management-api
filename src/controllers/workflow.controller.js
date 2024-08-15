const homeFlowService = require("../services/homeFlow.service");
const addOnsFlowService = require("../services/addOnsFlow.service");
const preArrivalFlowService = require("../services/preArrivalFlow.service");
const {
  APIError,
  InternalServerError,
  ValidationError,
} = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");
const mongoose = require("mongoose");
const { UpdateHomeFlowValidationSchema } = require("../models/homeFlow.model");
const {
  UpdateAddOnsFlowValidationSchema,
} = require("../models/addOnsFlow.model");
const {
  UpdatePreArrivalValidationSchema,
} = require("../models/preArrivalFlow.model");

const createDefaults = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId } = req.params;
    const newHomeFlow = await homeFlowService.create(propertyId, {}, session);
    const newAddOnsFlow = await addOnsFlowService.create(
      propertyId,
      {},
      session,
    );
    const newPreArrivalFlow = await preArrivalFlowService.create(
      propertyId,
      {},
      session,
    );
    await session.commitTransaction();
    session.endSession();
    return responseHandler(
      res,
      {
        homeFlow: newHomeFlow,
        addOnsFlow: newAddOnsFlow,
        preArrivalFlow: newPreArrivalFlow,
      },
      201,
      "Defaults created successfully",
    );
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    if (e.code === 11000) {
      return next(
        new ValidationError("Property already has defaults", {
          propertyId: ["Property already has defaults"],
        }),
      );
    }
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * @deprecated
 */
const removeDefaults = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId } = req.params;
    await homeFlowService.remove(propertyId, session);
    await addOnsFlowService.remove(propertyId, session);
    await preArrivalFlowService.remove(propertyId, session);

    await session.commitTransaction();
    session.endSession();

    return responseHandler(res, null, 204, "Defaults removed successfully");
  } catch (e) {
    await session.abortTransaction();
    session.endSession();

    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const getByPropertyId = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const homeFlow = await homeFlowService.getByPropertyId(propertyId);
    const addOnsFlow = await addOnsFlowService.getByPropertyId(propertyId);
    const preArrivalFlow =
      await preArrivalFlowService.getByPropertyId(propertyId);
    return responseHandler(res, {
      homeFlow,
      addOnsFlow,
      preArrivalFlow,
    });
  } catch (e) {
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
    const { homeFlow, addOnsFlow, preArrivalFlow } = req.body;

    const homeFlowResult = UpdateHomeFlowValidationSchema.safeParse(homeFlow);
    const addOnsFlowResult =
      UpdateAddOnsFlowValidationSchema.safeParse(addOnsFlow);

    const preArrivalFlowResult =
      UpdatePreArrivalValidationSchema.safeParse(preArrivalFlow);

    const updatedHomeFlow = await homeFlowService.update(
      propertyId,
      homeFlow,
      session,
    );
    const updatedAddOnsFlow = await addOnsFlowService.update(
      propertyId,
      addOnsFlow,
      session,
    );
    const updatedPreArrivalFlow = await preArrivalFlowService.update(
      propertyId,
      preArrivalFlow,
      session,
    );

    if (
      !homeFlowResult.success ||
      !addOnsFlowResult.success ||
      !preArrivalFlowResult.success
    ) {
      throw new ValidationError("Validation Error", {
        ...homeFlowResult.error.flatten().fieldErrors,
        ...addOnsFlowResult.error.flatten().fieldErrors,
        ...preArrivalFlowResult.error.flatten().fieldErrors,
      });
    }

    await session.commitTransaction();
    session.endSession();
    return responseHandler(res, {
      homeFlow: updatedHomeFlow,
      addOnsFlow: updatedAddOnsFlow,
      preArrivalFlow: updatedPreArrivalFlow,
    });
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
  createDefaults,
  removeDefaults,
  getByPropertyId,
};
