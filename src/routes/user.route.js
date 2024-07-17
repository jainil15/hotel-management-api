const { Router } = require("express");
const {
  register,
  login,
  logout,
  getUser,
  create,
} = require("../controllers/user.controller");
const { authenticateToken } = require("../middlewares/jwt.middleware");
const {
  checkPropertyAccess,
  checkPermissions,
} = require("../middlewares/propertyaccess.middleware");

const router = Router();

// TODO: Change to auth route
/**
 * @openapi
 * /user/register:
 *  post:
 *    summary: Register a new user
 *    requestBody:
 *       content:
 *         application/json:
 *          schema:
 *            $ref: '#/components/schemas/User'
 *
 *    responses:
 *      '200':
 *        description: User created
 *        content:
 *          application/json:
 *            schema:
 *              properties:
 *                result:
 *                type: object
 *                schema:
 *                  user:
 *                    schema:
 *                      $ref: '#/components/schemas/User'
 *
 */
router.post("/register", register);
router.post("/login", login);
router.post("/logout", authenticateToken, logout);

router.get("/", authenticateToken, getUser);

// User Routes
router.post(
  "/:propertyId",
  authenticateToken,
  checkPropertyAccess,
  checkPermissions("admin"),
  create
);

module.exports = router;
