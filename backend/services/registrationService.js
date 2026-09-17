const { randomUUID } = require("crypto");
const { getPrismaClient } = require("./prismaClient");
const { findOrCreateCompanyFromRegistration, listCompanies } = require("./companyService");
const { getBulletinInscriptionById } = require("./bulletinInscriptionService");
const { listQuizAttemptsByBulletinId } = require("./quizService");

const inMemoryRegistrations = [];

/**
 * Statuts possibles, dans l'ordre du cycle de vie normal. Les 3 premiers sont fixés
 * manuellement par la personne qui gère les inscriptions ; les 2 derniers sont posés
 * automatiquement par le système (soumission de bulletin, complétion de quiz).
 */
const REGISTRATION_STATUS = {
  TO_QUALIFY: "Pré-inscription (à qualifier)",
  NOT_INTERESTED: "Non intéressé",
  BULLETIN_SENT: "BI envoyé",
  AWAITING_QUIZ: "En attente auto-éval",
  COMPLETE: "Inscription complétée",
};

const MANUAL_STATUSES = [REGISTRATION_STATUS.TO_QUALIFY, REGISTRATION_STATUS.NOT_INTERESTED, REGISTRATION_STATUS.BULLETIN_SENT];

const REGISTRATION_ORIGIN = {
  SITE_FORM: "Formulaire pré-inscription site",
  DIRECT_CONTACT: "Contact direct (lien BI envoyé)",
};

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
    status: registration.status || REGISTRATION_STATUS.TO_QUALIFY,
    origin: registration.origin || REGISTRATION_ORIGIN.SITE_FORM,
    bulletinInscriptionId: registration.bulletinInscriptionId || null,
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
    status: REGISTRATION_STATUS.TO_QUALIFY,
    origin: REGISTRATION_ORIGIN.SITE_FORM,
    bulletinInscriptionId: null,
    createdAt: now,
    source: "memory",
  };

  inMemoryRegistrations.push(fallbackRegistration);
  return normalizeRegistration(fallbackRegistration);
}

async function listRegistrations() {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      await listCompanies();
    } catch (error) {
      console.error("[registrationService] Échec de la synchronisation des entreprises (non bloquant)", error);
    }

    const registrations = await prisma.inscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return registrations.map(normalizeRegistration);
  }

  return [...inMemoryRegistrations].reverse().map(normalizeRegistration);
}

async function updateRegistrationStatus(id, status) {
  if (!MANUAL_STATUSES.includes(status)) {
    const error = new Error("Ce statut ne peut pas être défini manuellement.");
    error.statusCode = 400;
    error.expose = true;
    throw error;
  }

  const prisma = getPrismaClient();

  if (prisma) {
    const updated = await prisma.inscription.update({
      where: { id },
      data: { status },
    });
    return normalizeRegistration(updated);
  }

  const target = inMemoryRegistrations.find((item) => item.id === id);
  if (!target) return null;
  target.status = status;
  return normalizeRegistration(target);
}

function normalizeRegistrationNote(note) {
  return {
    id: note.id,
    registrationId: note.registrationId,
    authorName: note.authorName,
    text: note.text,
    createdAt:
      typeof note.createdAt === "string" ? note.createdAt : new Date(note.createdAt).toISOString(),
  };
}

const inMemoryRegistrationNotes = [];

