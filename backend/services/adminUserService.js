const crypto = require("crypto");
const { randomUUID } = require("crypto");
const { getPrismaClient } = require("./prismaClient");

const SCRYPT_KEYLEN = 64;
const inMemoryAdminUsers = [];

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return `${salt}:${derivedKey.toString("hex")}`;
}

function verifyPassword(password, storedHash) {
  const [salt, key] = (storedHash || "").split(":");
  if (!salt || !key) return false;

  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);

  if (keyBuffer.length !== derivedKey.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

function normalizeAdminUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name || "",
    createdAt: typeof user.createdAt === "string" ? user.createdAt : new Date(user.createdAt).toISOString(),
    lastLoginAt: user.lastLoginAt
      ? typeof user.lastLoginAt === "string"
        ? user.lastLoginAt
        : new Date(user.lastLoginAt).toISOString()
      : null,
  };
}

async function listAdminUsers() {
  const prisma = getPrismaClient();

  if (prisma) {
    const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });
    return users.map(normalizeAdminUser);
  }

  return inMemoryAdminUsers.map(normalizeAdminUser);
}

async function createAdminUser({ email, password, name }) {
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = hashPassword(password);
  const prisma = getPrismaClient();

  if (prisma) {
    const created = await prisma.adminUser.create({
      data: { email: normalizedEmail, passwordHash, name: name || null },
    });
    return normalizeAdminUser(created);
  }

  const created = {
    id: randomUUID(),
    email: normalizedEmail,
    passwordHash,
    name: name || "",
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  };
  inMemoryAdminUsers.push(created);
  return normalizeAdminUser(created);
}

async function deleteAdminUser(id) {
  const prisma = getPrismaClient();

  if (prisma) {
    await prisma.adminUser.delete({ where: { id } });
    return;
  }

  const index = inMemoryAdminUsers.findIndex((user) => user.id === id);
  if (index !== -1) inMemoryAdminUsers.splice(index, 1);
}

async function verifyAdminCredentials(email, password) {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const prisma = getPrismaClient();

  if (prisma) {
    const user = await prisma.adminUser.findUnique({ where: { email: normalizedEmail } });
    if (!user || !verifyPassword(password, user.passwordHash)) return null;

    await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return normalizeAdminUser(user);
  }

  const user = inMemoryAdminUsers.find((item) => item.email === normalizedEmail);
  if (!user || !verifyPassword(password, user.passwordHash)) return null;

  user.lastLoginAt = new Date().toISOString();
  return normalizeAdminUser(user);
}

async function countAdminUsers() {
  const prisma = getPrismaClient();

  if (prisma) {
    return prisma.adminUser.count();
  }

  return inMemoryAdminUsers.length;
}

module.exports = {
  listAdminUsers,
  createAdminUser,
  deleteAdminUser,
  verifyAdminCredentials,
  countAdminUsers,
};
