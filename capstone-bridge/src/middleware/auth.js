const config = require("../config");

/**
 * Express middleware that validates the Bridge API key.
 * Laravel must send: Authorization: Bearer <BRIDGE_API_KEY>
 */
module.exports = function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = header.slice(7);
  if (token !== config.apiKey) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  next();
};
