const { randomUUID } = require("crypto");
const { getPrismaClient } = require("./prismaClient");

const inMemoryRegistrations = [];

async function createRegistration(payload) {
  const prisma = getPrismaClient();
  const now = new Date().toISOString();

  if (prisma) {
    const created = await prisma.inscription.create({
      data: {
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

    return created;
  }

  const fallbackRegistration = {
    id: randomUUID(),
    ...payload,
    createdAt: now,
    source: "memory",
  };

  inMemoryRegistrations.push(fallbackRegistration);
  return fallbackRegistration;
}

module.exports = {
  createRegistration,
};
