const crypto = require("crypto");
const { readSessionFromRequest } = require("../services/adminSession");
const { countAdminUsers } = require("../services/adminUserService");

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left || "", "utf8");
  const rightBuffer = Buffer.from(right || "", "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function isBootstrapLoginAllowed(req) {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPassword) return false;

  const header = req.headers.authorization;
  if (!header || !header.startsWith("Basic ")) return false;

  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) return false;

  const user = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);
  return safeEqual(user, expectedUser) && safeEqual(password, expectedPassword);
}

function sendUnauthorized(req, res) {
  if (req.baseUrl.startsWith("/api")) {
    return res.status(401).json({ error: "Authentification admin requise." });
  }
  return res.redirect(`/admin/login?next=${encodeURIComponent(req.originalUrl)}`);
}

async function adminAuth(req, res, next) {
  if (req.path === "/login") {
    return next();
  }

  if (process.env.NODE_ENV === "development" && !process.env.DATABASE_URL) {
    return next();
  }

  const session = readSessionFromRequest(req);
  if (session) {
    req.adminUserId = session.adminUserId;
    return next();
  }

  try {
    const existingAccounts = await countAdminUsers();
    if (existingAccounts === 0 && isBootstrapLoginAllowed(req)) {
      return next();
    }
  } catch (error) {
    console.error("[adminAuth] Échec de la vérification des comptes admin", error);
  }

  return sendUnauthorized(req, res);
}

module.exports = {
  adminAuth,
};
