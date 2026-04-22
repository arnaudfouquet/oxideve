const catalog = require("../../shared/catalog-data.json");
const { getPrismaClient } = require("./prismaClient");

function normalizeFormation(formation) {
  return {
    id: formation.id,
    slug: formation.slug,
    title: formation.title,
    shortTitle: formation.shortTitle,
    category: formation.category,
    duration: formation.duration,
    location: formation.location,
    audience: formation.audience,
    summary: formation.summary,
    description: formation.description,
    benefits: Array.isArray(formation.benefits) ? formation.benefits : [],
    objectives: Array.isArray(formation.objectives) ? formation.objectives : [],
    price: formation.price,
    seoTitle: formation.seoTitle,
    seoDescription: formation.seoDescription,
  };
}

function normalizeSession(session) {
  return {
    id: session.id,
    formationSlug: session.formationSlug,
    city: session.city,
    startDate: formatDate(session.startDate),
    endDate: formatDate(session.endDate),
    seatsLeft: session.seatsLeft,
    mode: session.mode,
  };
}

function formatDate(value) {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  return new Date(value).toISOString().slice(0, 10);
}

async function listFormations() {
  const prisma = getPrismaClient();

  if (!prisma) {
    return catalog.formations.map(normalizeFormation);
  }

  const formations = await prisma.formation.findMany({
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });

  return formations.map(normalizeFormation);
}

async function getFormationBySlug(slug) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const formation = catalog.formations.find((item) => item.slug === slug);
    return formation ? normalizeFormation(formation) : null;
  }

  const formation = await prisma.formation.findUnique({ where: { slug } });
  return formation ? normalizeFormation(formation) : null;
}

async function listSessions() {
  const prisma = getPrismaClient();

  if (!prisma) {
    return catalog.sessions.map(normalizeSession);
  }

  const sessions = await prisma.session.findMany({
    orderBy: [{ startDate: "asc" }, { city: "asc" }],
  });

  return sessions.map(normalizeSession);
}

async function createFormation(payload) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Database connection required to create a formation");
  }

  const formation = await prisma.formation.create({
    data: {
      slug: payload.slug,
      title: payload.title,
      shortTitle: payload.shortTitle,
      category: payload.category,
      duration: payload.duration,
      location: payload.location,
      audience: payload.audience,
      summary: payload.summary,
      description: payload.description,
      benefits: payload.benefits,
      objectives: payload.objectives,
      price: payload.price,
      seoTitle: payload.seoTitle,
      seoDescription: payload.seoDescription,
    },
  });

  return normalizeFormation(formation);
}

async function updateFormation(slug, payload) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Database connection required to update a formation");
  }

  const formation = await prisma.formation.update({
    where: { slug },
    data: {
      title: payload.title,
      shortTitle: payload.shortTitle,
      category: payload.category,
      duration: payload.duration,
      location: payload.location,
      audience: payload.audience,
      summary: payload.summary,
      description: payload.description,
      benefits: payload.benefits,
      objectives: payload.objectives,
      price: payload.price,
      seoTitle: payload.seoTitle,
      seoDescription: payload.seoDescription,
    },
  });

  return normalizeFormation(formation);
}

module.exports = {
  createFormation,
  updateFormation,
  listFormations,
  getFormationBySlug,
  listSessions,
};
