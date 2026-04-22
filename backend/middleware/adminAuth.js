const crypto = require("crypto");

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left || "", "utf8");
  const rightBuffer = Buffer.from(right || "", "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function sendChallenge(res) {
  res.set("WWW-Authenticate", 'Basic realm="Oxideve Admin"');
  return res.status(401).send("Authentification admin requise.");
}

function adminAuth(req, res, next) {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (process.env.NODE_ENV === "development" && (!expectedUser || !expectedPassword)) {
    return next();
  }

  if (!expectedUser || !expectedPassword) {
    return res.status(503).send("Acces admin non configure.");
  }

  const header = req.headers.authorization;

  if (!header || !header.startsWith("Basic ")) {
    return sendChallenge(res);
  }

  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const separatorIndex = decoded.indexOf(":");

  if (separatorIndex === -1) {
    return sendChallenge(res);
  }

  const user = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  if (!safeEqual(user, expectedUser) || !safeEqual(password, expectedPassword)) {
    return sendChallenge(res);
  }

  return next();
}

module.exports = {
  adminAuth,
};