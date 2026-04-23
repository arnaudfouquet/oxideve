const { randomUUID } = require("crypto");
const { getPrismaClient } = require("./prismaClient");
const { findOrCreateCompanyFromRegistration } = require("./companyService");

const inMemoryRegistrations = [];

function normalizeRegistration(registration) {
  return {
    id: registration.id,
    companyId: registration.companyId,
    company: registration.company,
    contactName: registration.contactName,
    email: registration.email,
    phone: registration.phone,
    formationSlug: registration.formationSlug,
    sessionId: registration.sessionId,
    message: registration.message,
    createdAt:
      typeof registration.createdAt === "string"
        ? registration.createdAt
        : new Date(registration.createdAt).toISOString(),
    source: registration.source,
  };
}

async function createRegistration(payload) {
  const prisma = getPrismaClient();
  const now = new Date().toISOString();

  if (prisma) {
    const company = await findOrCreateCompanyFromRegistration(payload);
    const created = await prisma.inscription.create({
      data: {
        companyId: company.id,
        company: payload.company,
        contactName: payload.contactName,
        email: payload.email,
        phone: payload.phone,
        formationSlug: payload.formationSlug,
        sessionId: payload.sessionId,
        message: payload.message,
      },
    });

    await prisma.emailLog.create({
      data: {
        inscriptionId: created.id,
        email: payload.email,
        status: "queued",
      },
    });

    return normalizeRegistration(created);
  }

  const fallbackRegistration = {
    id: randomUUID(),
    ...payload,
    createdAt: now,
    source: "memory",
  };

  inMemoryRegistrations.push(fallbackRegistration);
  return normalizeRegistration(fallbackRegistration);
}

async function listRegistrations() {
  const prisma = getPrismaClient();

  if (prisma) {
    const registrations = await prisma.inscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return registrations.map(normalizeRegistration);
  }

  return [...inMemoryRegistrations].reverse().map(normalizeRegistration);
}

module.exports = {
  createRegistration,
  listRegistrations,
};