async function listRegistrationNotes(registrationId) {
  const prisma = getPrismaClient();

  if (prisma) {
    const notes = await prisma.registrationNote.findMany({
      where: { registrationId },
      orderBy: { createdAt: "desc" },
    });
    return notes.map(normalizeRegistrationNote);
  }

  return inMemoryRegistrationNotes
    .filter((note) => note.registrationId === registrationId)
    .map(normalizeRegistrationNote)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

async function addRegistrationNote(registrationId, { authorName, text }) {
  const prisma = getPrismaClient();

  if (prisma) {
    const registration = await prisma.inscription.findUnique({ where: { id: registrationId } });
    if (!registration) return null;

    const created = await prisma.registrationNote.create({
      data: { registrationId, authorName, text },
    });
    return normalizeRegistrationNote(created);
  }

  const registration = inMemoryRegistrations.find((item) => item.id === registrationId);
  if (!registration) return null;

  const created = {
    id: randomUUID(),
    registrationId,
    authorName,
    text,
    createdAt: new Date().toISOString(),
  };
  inMemoryRegistrationNotes.push(created);
  return normalizeRegistrationNote(created);
}

function normalizeMatchKey(formationSlug, email) {
  return `${(formationSlug || "").trim().toLowerCase()}::${(email || "").trim().toLowerCase()}`;
}

/**
 * Appelée à la soumission d'un bulletin d'inscription. Rattache le bulletin à une
 * pré-inscription existante (même formation + même email) si elle existe, ou crée une
 * ligne Inscription "en coulisses" (origine "Contact direct") sinon — pour que le bulletin
 * direct ait, lui aussi, un statut suivi dans le même système. Fait progresser le statut
 * automatiquement vers "En attente auto-éval" (formation avec quiz) ou "Inscription
 * complétée" (formation sans quiz).
 */
async function linkOrCreateRegistrationForBulletin(bulletin, { hasQuiz }) {
  const nextStatus = hasQuiz ? REGISTRATION_STATUS.AWAITING_QUIZ : REGISTRATION_STATUS.COMPLETE;
  const prisma = getPrismaClient();

  if (prisma) {
    const matchKey = normalizeMatchKey(bulletin.formationSlug, bulletin.sponsorEmail);
    const candidates = await prisma.inscription.findMany({
      where: { formationSlug: bulletin.formationSlug, bulletinInscriptionId: null },
    });
    const matching = candidates.find(
      (candidate) => normalizeMatchKey(candidate.formationSlug, candidate.email) === matchKey
    );

    if (matching) {
      const updated = await prisma.inscription.update({
        where: { id: matching.id },
        data: {
          status: nextStatus,
          bulletinInscriptionId: bulletin.id,
          contactName: bulletin.sponsorFullName,
          company: bulletin.companyName,
          phone: bulletin.sponsorPhone,
        },
      });
      return normalizeRegistration(updated);
    }

    const created = await prisma.inscription.create({
      data: {
        company: bulletin.companyName,
        contactName: bulletin.sponsorFullName,
        email: bulletin.sponsorEmail,
        phone: bulletin.sponsorPhone,
        formationSlug: bulletin.formationSlug,
        sessionId: bulletin.sessionId || null,
        status: nextStatus,
        origin: REGISTRATION_ORIGIN.DIRECT_CONTACT,
        bulletinInscriptionId: bulletin.id,
      },
    });
    return normalizeRegistration(created);
  }

  const matchKey = normalizeMatchKey(bulletin.formationSlug, bulletin.sponsorEmail);
  const matching = inMemoryRegistrations.find(
    (item) => !item.bulletinInscriptionId && normalizeMatchKey(item.formationSlug, item.email) === matchKey
  );

  if (matching) {
    matching.status = nextStatus;
    matching.bulletinInscriptionId = bulletin.id;
    matching.contactName = bulletin.sponsorFullName;
    matching.company = bulletin.companyName;
    matching.phone = bulletin.sponsorPhone;
    return normalizeRegistration(matching);
  }

  const created = {
    id: randomUUID(),
    company: bulletin.companyName,
    contactName: bulletin.sponsorFullName,
    email: bulletin.sponsorEmail,
    phone: bulletin.sponsorPhone,
    formationSlug: bulletin.formationSlug,
    sessionId: bulletin.sessionId || null,
    status: nextStatus,
    origin: REGISTRATION_ORIGIN.DIRECT_CONTACT,
    bulletinInscriptionId: bulletin.id,
    createdAt: new Date().toISOString(),
    source: "memory",
  };
  inMemoryRegistrations.push(created);
  return normalizeRegistration(created);
}

/**
 * Appelée à la complétion d'une auto-évaluation. Un bulletin peut porter plusieurs apprenants
 * (1 à 3), chacun devant faire sa propre auto-évaluation : le statut ne passe à "Inscription
 * complétée" que lorsque TOUS les apprenants du bulletin ont soumis la leur, sinon il reste
 * (ou repasse) à "En attente auto-éval".
 */
async function markRegistrationCompleteForBulletin(bulletinInscriptionId) {
  const bulletin = await getBulletinInscriptionById(bulletinInscriptionId);
  if (!bulletin) return;

  const attempts = await listQuizAttemptsByBulletinId(bulletinInscriptionId);
  const submittedEmails = new Set(attempts.map((attempt) => (attempt.learnerEmail || "").trim().toLowerCase()));
  const learners = Array.isArray(bulletin.learners) ? bulletin.learners : [];
  const allLearnersCompleted =
    learners.length > 0 && learners.every((learner) => submittedEmails.has((learner.email || "").trim().toLowerCase()));

  const nextStatus = allLearnersCompleted ? REGISTRATION_STATUS.COMPLETE : REGISTRATION_STATUS.AWAITING_QUIZ;
  const prisma = getPrismaClient();

  if (prisma) {
    await prisma.inscription.updateMany({
      where: { bulletinInscriptionId, status: { in: [REGISTRATION_STATUS.AWAITING_QUIZ, REGISTRATION_STATUS.COMPLETE] } },
      data: { status: nextStatus },
    });
    return;
  }

  const target = inMemoryRegistrations.find(
    (item) =>
      item.bulletinInscriptionId === bulletinInscriptionId &&
      (item.status === REGISTRATION_STATUS.AWAITING_QUIZ || item.status === REGISTRATION_STATUS.COMPLETE)
  );
  if (target) target.status = nextStatus;
}

module.exports = {
  REGISTRATION_STATUS,
  REGISTRATION_ORIGIN,
  MANUAL_STATUSES,
  createRegistration,
  listRegistrations,
  updateRegistrationStatus,
  listRegistrationNotes,
  addRegistrationNote,
  linkOrCreateRegistrationForBulletin,
  markRegistrationCompleteForBulletin,
};
