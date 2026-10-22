const { getPrismaClient } = require("./prismaClient");
const options = require("../../shared/feedback-options.json");

// Listes partagees avec le formulaire (frontend/lib/feedback-options.ts) :
// une seule source, les deux cotes ne peuvent pas diverger.
const FEEDBACK_PAGES = options.pages;
const FEEDBACK_KINDS = options.kinds;
const FEEDBACK_STATUSES = options.statuses;

function normalizeFeedback(feedback) {
  return {
    id: feedback.id,
    page: feedback.page,
    kind: feedback.kind || FEEDBACK_KINDS[0],
    author: feedback.author,
    message: feedback.message,
    imageUrl: feedback.imageUrl || "",
    status: feedback.status || FEEDBACK_STATUSES[0],
    createdAt:
      typeof feedback.createdAt === "string" ? feedback.createdAt : new Date(feedback.createdAt).toISOString(),
  };
}

/** Les retours les plus récents d'abord : ce sont ceux qu'on traite. */
async function listFeedbacks() {
  const prisma = getPrismaClient();
  const feedbacks = await prisma.feedback.findMany({ orderBy: { createdAt: "desc" } });

  return feedbacks.map(normalizeFeedback);
}

async function createFeedback(payload) {
  const prisma = getPrismaClient();

  const feedback = await prisma.feedback.create({
    data: {
      page: payload.page,
      kind: FEEDBACK_KINDS.includes(payload.kind) ? payload.kind : FEEDBACK_KINDS[0],
      author: payload.author,
      message: payload.message,
      imageUrl: payload.imageUrl || null,
    },
  });

  return normalizeFeedback(feedback);
}

async function updateFeedbackStatus(id, status) {
  if (!FEEDBACK_STATUSES.includes(status)) {
    const error = new Error("Statut inconnu.");
    error.statusCode = 400;
    error.expose = true;
    throw error;
  }

  const prisma = getPrismaClient();
  const feedback = await prisma.feedback.update({ where: { id }, data: { status } });

  return normalizeFeedback(feedback);
}

async function deleteFeedback(id) {
  const prisma = getPrismaClient();
  await prisma.feedback.delete({ where: { id } });
}

module.exports = {
  FEEDBACK_KINDS,
  FEEDBACK_PAGES,
  FEEDBACK_STATUSES,
  createFeedback,
  deleteFeedback,
  listFeedbacks,
  updateFeedbackStatus,
};
