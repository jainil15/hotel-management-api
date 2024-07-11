const jwt = require("jsonwebtoken");
// Authenticate Token middleware
const authenticateToken = (req, res, next) => {
  // Get the token from the header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) {
    return res.status(401).json({ error: { auth: "Authorization Missing" } });
  }
  // Verify the token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: { auth: "Forbidden" } });
    }
    req.user = user;
    next();
  });
};
module.exports = { authenticateToken };
