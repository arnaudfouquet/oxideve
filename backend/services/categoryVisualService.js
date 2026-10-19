const { getPrismaClient } = require("./prismaClient");

/** Repli quand la base n'est pas connectée (mode démo). */
const inMemoryVisuals = [];

const SCOPES = new Set(["category", "subCategory"]);

function normalizeVisual(visual) {
  return {
    scope: visual.scope,
    name: visual.name,
    image: visual.image || "",
    bannerPosition: visual.bannerPosition || "",
    tilePosition: visual.tilePosition || "",
  };
}

async function listCategoryVisuals() {
  const prisma = getPrismaClient();

  if (!prisma) {
    return inMemoryVisuals.map((visual) => normalizeVisual(visual));
  }

  const visuals = await prisma.categoryVisual.findMany({ orderBy: [{ scope: "asc" }, { name: "asc" }] });
  return visuals.map((visual) => normalizeVisual(visual));
}

/**
 * Enregistre le visuel d'une catégorie ou sous-catégorie. Les champs vides
 * remettent la valeur par défaut (celle codée dans le thème).
 */
async function saveCategoryVisual(payload) {
  if (!SCOPES.has(payload.scope)) {
    const error = new Error("Portée inconnue.");
    error.statusCode = 400;
    error.expose = true;
    throw error;
  }

  const data = {
    scope: payload.scope,
    name: payload.name,
    image: payload.image || null,
    bannerPosition: payload.bannerPosition || null,
    tilePosition: payload.tilePosition || null,
  };

  const prisma = getPrismaClient();

  if (!prisma) {
    const index = inMemoryVisuals.findIndex((item) => item.scope === data.scope && item.name === data.name);
    if (index === -1) {
      inMemoryVisuals.push(data);
    } else {
      inMemoryVisuals[index] = data;
    }
    return normalizeVisual(data);
  }

  const visual = await prisma.categoryVisual.upsert({
    where: { scope_name: { scope: data.scope, name: data.name } },
    create: data,
    update: data,
  });

  return normalizeVisual(visual);
}

module.exports = {
  listCategoryVisuals,
  saveCategoryVisual,
};
