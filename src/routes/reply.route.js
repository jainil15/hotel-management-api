const {ROLE} = require("../constants/role.constant");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const { checkPropertyAccess, checkPermissions } = require("../middlewares/propertyaccess.middleware");
const replyController = require("../controllers/reply.controller");

const router = require("express").Router();

router.post(
    "/:propertyId",
    authenticateToken,
    checkPropertyAccess,
    checkPermissions([ROLE.ADMIN,ROLE.FRONTDESK]),
    replyController.create
);

router.get(
    "/property/:propertyId",
    authenticateToken,
    checkPropertyAccess,
    checkPermissions([ROLE.ADMIN,ROLE.FRONTDESK]),
    replyController.getByPropertyId
);

router.get(
    "/review/:propertyId/:reviewId",
    authenticateToken,
    checkPropertyAccess,
    checkPermissions([ROLE.ADMIN,ROLE.FRONTDESK]),
    replyController.getByReviewId
);

module.exports = router