const { listRegistrations } = require("./registrationService");
const { listBulletinInscriptions } = require("./bulletinInscriptionService");
const { listAllQuizAttempts, getPublicQuizByFormationSlug } = require("./quizService");

function pickLatestQuizAttempt(quizAttempts, bulletinInscriptionId) {
  if (!bulletinInscriptionId) {
    return null;
  }

  const attempts = quizAttempts
    .filter((attempt) => attempt.bulletinInscriptionId === bulletinInscriptionId)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  return attempts[0] || null;
}

function primaryLearnerName(bulletin) {
  const learners = Array.isArray(bulletin.learners) ? bulletin.learners : [];
  const firstName = learners[0]?.fullName || bulletin.sponsorFullName || "";
  return learners.length > 1 ? `${firstName} et ${learners.length - 1} autre(s)` : firstName;
}

/**
 * Construit la liste "Inscrits" affichée dans l'admin. Chaque `Inscription` porte désormais
 * son propre statut à jour (posé manuellement par la personne qui gère les inscriptions, ou
 * automatiquement par le système à la soumission d'un bulletin / la complétion d'un quiz —
 * voir `registrationService.js`), et un lien direct et fiable vers son bulletin éventuel via
 * `bulletinInscriptionId` (plus de rapprochement par email : chaque bulletin est rattaché à
 * une `Inscription` dès sa soumission, quitte à en créer une "en coulisses" pour un bulletin
 * arrivé sans pré-inscription préalable — origine "Contact direct").
 *
 * `Inscription` est donc la seule source de vérité pour la liste : un `BulletinInscription`
 * orphelin (sans `Inscription` correspondante) ne devrait normalement plus exister, mais on le
 * montre quand même en dernier recours pour ne perdre aucune donnée si ce lien a échoué.
 */
async function listParticipants() {
  const [registrations, bulletins, quizAttempts] = await Promise.all([
    listRegistrations(),
    listBulletinInscriptions(),
    listAllQuizAttempts(),
  ]);

  const bulletinsById = new Map(bulletins.map((bulletin) => [bulletin.id, bulletin]));
  const linkedBulletinIds = new Set();

  const participants = registrations.map((registration) => {
    const bulletin = registration.bulletinInscriptionId ? bulletinsById.get(registration.bulletinInscriptionId) : null;
    if (bulletin) linkedBulletinIds.add(bulletin.id);

    const latestQuizAttempt = bulletin ? pickLatestQuizAttempt(quizAttempts, bulletin.id) : null;

    return {
      id: `registration-${registration.id}`,
      fullName: registration.contactName,
      email: registration.email,
      company: registration.company,
      phone: registration.phone,
      formationSlug: registration.formationSlug,
      sessionId: registration.sessionId || bulletin?.sessionId || null,
      firstContactAt: registration.createdAt,
      status: registration.status,
      origin: registration.origin,
      registrationId: registration.id,
      bulletinInscriptionId: bulletin ? bulletin.id : null,
      message: registration.message || null,
      notes: registration.notes || "",
      hasQuiz: Boolean(bulletin) && Boolean(getPublicQuizByFormationSlug(registration.formationSlug)),
      quizAttempt: latestQuizAttempt
        ? { id: latestQuizAttempt.id, scoreOn20: latestQuizAttempt.scoreOn20, createdAt: latestQuizAttempt.createdAt }
        : null,
    };
  });

  for (const bulletin of bulletins) {
    if (linkedBulletinIds.has(bulletin.id)) continue;

    const latestQuizAttempt = pickLatestQuizAttempt(quizAttempts, bulletin.id);
    participants.push({
      id: `bulletin-${bulletin.id}`,
      fullName: primaryLearnerName(bulletin),
      email: bulletin.sponsorEmail,
      company: bulletin.companyName,
      phone: bulletin.sponsorPhone,
      formationSlug: bulletin.formationSlug,
      sessionId: bulletin.sessionId || null,
      firstContactAt: bulletin.createdAt,
      status: "Inscription complétée",
      origin: "Contact direct (lien BI envoyé)",
      registrationId: null,
      bulletinInscriptionId: bulletin.id,
      message: null,
      notes: "",
      hasQuiz: Boolean(getPublicQuizByFormationSlug(bulletin.formationSlug)),
      quizAttempt: latestQuizAttempt
        ? { id: latestQuizAttempt.id, scoreOn20: latestQuizAttempt.scoreOn20, createdAt: latestQuizAttempt.createdAt }
        : null,
    });
  }

  return participants.sort((left, right) => new Date(right.firstContactAt).getTime() - new Date(left.firstContactAt).getTime());
}

module.exports = {
  listParticipants,
};
