let prismaSingleton = null;
let loggedMode = false;

function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    if (!loggedMode) {
      console.warn("[prismaClient] DATABASE_URL absente : mode dégradé en mémoire (aucune donnée persistée entre redémarrages).");
      loggedMode = true;
    }
    return null;
  }

  if (prismaSingleton) {
    return prismaSingleton;
  }

  try {
    const { PrismaClient } = require("@prisma/client");
    prismaSingleton = new PrismaClient();
    if (!loggedMode) {
      console.log("[prismaClient] Client Prisma initialisé, connecté à la base de données.");
      loggedMode = true;
    }
    return prismaSingleton;
  } catch (error) {
    console.warn("Prisma client unavailable, falling back to in-memory mode", error.message);
    return null;
  }
}

function isDatabaseConnected() {
  return Boolean(getPrismaClient());
}

module.exports = {
  getPrismaClient,
  isDatabaseConnected,
};
