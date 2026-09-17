const crypto = require("crypto");

const COOKIE_NAME = "oxideve_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "oxideve-dev-secret";
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

function createSessionToken(adminUserId) {
  const payload = `${adminUserId}.${Date.now() + SESSION_TTL_MS}`;
  const signature = sign(payload);
  return Buffer.from(`${payload}.${signature}`, "utf8").toString("base64url");
}

function readSessionToken(token) {
  if (!token) return null;

  let decoded;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const parts = decoded.split(".");
  if (parts.length !== 3) return null;

  const [adminUserId, expiresAtRaw, signature] = parts;
  const payload = `${adminUserId}.${expiresAtRaw}`;
  const expectedSignature = sign(payload);

  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  return { adminUserId };
}

function buildCookieHeader(name, value, options) {
  const segments = [`${name}=${value}`];
  if (options.maxAge !== undefined) segments.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
  segments.push("Path=/");
  segments.push("HttpOnly");
  segments.push("SameSite=Lax");
  if (options.secure) segments.push("Secure");
  return segments.join("; ");
}

function setSessionCookie(res, adminUserId) {
  const token = createSessionToken(adminUserId);
  const header = buildCookieHeader(COOKIE_NAME, token, {
    maxAge: SESSION_TTL_MS,
    secure: process.env.NODE_ENV === "production",
  });
  res.append("Set-Cookie", header);
}

function clearSessionCookie(res) {
  const header = buildCookieHeader(COOKIE_NAME, "", {
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
  res.append("Set-Cookie", header);
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(";").forEach((pair) => {
    const separatorIndex = pair.indexOf("=");
    if (separatorIndex === -1) return;
    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  });

  return cookies;
}

function readSessionFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie);
  return readSessionToken(cookies[COOKIE_NAME]);
}

module.exports = {
  COOKIE_NAME,
  setSessionCookie,
  clearSessionCookie,
  readSessionFromRequest,
};
