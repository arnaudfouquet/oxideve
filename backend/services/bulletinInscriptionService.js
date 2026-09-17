const { randomUUID } = require("crypto");
const { getPrismaClient } = require("./prismaClient");

const inMemoryBulletinInscriptions = [];

function formatDateTime(value) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : new Date(value).toISOString();
}

function normalizeBulletinInscription(bulletin) {
  return {
    id: bulletin.id,
    formationSlug: bulletin.formationSlug,
    sessionId: bulletin.sessionId || null,
    sessionDates: bulletin.sessionDates || null,
    sessionLocation: bulletin.sessionLocation || null,
    source: bulletin.source || null,
    distributorName: bulletin.distributorName || null,
    companyName: bulletin.companyName,
    siret: bulletin.siret || null,
    apeCode: bulletin.apeCode || null,
    companyAddress: bulletin.companyAddress || null,
    sponsorFullName: bulletin.sponsorFullName,
    sponsorRole: bulletin.sponsorRole || null,
    sponsorEmail: bulletin.sponsorEmail,
    sponsorPhone: bulletin.sponsorPhone,
    learners: Array.isArray(bulletin.learners) ? bulletin.learners : [],
    status: bulletin.status || "submitted",
    confirmationEmailSentAt: formatDateTime(bulletin.confirmationEmailSentAt),
    createdAt: formatDateTime(bulletin.createdAt) || new Date().toISOString(),
    updatedAt: formatDateTime(bulletin.updatedAt) || new Date().toISOString(),
  };
}

async function createBulletinInscription(payload) {
  const prisma = getPrismaClient();
  const now = new Date().toISOString();

  if (prisma) {
    const created = await prisma.bulletinInscription.create({
      data: {
        formationSlug: payload.formationSlug,
        sessionId: payload.sessionId || null,
        sessionDates: payload.sessionDates || null,
        sessionLocation: payload.sessionLocation || null,
        source: payload.source || null,
        distributorName: payload.distributorName || null,
        companyName: payload.companyName,
        siret: payload.siret || null,
        apeCode: payload.apeCode || null,
        companyAddress: payload.companyAddress || null,
        sponsorFullName: payload.sponsorFullName,
        sponsorRole: payload.sponsorRole || null,
        sponsorEmail: payload.sponsorEmail,
        sponsorPhone: payload.sponsorPhone,
        learners: payload.learners,
      },
    });

    return normalizeBulletinInscription(created);
  }

  const fallbackBulletin = {
    id: randomUUID(),
    ...payload,
    status: "submitted",
    confirmationEmailSentAt: null,
    createdAt: now,
    updatedAt: now,
  };

  inMemoryBulletinInscriptions.push(fallbackBulletin);
  return normalizeBulletinInscription(fallbackBulletin);
}

async function listBulletinInscriptions() {
  const prisma = getPrismaClient();

  if (prisma) {
    // Un champ Json invalide/NULL en base (bulletins créés avant l'ajout de `learners`)
    // fait planter le parsing automatique de Prisma sur TOUTE la requête. On récupère donc
    // ce champ en texte brut via SQL et on le parse nous-mêmes avec tolérance de panne.
    const bulletins = await prisma.$queryRawUnsafe(
      'SELECT *, CAST(learners AS CHAR) AS learnersRaw FROM BulletinInscription ORDER BY createdAt DESC'
    );

    return bulletins.map((bulletin) => {
      let learners = [];
      try {
        const parsed = bulletin.learnersRaw ? JSON.parse(bulletin.learnersRaw) : [];
        if (Array.isArray(parsed)) learners = parsed;
      } catch {
        learners = [];
      }

      return normalizeBulletinInscription({ ...bulletin, learners });
    });
  }

  return [...inMemoryBulletinInscriptions]
    .map(normalizeBulletinInscription)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

async function getBulletinInscriptionById(id) {
  const prisma = getPrismaClient();

  if (prisma) {
    const rows = await prisma.$queryRawUnsafe(
      'SELECT *, CAST(learners AS CHAR) AS learnersRaw FROM BulletinInscription WHERE id = ? LIMIT 1',
      id
    );
    const bulletin = rows[0];
    if (!bulletin) return null;

    let learners = [];
    try {
      const parsed = bulletin.learnersRaw ? JSON.parse(bulletin.learnersRaw) : [];
      if (Array.isArray(parsed)) learners = parsed;
    } catch {
      learners = [];
    }

    return normalizeBulletinInscription({ ...bulletin, learners });
  }

  const bulletin = inMemoryBulletinInscriptions.find((item) => item.id === id);
  return bulletin ? normalizeBulletinInscription(bulletin) : null;
}

async function markConfirmationEmailSent(id) {
  const prisma = getPrismaClient();
  const now = new Date();

  if (prisma) {
    const updated = await prisma.bulletinInscription.update({
      where: { id },
      data: { confirmationEmailSentAt: now },
    });

    return normalizeBulletinInscription(updated);
  }

  const bulletin = inMemoryBulletinInscriptions.find((item) => item.id === id);

  if (bulletin) {
    bulletin.confirmationEmailSentAt = now.toISOString();
  }

  return bulletin ? normalizeBulletinInscription(bulletin) : null;
}

module.exports = {
  createBulletinInscription,
  listBulletinInscriptions,
  getBulletinInscriptionById,
  markConfirmationEmailSent,
};
