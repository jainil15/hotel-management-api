const { ROLE } = require("../constants/role.constant");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const { checkPropertyAccess, checkPermissions } = require("../middlewares/propertyaccess.middleware");
const reviewController = require("../controllers/review.controller");

const router = require("express").Router();
router.get(
    "/:propertyId",
    authenticateToken,
    checkPropertyAccess,
    checkPermissions([ROLE.ADMIN,ROLE.FRONTDESK]),
    reviewController.getAllByPropertyId
);

module.exports = router;