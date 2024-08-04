const chatListController = require("../controllers/chatList.controller");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
	checkPropertyAccess,
	checkPermissions,
} = require("../middlewares/propertyaccess.middleware");
const { ROLE } = require("../constants/role.constant");
const { responseHandler } = require("../middlewares/response.middleware");
const { APIError, InternalServerError } = require("../lib/CustomErrors");
const chatListService = require("../services/chatList.service");
const guestService = require("../services/guest.service");
const { default: mongoose } = require("mongoose");
const router = require("express").Router();

router.get(
	"/:propertyId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	chatListController.getAllByPropertyId,
);
router.put(
	"/:propertyId/:guestId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	chatListController.update,
);
router.post(
	"/:propertyId/:guestId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	chatListController.create,
);
router.delete(
	"/:propertyId/:guestId",
	authenticateToken,
	checkPropertyAccess,
	checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
	chatListController.remove,
);

//Temp code to create chat list for all guests
// router.get("/createChatListForAllGuest/:propertyId", async (req, res, next) => {
// 	const session = await mongoose.startSession();
// 	session.startTransaction();
// 	try {
// 		const { propertyId } = req.params;
// 		const guests = await guestService.getAll(propertyId);
// 		for (const guest of guests) {
// 			await chatListService.create(propertyId, guest._id, session);
// 		}
// 		await session.commitTransaction();
// 		session.endSession();
// 		return responseHandler(res, {}, 200, "Chat List Created");
// 	} catch (e) {
// 		await session.abortTransaction();
// 		session.endSession();
// 		if (e instanceof APIError) {
// 			return next(e);
// 		}
// 		return next(new InternalServerError(e.message));
// 	}
// });

module.exports = router;
