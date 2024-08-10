const {
	APIError,
	InternalServerError,
	ValidationError,
} = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");
const {
	UpdatePreArrivalValidationSchema,
} = require("../models/preArrivalFlow.model");
const preArrivalService = require("../services/preArrival.service");

/**
 * Get pre arrival flow by property id
 * @param {import('express').Request} req - request object
 * @param {import('express').Response} res - response object
 * @param {import('express').NextFunction} next - next middleware
 * @returns {import('express').Response} response - response object
 */
const getByPropertyId = async (req, res, next) => {
	const { propertyId } = req.params;
	try {
		const preArrivalFlow = await preArrivalService.getByPropertyId(propertyId);
		return responseHandler(res, { preArrivalFlow });
	} catch (e) {
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError(e.message));
	}
};

/**
 * Update pre arrival flow by property id
 * @param {import('express').Request } req - The request
 * @param {import('express').Response} res - The response
 * @param {import('express').NextFunction} next - The next function
 * @returns {import('express').Response} - The response
 */
const update = async (req, res, next) => {
	const { propertyId } = req.params;
	const preArrivalFlow = req.body;
	try {
		const preArrivalFlowResult =
			UpdatePreArrivalValidationSchema.safeParse(preArrivalFlow);

		if (!preArrivalFlowResult.success) {
			throw new ValidationError(
				"Validation Error",
				preArrivalFlowResult.error.flatten().fieldErrors,
			);
		}

		const updatedPreArrivalFlow = await preArrivalService.update(
			propertyId,
			preArrivalFlow,
		);
		return responseHandler(res, { preArrivalFlow: updatedPreArrivalFlow });
	} catch (e) {
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError(e.message));
	}
};

module.exports = {
	getByPropertyId,
	update,
};
