const { listRegistrations } = require("./registrationService");
const { listBulletinInscriptions } = require("./bulletinInscriptionService");
const { listAllQuizAttempts, getPublicQuizByFormationSlug } = require("./quizService");

/**
 * Statuts d'ORIGINE d'un participant fusionné : comment la demande est arrivée, indépendamment
 * de l'état de l'auto-évaluation (géré séparément via `hasQuiz`/`quizAttempt`).
 * - PROSPECT : une pré-inscription rapide (Inscription) existe, sans bulletin d'inscription
 *   correspondant pour la même formation/le même email. Lead capté, pas encore transformé en
 *   inscription officielle.
 * - COMPLETE : une pré-inscription ET un bulletin d'inscription se rapportent à la même
 *   personne/formation (rapprochés par email) : le lead a été transformé en inscription officielle.
 * - BULLETIN_DIRECT : un bulletin d'inscription existe sans pré-inscription rapide correspondante
 *   (bulletin envoyé/rempli directement, sans étape de qualification préalable). C'est une
 *   inscription tout aussi officielle que COMPLETE, juste arrivée par un autre chemin.
 */
const PARTICIPANT_STATUS = {
  PROSPECT: "Pré-inscription (à qualifier)",
  COMPLETE: "Inscrit (via pré-inscription)",
  BULLETIN_DIRECT: "Inscrit (bulletin direct)",
};

function normalizeMatchKey(formationSlug, email) {
  return `${(formationSlug || "").trim().toLowerCase()}::${(email || "").trim().toLowerCase()}`;
}

function pickLatestQuizAttempt(quizAttempts, bulletinInscriptionId) {
  if (!bulletinInscriptionId) {
    return null;
  }

  const attempts = quizAttempts
    .filter((attempt) => attempt.bulletinInscriptionId === bulletinInscriptionId)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  return attempts[0] || null;
}

function buildParticipantFromRegistration(registration, matchingBulletin, quizAttempts) {
  const latestQuizAttempt = matchingBulletin ? pickLatestQuizAttempt(quizAttempts, matchingBulletin.id) : null;

  return {
    id: `registration-${registration.id}`,
    fullName: registration.contactName,
    email: registration.email,
    company: registration.company,
    phone: registration.phone,
    formationSlug: registration.formationSlug,
    sessionId: registration.sessionId || matchingBulletin?.sessionId || null,
    firstContactAt: registration.createdAt,
    status: matchingBulletin ? PARTICIPANT_STATUS.COMPLETE : PARTICIPANT_STATUS.PROSPECT,
    registrationId: registration.id,
    bulletinInscriptionId: matchingBulletin ? matchingBulletin.id : null,
    message: registration.message || null,
    hasQuiz: Boolean(getPublicQuizByFormationSlug(registration.formationSlug)),
    quizAttempt: latestQuizAttempt
      ? { id: latestQuizAttempt.id, scoreOn20: latestQuizAttempt.scoreOn20, createdAt: latestQuizAttempt.createdAt }
      : null,
  };
}

function primaryLearnerName(bulletin) {
  const learners = Array.isArray(bulletin.learners) ? bulletin.learners : [];
  const firstName = learners[0]?.fullName || bulletin.sponsorFullName || "";
  return learners.length > 1 ? `${firstName} et ${learners.length - 1} autre(s)` : firstName;
}

function buildParticipantFromBulletin(bulletin, quizAttempts) {
  const latestQuizAttempt = pickLatestQuizAttempt(quizAttempts, bulletin.id);

  return {
    id: `bulletin-${bulletin.id}`,
    fullName: primaryLearnerName(bulletin),
    email: bulletin.sponsorEmail,
    company: bulletin.companyName,
    phone: bulletin.sponsorPhone,
    formationSlug: bulletin.formationSlug,
    sessionId: bulletin.sessionId || null,
    firstContactAt: bulletin.createdAt,
    status: PARTICIPANT_STATUS.BULLETIN_DIRECT,
    registrationId: null,
    bulletinInscriptionId: bulletin.id,
    message: null,
    hasQuiz: Boolean(getPublicQuizByFormationSlug(bulletin.formationSlug)),
    quizAttempt: latestQuizAttempt
      ? { id: latestQuizAttempt.id, scoreOn20: latestQuizAttempt.scoreOn20, createdAt: latestQuizAttempt.createdAt }
      : null,
  };
}

/**
 * Fusionne les pré-inscriptions rapides (Inscription) et les bulletins d'inscription détaillés
 * (BulletinInscription) en une seule liste de "participants", un par personne.
 *
 * Rapprochement : formationSlug + email (Inscription.email vs BulletinInscription.sponsorEmail),
 * comparés en minuscule/trim. Un bulletin donné n'est apparié qu'une seule fois, à la pré-inscription
 * la plus ancienne restant disponible pour ce même couple formation/email.
 */
async function listParticipants() {
  const [registrations, bulletins, quizAttempts] = await Promise.all([
    listRegistrations(),
    listBulletinInscriptions(),
    listAllQuizAttempts(),
  ]);

  const bulletinsByMatchKey = new Map();
  for (const bulletin of bulletins) {
    const key = normalizeMatchKey(bulletin.formationSlug, bulletin.sponsorEmail);
    if (!bulletinsByMatchKey.has(key)) {
      bulletinsByMatchKey.set(key, []);
    }
    bulletinsByMatchKey.get(key).push(bulletin);
  }

  const matchedBulletinIds = new Set();
  const participants = [];

  for (const registration of registrations) {
    const key = normalizeMatchKey(registration.formationSlug, registration.email);
    const candidates = bulletinsByMatchKey.get(key) || [];
    const matchingBulletin = candidates.find((bulletin) => !matchedBulletinIds.has(bulletin.id));

    if (matchingBulletin) {
      matchedBulletinIds.add(matchingBulletin.id);
    }

    participants.push(buildParticipantFromRegistration(registration, matchingBulletin || null, quizAttempts));
  }

  for (const bulletin of bulletins) {
    if (matchedBulletinIds.has(bulletin.id)) {
      continue;
    }

    participants.push(buildParticipantFromBulletin(bulletin, quizAttempts));
  }

  return participants.sort((left, right) => new Date(right.firstContactAt).getTime() - new Date(left.firstContactAt).getTime());
}

module.exports = {
  PARTICIPANT_STATUS,
  listParticipants,
};
