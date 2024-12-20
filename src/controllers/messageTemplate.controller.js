const { default: mongoose } = require("mongoose");
const {
  APIError,
  InternalServerError,
  ValidationError,
  ConflictError,
  NotFoundError,
} = require("../lib/CustomErrors");
const messageTemplateService = require("../services/messageTemplate.service");
const guestStatusService = require("../services/guestStatus.service");
const { responseHandler } = require("../middlewares/response.middleware");
const {
  MessageTemplateValidationSchema,
  UpdateMessageTemplateValidationSchema,
  CreateMessageTemplateValidationSchema,
  UpdateManyMessageTemplateValidationSchema,
  CreateCustomMessageTemplateValidationSchema,
} = require("../models/messageTemplates.model");

const {
  guestStatusToTemplateOnUpdate,
  guestStatusToTemplateOnCreate,
} = require("../utils/guestStatustToTemplate");
const {
  UpdateGuestStatusValidationSchema,
} = require("../models/guestStatus.model");
const {
  MESSAGE_TEMPLATE_TYPES,
} = require("../constants/messageTemplate.contant");

/**
 * Create message template
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
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
        propertyId,
      );
    if (existingMessageTemplate) {
      throw new ConflictError(
        "Message template with this name already exists",
        {
          name: ["Message template with this name already exists"],
        },
      );
    }
    const newMessageTemplate = await messageTemplateService.create(
      propertyId,
      messageTemplate,
      session,
    );

    await session.commitTransaction();
    session.endSession();
    return responseHandler(
      res,
      newMessageTemplate,
      201,
      "Message Template created successfully",
    );
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Get all message templates by property id
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
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

/**
 * Get message template by id
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const getById = async (req, res, next) => {
  try {
    const { propertyId, messageTemplateId } = req.params;
    const messageTemplate = await messageTemplateService.getById(
      propertyId,
      messageTemplateId,
    );
    return responseHandler(res, messageTemplate);
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Update message template by id
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
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
      session,
    );

    await session.commitTransaction();
    session.endSession();
    return responseHandler(
      res,
      updatedMessageTemplate,
      200,
      "Message Template updated successfully",
    );
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Remove message template by id
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const remove = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { messageTemplateId } = req.params;

    const removedMessageTemplate = await messageTemplateService.remove(
      messageTemplateId,
      session,
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
      "Message Template removed successfully",
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

/**
 * Update all messate template at once :: bulk update, create, remove
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
        })),
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

    // biome-ignore lint/style/useConst: <explanation>
    let updatedMessageTemplates = [];
    // biome-ignore lint/style/useConst: <explanation>
    for (let messageTemplate of messageTemplateResult.data) {
      let updatedMessageTemplate;
      console.log("messageTemplate", messageTemplate);
      if (messageTemplate.type === MESSAGE_TEMPLATE_TYPES.DEFAULT) {
        const oldMessageTemplate = await messageTemplateService.getById(
          propertyId,
          messageTemplate._id,
        );
        console.log(oldMessageTemplate);
        if (oldMessageTemplate.name === messageTemplate.name) {
          updatedMessageTemplate = await messageTemplateService.update(
            propertyId,
            messageTemplate._id,
            messageTemplate,
            session,
          );
        } else {
          throw new ValidationError("Validation Error", {
            [`[${messageTemplates.map((m) => m._id).indexOf(messageTemplate._id)}]`]:
              ["Cannot update default message template name"],
          });
        }
      } else if (messageTemplate._id) {
        updatedMessageTemplate = await messageTemplateService.update(
          propertyId,
          messageTemplate._id,
          messageTemplate,
          session,
        );
      } else {
        updatedMessageTemplate =
          await messageTemplateService.getByNameAndPropertyId(
            propertyId,
            messageTemplate.name,
          );
        const createMessageTemplateResult =
          await CreateCustomMessageTemplateValidationSchema.safeParseAsync(
            messageTemplate,
          );
        if (!createMessageTemplateResult.success) {
          throw new ValidationError(
            "Validation Error",
            createMessageTemplateResult.error.flatten().fieldErrors,
          );
        }
        if (updatedMessageTemplate) {
          throw new ConflictError(
            "Message template with this name already exists",
            {
              name: ["Message template with this name already exists"],
            },
          );
        }

        updatedMessageTemplate = await messageTemplateService.create(
          propertyId,
          createMessageTemplateResult.data,
          session,
        );
      }
      updatedMessageTemplates.push(updatedMessageTemplate);
    }
    const getAllTemplates = await messageTemplateService.getAll(propertyId);
    for (const template of getAllTemplates) {
      if (!updatedMessageTemplates.some((t) => t._id.equals(template._id))) {
        if (template.type === MESSAGE_TEMPLATE_TYPES.CUSTOM) {
          await messageTemplateService.remove(template._id, session);
        }
      }
    }
    await session.commitTransaction();
    session.endSession();
    return responseHandler(
      res,
      updatedMessageTemplates,
      200,
      "Message Templates updated successfully",
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

const createAllDefaultTemplates = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId } = req.params;

    const defaultTemplates = await messageTemplateService.createDefaults(
      propertyId,
      session,
    );

    await session.commitTransaction();
    session.endSession();
    return responseHandler(
      res,
      defaultTemplates,
      201,
      "Default Message Templates created successfully",
    );
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Get message template by status for create
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const getMessageTemplateByStatusForCreate = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const status = req.body;

    const statusResult = UpdateGuestStatusValidationSchema.safeParse(status);
    if (!statusResult.success) {
      throw new ValidationError("Validation Error", {
        ...statusResult.error.flatten().fieldErrors,
      });
    }

    const messageTemplate = await messageTemplateService.getByNameAndPropertyId(
      propertyId,
      guestStatusToTemplateOnCreate(status),
    );
    return responseHandler(res, { messageTemplate: messageTemplate });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

/**
 * Get message template by status for update
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const getMessageTemplateByStatusForUpdate = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { propertyId, guestId } = req.params;
    const status = req.body;

    const resultStatus = UpdateGuestStatusValidationSchema.safeParse(status);
    if (!resultStatus.success) {
      throw new ValidationError("Validation Error", {
        ...resultStatus.error.flatten().fieldErrors,
      });
    }

    const oldGuestStatus = await guestStatusService.getByGuestId(guestId);
    const newGuestStatus = await guestStatusService.update(
      guestId,
      status,
      session,
    );

    const messageTemplate = await messageTemplateService.getByNameAndPropertyId(
      propertyId,
      guestStatusToTemplateOnUpdate(oldGuestStatus, newGuestStatus),
    );

    await session.abortTransaction();
    session.endSession();
    return responseHandler(res, { messageTemplate: messageTemplate });
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
  getById,
  getAll,
  update,
  remove,
  updateAll,
  createAllDefaultTemplates,
  getMessageTemplateByStatusForCreate,
  getMessageTemplateByStatusForUpdate,
};
