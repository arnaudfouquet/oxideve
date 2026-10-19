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

/**
 * Vrai uniquement pour une requête émise depuis la machine locale sur un
 * serveur lancé en mode development. En production NODE_ENV vaut "production",
 * donc ce contournement y est toujours inactif.
 */
function isLocalDevRequest(req) {
  if (process.env.NODE_ENV !== "development") return false;

  const address = req.socket?.remoteAddress || "";
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

/** Premier compte admin, pour que les routes qui tracent l'auteur fonctionnent. */
async function getFirstAdminUserId() {
  try {
    const { listAdminUsers } = require("../services/adminUserService");
    const users = await listAdminUsers();
    return users?.[0]?.id || null;
  } catch (error) {
    return null;
  }
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

  if (isLocalDevRequest(req)) {
    // Confort de développement : la requête vient de la machine locale et le
    // serveur tourne en mode development, on saute l'écran de connexion.
    // Jamais actif en production (NODE_ENV y vaut "production").
    const firstAdmin = await getFirstAdminUserId();
    if (firstAdmin) req.adminUserId = firstAdmin;
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
