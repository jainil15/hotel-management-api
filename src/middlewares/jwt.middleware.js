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
        return res.status(401).json({ error: { auth: "Unauthorized" } });
      }
      req.user = user;
      next();
    });
  } catch (e) {
    return res.status(500).json({ error: { server: "Internal server error" } });
  }
};

const authenticateTokenSocket = async (socket, next) => {
  try {
    // Get the token from the handshake headers
    const authHeader = socket.handshake.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token == null) {
      return next(new Error("Authorization Missing"));
    }

    // Verify the token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        return next(new Error("Unauthorized"));
      }

      socket.user = user;
      next();
    });
  } catch (e) {
    next(new Error("Internal server error"));
  }
};

module.exports = { authenticateToken, authenticateTokenSocket };
