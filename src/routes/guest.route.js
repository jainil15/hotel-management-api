const { Router } = require("express");
const {
  create,
  getAll,
  getById,
  update,
  remove,
  getAllGuestsWithStatus,
} = require("../controllers/guest.controller");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
  checkPropertyAccess,
} = require("../middlewares/propertyaccess.middleware");
const guestStatusService = require("../services/guestStatus.service");
const { APIError, InternalServerError } = require("../lib/CustomErrors");
const { responseHandler } = require("../middlewares/response.middleware");
const router = Router();

router.post("/:propertyId", authenticateToken, checkPropertyAccess, create);
router.get(
  "/:propertyId",
  authenticateToken,
  checkPropertyAccess,
  getAllGuestsWithStatus
);
router.get(
  "/:propertyId/guestStatus",

  async (req, res, next) => {
    try {
      const { currentStatus, checkIn, checkOut } = req.query;
      const filters = {
        currentStatus: currentStatus,
        checkIn: checkIn,
        checkOut: checkOut,
      };

      const guests = await guestStatusService.getAllGuestWithStatusv2(
        req.params.propertyId,
        filters
      );
      return responseHandler(res, { guests: guests });
    } catch (e) {
      if (e instanceof APIError) {
        return next(e);
      }
      return next(new InternalServerError(e.message));
    }
  }
);

router.get(
  "/:propertyId/:guestId",
  authenticateToken,
  checkPropertyAccess,
  getById
);
router.put(
  "/:propertyId/:guestId",
  authenticateToken,
  checkPropertyAccess,
  update
);
router.delete(
  "/:propertyId/:guestId",
  authenticateToken,
  checkPropertyAccess,
  remove
);

module.exports = router;
