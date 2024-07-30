const { default: mongoose } = require("mongoose");
const {
  APIError,
  InternalServerError,
  ValidationError,
  ConflictError,
  NotFoundError,
} = require("../lib/CustomErrors");
const messageTemplateService = require("../services/messageTemplate.service");
const { responseHandler } = require("../middlewares/response.middleware");
const {
  MessageTemplateValidationSchema,
  UpdateMessageTemplateValidationSchema,
  CreateMessageTemplateValidationSchema,
  UpdateManyMessageTemplateValidationSchema,
  CreateCustomMessageTemplateValidationSchema,
} = require("../models/messageTemplates.model");

const create = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId } = req.params;
    const messageTemplate = req.body;

    const messageTemplateResult =
      CreateMessageTemplateValidationSchema.safeParse(messageTemplate);
    if (!messageTemplateResult.success) {
      throw new ValidationError("Validation Error", {
        ...messageTemplateResult.error.flatten().fieldErrors,
      });
    }
    if (messageTemplateResult.data.type === "DEFAULT") {
      throw new ValidationError("Validation Error", {
        type: ["Cannot create a default message template"],
      });
    }
    const existingMessageTemplate =
      await messageTemplateService.getByNameAndPropertyId(
        messageTemplate.name,
        propertyId
      );
    if (existingMessageTemplate) {
      throw new ConflictError(
        "Message template with this name already exists",
        {
          name: ["Message template with this name already exists"],
        }
      );
    }
    const newMessageTemplate = await messageTemplateService.create(
      propertyId,
      messageTemplate,
      session
    );

    await session.commitTransaction();
    session.endSession();
    return responseHandler(
      res,
      newMessageTemplate,
      201,
      "Message Template created successfully"
    );
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const getAll = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const messageTemplates = await messageTemplateService.getAll(propertyId);
    return responseHandler(res, messageTemplates);
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const getById = async (req, res, next) => {
  try {
    const { propertyId, messageTemplateId } = req.params;
    const messageTemplate = await messageTemplateService.getById(
      propertyId,
      messageTemplateId
    );
    return responseHandler(res, messageTemplate);
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
    const { propertyId, messageTemplateId } = req.params;
    const messageTemplate = req.body;

    const messageTemplateResult =
      UpdateMessageTemplateValidationSchema.safeParse(messageTemplate);
    if (!messageTemplateResult.success) {
      throw new ValidationError("Validation Error", {
        ...messageTemplateResult.error.flatten().fieldErrors,
      });
    }

    const updatedMessageTemplate = await messageTemplateService.update(
      propertyId,
      messageTemplateId,
      messageTemplate,
      session
    );

    await session.commitTransaction();
    session.endSession();
    return responseHandler(
      res,
      updatedMessageTemplate,
      200,
      "Message Template updated successfully"
    );
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const remove = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { messageTemplateId } = req.params;

    const removedMessageTemplate = await messageTemplateService.remove(
      messageTemplateId,
      session
    );
    if (!removedMessageTemplate) {
      throw new NotFoundError("Message Template not found", {});
    }

    await session.commitTransaction();
    session.endSession();
    return responseHandler(
      res,
      removedMessageTemplate,
      200,
      "Message Template removed successfully"
    );
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Update all
 * @param {import("express").Request} req - request object
 * @param {import("express").Response} res - response object
 * @param {import("express").NextFunction} next - next function
 * @returns {Promise<void>}
 */
const updateAll = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId } = req.params;
    const messageTemplates = req.body;

    const messageTemplateResult =
      UpdateManyMessageTemplateValidationSchema.safeParse(messageTemplates);
    if (!messageTemplateResult.success) {
      throw new ValidationError(
        "Validation Error",
        messageTemplateResult.error.errors.map((error) => ({
          [`[${error.path.join("][")}]`]: error.message,
        }))
      );
    }
    if (
      messageTemplates.some((message, index) => {
        if (message.propertyId && message.propertyId !== propertyId) {
          throw new ValidationError("Validation Error", {
            [`[${index}][${propertyId}]`]: ["PropertyId does not match"],
          });
        }
        return true;
      })
    ) {
    }

    // const updatedMessageTemplates = await messageTemplateService.updateAll(
    //   propertyId,
    //   messageTemplates,
    //   session
    // );

    let updatedMessageTemplates = [];
    for (let messageTemplate of messageTemplateResult.data) {
      let updatedMessageTemplate;
      if (messageTemplate._id) {
        updatedMessageTemplate = await messageTemplateService.update(
          propertyId,
          messageTemplate._id,
          messageTemplate,
          session
        );
      } else {
        updatedMessageTemplate =
          await messageTemplateService.getByNameAndPropertyId(
            messageTemplate.name,
            propertyId
          );
        const createMessageTemplateResult =
          await CreateCustomMessageTemplateValidationSchema.safeParseAsync(
            messageTemplate
          );
        if (!createMessageTemplateResult.success) {
          throw new ValidationError(
            "Validation Error",
            createMessageTemplateResult.error.flatten().fieldErrors
          );
        }
        if (updatedMessageTemplate) {
          throw new ConflictError(
            "Message template with this name already exists",
            {
              name: ["Message template with this name already exists"],
            }
          );
        }

        updatedMessageTemplate = await messageTemplateService.create(
          propertyId,
          createMessageTemplateResult.data,
          session
        );
      }
      updatedMessageTemplates.push(updatedMessageTemplate);
    }

    await session.commitTransaction();
    session.endSession();
    return responseHandler(
      res,
      updatedMessageTemplates,
      200,
      "Message Templates updated successfully"
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

module.exports = { create, getById, getAll, update, remove, updateAll };
