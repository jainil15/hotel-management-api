const userService = require("../services/user.service");
const authService = require("../services/auth.service");
const { generateAccessToken } = require("../utils/generateToken");
const { z } = require("zod");

// Get access token
const getAccessToken = async (req, res) => {
  try {
    // Validate request query
    const validation = z
      .object({
        email: z.string().email(),
      })
      .safeParse(req.query);
    // Validation error
    if (!validation.success) {
      return res
        .status(400)
        .json({ error: validation.error.flatten().fieldErrors });
    }
    // Get session
    const session = await authService.getSession(req.query.email);
    // Get refresh token from cookies
    const refreshToken = req.cookies["refreshToken"];
    // Check if refresh token exists
    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token does not exist" });
    }
    // Check if session exists
    if (!session) {
      return res.status(401).json({ error: "Session does not exist" });
    }
    // Check if session is valid
    if (!session.valid) {
      return res.status(401).json({ error: "Session is not valid" });
    }
    // Decode refresh token
    const decoded = await authService.decodeRefreshToken(refreshToken);
    // Check if email matches
    if (decoded.email !== req.query.email) {
      return res.status(401).json({ error: "Email does not match" });
    }
    // Extract payload
    const { __exp, sessionId, iat, exp, ...rest } = decoded;
    console.log(rest);
    // Generate access token
    const accessToken = generateAccessToken(
      { ...rest },
      "1d",
      process.env.ACCESS_TOKEN_SECRET
    );
    // Send response
    return res.status(200).json({
      result: { 
        accessToken: accessToken,
      },
    });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { server: "Internal server error" + e } });
  }
};

module.exports = { getAccessToken };
