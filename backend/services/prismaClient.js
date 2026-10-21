/**
 * Le client est conservé sur globalThis et non dans une variable du module.
 *
 * Next.js embarque ce fichier dans plusieurs bundles (une copie par route, en
 * plus de celle chargée par Express), et en développement il le réévalue à
 * chaque modification. Avec une variable de module, chaque copie créait son
 * propre PrismaClient et son propre pool de connexions : elles s'accumulaient
 * jusqu'à l'erreur MySQL « Too many connections », qui vidait silencieusement
 * les listes (avis, inscriptions). globalThis est partagé par toutes les
 * copies d'un même processus : il n'y a plus qu'un client.
 */
const store = globalThis;

function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    if (!store.__oxidevePrismaModeLogged) {
      console.warn("[prismaClient] DATABASE_URL absente : mode dégradé en mémoire (aucune donnée persistée entre redémarrages).");
      store.__oxidevePrismaModeLogged = true;
    }
    return null;
  }

  if (store.__oxidevePrisma) {
    return store.__oxidevePrisma;
  }

  try {
    const { PrismaClient } = require("@prisma/client");
    store.__oxidevePrisma = new PrismaClient();
    if (!store.__oxidevePrismaModeLogged) {
      console.log("[prismaClient] Client Prisma initialisé, connecté à la base de données.");
      store.__oxidevePrismaModeLogged = true;
    }
    return store.__oxidevePrisma;
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
