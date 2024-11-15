const { Router } = require("express");
const {
  create,
  getAll,
  getById,
  update,
  remove,
  getAllGuestsWithStatus,
  getGuestById,
  getGuestData, // Newly added
  guestedit, // Newly added
  getCheckInOutPendingGuests, // Newly added
  getGuestAddonsRequests,
} = require("../controllers/guest.controller");

const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
  checkPropertyAccess,
  checkPermissions,
} = require("../middlewares/propertyaccess.middleware");
const { ROLE } = require("../constants/role.constant");
const { checkGuestAccess } = require("../middlewares/guestAccess.middleware");

const router = Router();

// Get guest information by guestId
router.get("/getByGuestId/:guestId", getGuestById);
router.get(
  "/addons/:propertyId",
  authenticateToken,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  getGuestAddonsRequests,
);

// Create a new guest (for admins and front desk roles)
router.post(
  "/:propertyId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  create,
);

// Get all guests with their status (for admins and front desk roles)
router.get(
  "/:propertyId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  getAllGuestsWithStatus,
);
router.get(
  "/:propertyId/pending",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  getCheckInOutPendingGuests,
);

// Get a guest by their ID (for admins, front desk, and guest roles)
router.get(
  "/:propertyId/:guestId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK, ROLE.GUEST]),
  checkGuestAccess,
  getById,
);

// Update guest data by their ID (for admins and front desk roles)
router.put(
  "/:propertyId/:guestId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  update,
);

// Remove a guest by their ID (for admins and front desk roles)
router.delete(
  "/:propertyId/:guestId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  remove,
);

// Add new routes for guest data and editing guest data

// Get combined guest data (guest info, pre-arrival, add-ons, and guest status)
router.get(
  "/getGuestData/:propertyId/:guestId",
  authenticateToken,
  checkPropertyAccess,
  getGuestData,
);

// Edit guest data (fields like name, email, check-in, check-out, etc.)
router.patch(
  "/guestedit/:propertyId/:guestId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  guestedit,
);

module.exports = router;
