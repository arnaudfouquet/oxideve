let prismaSingleton = null;

function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (prismaSingleton) {
    return prismaSingleton;
  }

  try {
    const { PrismaClient } = require("@prisma/client");
    prismaSingleton = new PrismaClient();
    return prismaSingleton;
  } catch (error) {
    console.warn("Prisma client unavailable, falling back to in-memory mode", error.message);
    return null;
  }
}

module.exports = {
  getPrismaClient,
};
