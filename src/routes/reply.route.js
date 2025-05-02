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

module.exports = router