const { randomUUID } = require("crypto");
const quizzes = require("../../shared/quiz-data.json");
const { getPrismaClient } = require("./prismaClient");
const { getBulletinInscriptionById } = require("./bulletinInscriptionService");

const inMemoryQuizAttempts = [];

function getQuizBySlug(slug) {
  return quizzes.find((quiz) => quiz.slug === slug);
}

function getQuizByFormationSlug(formationSlug) {
  return quizzes.find((quiz) => quiz.formationSlug === formationSlug);
}

function normalizeLearnerEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeQuizAttempt(attempt) {
  const rawAnswers = attempt.answers || {};

  return {
    id: attempt.id,
    bulletinInscriptionId: attempt.bulletinInscriptionId,
    quizSlug: attempt.quizSlug,
    learnerFullName: attempt.learnerFullName,
    learnerEmail: attempt.learnerEmail,
    companyName: attempt.companyName || "",
    answers: rawAnswers.answers || rawAnswers,
    selfRatings: rawAnswers.selfRatings || {},
    scoreOn20: attempt.scoreOn20,
    createdAt:
      typeof attempt.createdAt === "string" ? attempt.createdAt : new Date(attempt.createdAt).toISOString(),
  };
}

/**
 * Calcule le score sur 20 et le détail correct/incorrect pour chaque question du quiz.
 * payload.answers est un objet { [questionId]: optionLabel }.
 */
function scoreQuizAnswers(quiz, answers) {
  const details = quiz.questions.map((question) => {
    const submittedLabel = answers ? answers[question.id] : undefined;
    const correctOption = question.options.find((option) => option.isCorrect);
    const isCorrect = Boolean(submittedLabel) && submittedLabel === correctOption?.label;

    return {
      questionId: question.id,
      domain: question.domain,
      question: question.question,
      submittedLabel: submittedLabel || null,
      correctLabel: correctOption ? correctOption.label : null,
      isCorrect,
    };
  });

  const correctCount = details.filter((detail) => detail.isCorrect).length;
  const scoreOn20 = quiz.questions.length > 0 ? Math.round(((correctCount / quiz.questions.length) * 20) * 100) / 100 : 0;

  return { details, scoreOn20, correctCount, totalQuestions: quiz.questions.length };
}

async function submitQuizAttempt(payload) {
  const quiz = getQuizBySlug(payload.quizSlug);

  if (!quiz) {
    const error = new Error("Quiz not found");
    error.statusCode = 404;
    error.expose = true;
    throw error;
  }

  const { details, scoreOn20, correctCount, totalQuestions } = scoreQuizAnswers(quiz, payload.answers);
  const storedAnswers = { answers: payload.answers, selfRatings: payload.selfRatings || {} };

  const prisma = getPrismaClient();

  if (prisma) {
    // On vérifie que le bulletin existe pour éviter une violation de contrainte de clé étrangère silencieuse.
    const bulletin = await getBulletinInscriptionById(payload.bulletinInscriptionId);

    if (!bulletin) {
      const error = new Error("Bulletin d'inscription introuvable");
      error.statusCode = 404;
      error.expose = true;
      throw error;
    }

    const normalizedEmail = normalizeLearnerEmail(payload.learnerEmail);
    const existingAttempts = await prisma.quizAttempt.findMany({
      where: { bulletinInscriptionId: payload.bulletinInscriptionId },
    });
    const alreadySubmitted = existingAttempts.some(
      (attempt) => normalizeLearnerEmail(attempt.learnerEmail) === normalizedEmail,
    );

    if (alreadySubmitted) {
      const error = new Error("Cette auto-évaluation a déjà été complétée.");
      error.statusCode = 409;
      error.expose = true;
      throw error;
    }

    const created = await prisma.quizAttempt.create({
      data: {
        bulletinInscriptionId: payload.bulletinInscriptionId,
        quizSlug: payload.quizSlug,
        learnerFullName: payload.learnerFullName,
        learnerEmail: payload.learnerEmail,
        companyName: payload.companyName || null,
        answers: storedAnswers,
        scoreOn20,
      },
    });

    return {
      attempt: normalizeQuizAttempt(created),
      details,
      correctCount,
      totalQuestions,
    };
  }

  const normalizedEmailFallback = normalizeLearnerEmail(payload.learnerEmail);
  const alreadySubmittedFallback = inMemoryQuizAttempts.some(
    (attempt) =>
      attempt.bulletinInscriptionId === payload.bulletinInscriptionId &&
      normalizeLearnerEmail(attempt.learnerEmail) === normalizedEmailFallback,
  );

  if (alreadySubmittedFallback) {
    const error = new Error("Cette auto-évaluation a déjà été complétée.");
    error.statusCode = 409;
    error.expose = true;
    throw error;
  }

  const fallbackAttempt = {
    id: randomUUID(),
    ...payload,
    answers: storedAnswers,
    scoreOn20,
    createdAt: new Date().toISOString(),
  };

  inMemoryQuizAttempts.push(fallbackAttempt);

  return {
    attempt: normalizeQuizAttempt(fallbackAttempt),
    details,
    correctCount,
    totalQuestions,
  };
}

