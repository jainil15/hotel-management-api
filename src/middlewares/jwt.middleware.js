const jwt = require("jsonwebtoken");
// Authenticate Token middleware
const authenticateToken = async (req, res, next) => {
  try {
    // Get the token from the header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    // || req.cookie?.refreshToken == null
    if (token == null) {
      return res.status(401).json({ error: { auth: "Authorization Missing" } });
    }
    // Verify the token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        return res.status(401).json({ error: { auth: "Forbidden" } });
      }
      req.user = user;
      next();
    });
  } catch (e) {
    return res.status(500).json({ error: { server: "Internal server error" } });
  }
};
module.exports = { authenticateToken };
