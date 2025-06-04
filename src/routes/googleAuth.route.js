const { Router } = require("express");
const {
  getGoogleOAuthUrl,
  handleGoogleCallback,
  getLocations,
  getReviews,
  disconnectGoogle,
} = require("../controllers/googleAuth.controller");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
  checkPermissions,
  checkPropertyAccess,
} = require("../middlewares/propertyaccess.middleware");
const { ROLE } = require("../constants/role.constant");

const router = Router();

// Get Google OAuth URL
router.get(
  "/:propertyId/auth/google",
//   authenticateToken,
//   checkPropertyAccess,
//   checkPermissions([ROLE.ADMIN]),
  getGoogleOAuthUrl
);

// Handle Google OAuth callback
router.get(
  "/auth/google/callback",
  //authenticateToken,
  handleGoogleCallback
);

// Get Google Business locations
router.get(
  "/:propertyId/google/locations",
  // authenticateToken,
  // checkPropertyAccess,
  // checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  getLocations
);

// Get Google Business reviews
router.get(
  "/:propertyId/google/reviews",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN, ROLE.FRONTDESK]),
  getReviews
);

// Disconnect Google account
router.delete(
  "/:propertyId/google",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions([ROLE.ADMIN]),
  disconnectGoogle
);

module.exports = router; 