/**
 * Enrichit une tentative normalisée avec le détail correct/incorrect par question,
 * recalculé à la volée à partir du quiz correspondant (pas de stockage du détail en base).
 * Si le quiz n'existe plus (quizSlug orphelin), `details` est renvoyé à null sans planter.
 */
function buildQuizAttemptDetail(attempt) {
  const quiz = getQuizBySlug(attempt.quizSlug);

  if (!quiz) {
    return { ...attempt, details: null, correctCount: null, totalQuestions: null };
  }

  const { details, correctCount, totalQuestions } = scoreQuizAnswers(quiz, attempt.answers);

  return { ...attempt, details, correctCount, totalQuestions };
}

async function getQuizAttemptById(id) {
  const prisma = getPrismaClient();

  const attempt = prisma
    ? await prisma.quizAttempt.findUnique({ where: { id } })
    : inMemoryQuizAttempts.find((item) => item.id === id);

  if (!attempt) return null;

  const normalized = normalizeQuizAttempt(attempt);
  const { details, correctCount, totalQuestions } = buildQuizAttemptDetail(normalized);

  return { attempt: normalized, details, correctCount, totalQuestions };
}

async function listQuizAttemptsByBulletinId(bulletinInscriptionId) {
  const prisma = getPrismaClient();

  if (prisma) {
    const attempts = await prisma.quizAttempt.findMany({
      where: { bulletinInscriptionId },
      orderBy: { createdAt: "desc" },
    });

    return attempts.map(normalizeQuizAttempt).map(buildQuizAttemptDetail);
  }

  return inMemoryQuizAttempts
    .filter((attempt) => attempt.bulletinInscriptionId === bulletinInscriptionId)
    .map(normalizeQuizAttempt)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map(buildQuizAttemptDetail);
}

async function listAllQuizAttempts() {
  const prisma = getPrismaClient();

  if (prisma) {
    const attempts = await prisma.quizAttempt.findMany({
      orderBy: { createdAt: "desc" },
    });

    return attempts.map(normalizeQuizAttempt).map(buildQuizAttemptDetail);
  }

  return [...inMemoryQuizAttempts]
    .map(normalizeQuizAttempt)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map(buildQuizAttemptDetail);
}

function toPublicQuiz(quiz) {
  if (!quiz) {
    return null;
  }

  return {
    slug: quiz.slug,
    formationSlug: quiz.formationSlug,
    title: quiz.title,
    selfRatingDomains: quiz.selfRatingDomains,
    // Ne jamais exposer isCorrect au client avant la soumission du quiz.
    questions: quiz.questions.map((question) => ({
      id: question.id,
      domain: question.domain,
      question: question.question,
      options: question.options.map((option) => ({ label: option.label })),
    })),
  };
}

function getPublicQuizByFormationSlug(formationSlug) {
  return toPublicQuiz(getQuizByFormationSlug(formationSlug));
}

function getPublicQuizBySlug(slug) {
  return toPublicQuiz(getQuizBySlug(slug));
}

module.exports = {
  getQuizBySlug,
  getQuizByFormationSlug,
  getPublicQuizByFormationSlug,
  getPublicQuizBySlug,
  submitQuizAttempt,
  listQuizAttemptsByBulletinId,
  listAllQuizAttempts,
  buildQuizAttemptDetail,
  getQuizAttemptById,
};
