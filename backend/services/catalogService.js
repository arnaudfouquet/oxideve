const catalog = require("../../shared/catalog-data.json");
const { getPrismaClient } = require("./prismaClient");

const inMemoryFormations = catalog.formations.map((formation) => normalizeFormation(formation));
const inMemorySessions = catalog.sessions.map((session) => normalizeSession(session));

function normalizeFormation(formation) {
  return {
    id: formation.id,
    slug: formation.slug,
    title: formation.title,
    shortTitle: formation.shortTitle,
    category: formation.category,
    duration: formation.duration,
    durationDetails: formation.durationDetails || "",
    location: formation.location,
    audience: formation.audience,
    summary: formation.summary,
    description: formation.description,
    benefits: Array.isArray(formation.benefits) ? formation.benefits : [],
    objectives: Array.isArray(formation.objectives) ? formation.objectives : [],
    prerequisites: Array.isArray(formation.prerequisites) ? formation.prerequisites : [],
    modalities: Array.isArray(formation.modalities) ? formation.modalities : [],
    programme: Array.isArray(formation.programme) ? formation.programme : [],
    certification: formation.certification || "",
    price: formation.price,
    priceDetails: formation.priceDetails || "",
    successRate: formation.successRate || "",
    handicapPolicy: formation.handicapPolicy || "",
  };
}

function buildSeoTitle(payload) {
  return `${payload.title} | Oxideve`;
}

function buildSeoDescription(payload) {
  return payload.summary;
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
    return [...inMemoryFormations].sort((left, right) => left.title.localeCompare(right.title, "fr"));
  }

  const formations = await prisma.formation.findMany({
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });

  return formations.map(normalizeFormation);
}

async function getFormationBySlug(slug) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const formation = inMemoryFormations.find((item) => item.slug === slug);
    return formation ? normalizeFormation(formation) : null;
  }

  const formation = await prisma.formation.findUnique({ where: { slug } });
  return formation ? normalizeFormation(formation) : null;
}

async function listSessions() {
  const prisma = getPrismaClient();

  if (!prisma) {
    return [...inMemorySessions].sort((left, right) => left.startDate.localeCompare(right.startDate));
  }

  const sessions = await prisma.session.findMany({
    orderBy: [{ startDate: "asc" }, { city: "asc" }],
  });

  return sessions.map(normalizeSession);
}

async function createFormation(payload) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const formation = normalizeFormation({ id: payload.slug, ...payload });
    inMemoryFormations.push(formation);
    return formation;
  }

  const formation = await prisma.formation.create({
    data: {
      slug: payload.slug,
      title: payload.title,
      shortTitle: payload.shortTitle,
      category: payload.category,
      duration: payload.duration,
      durationDetails: payload.durationDetails,
      location: payload.location,
      audience: payload.audience,
      summary: payload.summary,
      description: payload.description,
      benefits: payload.benefits,
      objectives: payload.objectives,
      prerequisites: payload.prerequisites,
      modalities: payload.modalities,
      programme: payload.programme,
      certification: payload.certification,
      price: payload.price,
      priceDetails: payload.priceDetails,
      successRate: payload.successRate,
      handicapPolicy: payload.handicapPolicy,
      seoTitle: buildSeoTitle(payload),
      seoDescription: buildSeoDescription(payload),
    },
  });

  return normalizeFormation(formation);
}

async function updateFormation(slug, payload) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const index = inMemoryFormations.findIndex((item) => item.slug === slug);

    if (index === -1) {
      throw new Error("Formation not found");
    }

    const formation = normalizeFormation({
      ...inMemoryFormations[index],
      ...payload,
      slug,
    });

    inMemoryFormations[index] = formation;
    return formation;
  }

  const formation = await prisma.formation.update({
    where: { slug },
    data: {
      title: payload.title,
      shortTitle: payload.shortTitle,
      category: payload.category,
      duration: payload.duration,
      durationDetails: payload.durationDetails,
      location: payload.location,
      audience: payload.audience,
      summary: payload.summary,
      description: payload.description,
      benefits: payload.benefits,
      objectives: payload.objectives,
      prerequisites: payload.prerequisites,
      modalities: payload.modalities,
      programme: payload.programme,
      certification: payload.certification,
      price: payload.price,
      priceDetails: payload.priceDetails,
      successRate: payload.successRate,
      handicapPolicy: payload.handicapPolicy,
      seoTitle: buildSeoTitle(payload),
      seoDescription: buildSeoDescription(payload),
    },
  });

  return normalizeFormation(formation);
}

async function createSession(payload) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const session = normalizeSession({ id: payload.id, ...payload });
    inMemorySessions.push(session);
    return session;
  }

  const session = await prisma.session.create({
    data: {
      formationSlug: payload.formationSlug,
      city: payload.city,
      startDate: new Date(payload.startDate),
      endDate: new Date(payload.endDate),
      seatsLeft: payload.seatsLeft,
      mode: payload.mode,
    },
  });

  return normalizeSession(session);
}

async function updateSession(id, payload) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const index = inMemorySessions.findIndex((item) => item.id === id);

    if (index === -1) {
      throw new Error("Session not found");
    }

    const session = normalizeSession({
      ...inMemorySessions[index],
      ...payload,
      id,
    });

    inMemorySessions[index] = session;
    return session;
  }

  const session = await prisma.session.update({
    where: { id },
    data: {
      formationSlug: payload.formationSlug,
      city: payload.city,
      startDate: new Date(payload.startDate),
      endDate: new Date(payload.endDate),
      seatsLeft: payload.seatsLeft,
      mode: payload.mode,
    },
  });

  return normalizeSession(session);
}

async function deleteSession(id) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const index = inMemorySessions.findIndex((item) => item.id === id);

    if (index === -1) {
      throw new Error("Session not found");
    }

    const [session] = inMemorySessions.splice(index, 1);
    return normalizeSession(session);
  }

  const session = await prisma.session.delete({ where: { id } });
  return normalizeSession(session);
}

module.exports = {
  createFormation,
  createSession,
  deleteSession,
  updateFormation,
  updateSession,
  listFormations,
  getFormationBySlug,
  listSessions,
};
