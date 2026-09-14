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

function normalizeQuizAttempt(attempt) {
  return {
    id: attempt.id,
    bulletinInscriptionId: attempt.bulletinInscriptionId,
    quizSlug: attempt.quizSlug,
    learnerFullName: attempt.learnerFullName,
    learnerEmail: attempt.learnerEmail,
    companyName: attempt.companyName || "",
    answers: attempt.answers,
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

    const created = await prisma.quizAttempt.create({
      data: {
        bulletinInscriptionId: payload.bulletinInscriptionId,
        quizSlug: payload.quizSlug,
        learnerFullName: payload.learnerFullName,
        learnerEmail: payload.learnerEmail,
        companyName: payload.companyName || null,
        answers: payload.answers,
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

  const fallbackAttempt = {
    id: randomUUID(),
    ...payload,
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
};
