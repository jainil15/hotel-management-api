const { APIError, InternalServerError } = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");
const broadcastService = require("../services/broadcast.service");

const create = async (req, res, next) => {
	try {
		const { propertyId, guestIds, messages } = req.body;
		const broadcast = await broadcastService.create(
			propertyId,
			guestIds,
			messages,
		);
		return responseHandler(res, { broadcast: broadcast });
	} catch (e) {
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError(e.message));
	}
};

const update = async (req, res, next) => {
	try {
		const { propertyId, broadcastId } = req.params;
		const broadcast = req.body;
		const updatedBroadcast = await broadcastService.update(
			propertyId,
			broadcastId,
			broadcast,
		);
		return responseHandler(res, { broadcast: updatedBroadcast });
	} catch (e) {
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError(e.message));
	}
};

const addMessages = async (req, res, next) => {
	try {
		const { propertyId, broadcastId } = req.params;
		const { messages } = req.body;
		const updatedBroadcast = await broadcastService.addMessages(
			propertyId,
			broadcastId,
			messages,
		);
		return responseHandler(res, { broadcast: updatedBroadcast });
	} catch (e) {
		if (e instanceof APIError) {
			return next(e);
		}
		return next(new InternalServerError(e.message));
	}
};

module.exports = { create, update, addMessages };