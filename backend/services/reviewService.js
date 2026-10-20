const { randomUUID } = require("crypto");
const { getPrismaClient } = require("./prismaClient");
const seedReviews = require("../../shared/reviews-data.json");

/** Repli quand la base n'est pas connectée (mode démo). */
const inMemoryReviews = seedReviews.map((review, index) => ({ id: randomUUID(), position: index, ...review }));

function normalizeReview(review) {
  return {
    id: review.id,
    author: review.author,
    rating: Number(review.rating) || 5,
    quote: review.quote,
    source: review.source || "Google",
    city: review.city || "",
    period: review.period || "",
    published: review.published !== false,
    position: Number(review.position) || 0,
  };
}

/** Les avis les plus récents d'abord, à position égale. */
function sortReviews(reviews) {
  return [...reviews].sort((left, right) => left.position - right.position);
}

/**
 * Recopie les avis de démarrage dès que la table est vide, pour que l'admin
 * puisse les modifier au lieu de servir un JSON en lecture seule.
 */
async function seedIfEmpty(prisma) {
  await prisma.review.createMany({
    data: seedReviews.map((review, index) => ({
      author: review.author,
      rating: review.rating,
      quote: review.quote,
      source: review.source || "Google",
      city: review.city || null,
      period: review.period || null,
      published: review.published !== false,
      position: index,
    })),
    skipDuplicates: true,
  });
}

async function listReviews() {
  const prisma = getPrismaClient();

  if (!prisma) {
    return sortReviews(inMemoryReviews).map(normalizeReview);
  }

  let reviews = await prisma.review.findMany({ orderBy: [{ position: "asc" }, { createdAt: "desc" }] });

  if (reviews.length === 0) {
    await seedIfEmpty(prisma);
    reviews = await prisma.review.findMany({ orderBy: [{ position: "asc" }, { createdAt: "desc" }] });
  }

  return reviews.map(normalizeReview);
}

async function createReview(payload) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const review = normalizeReview({ id: randomUUID(), ...payload });
    inMemoryReviews.push(review);
    return review;
  }

  const review = await prisma.review.create({
    data: {
      author: payload.author,
      rating: payload.rating,
      quote: payload.quote,
      source: payload.source || "Google",
      city: payload.city || null,
      period: payload.period || null,
      published: payload.published !== false,
      position: payload.position ?? 0,
    },
  });

  return normalizeReview(review);
}

async function updateReview(id, payload) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const index = inMemoryReviews.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Review not found");

    inMemoryReviews[index] = normalizeReview({ ...inMemoryReviews[index], ...payload, id });
    return inMemoryReviews[index];
  }

  const review = await prisma.review.update({
    where: { id },
    data: {
      author: payload.author,
      rating: payload.rating,
      quote: payload.quote,
      source: payload.source || "Google",
      city: payload.city || null,
      period: payload.period || null,
      published: payload.published !== false,
      position: payload.position ?? 0,
    },
  });

  return normalizeReview(review);
}

async function deleteReview(id) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const index = inMemoryReviews.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Review not found");
    return normalizeReview(inMemoryReviews.splice(index, 1)[0]);
  }

  const review = await prisma.review.delete({ where: { id } });
  return normalizeReview(review);
}

module.exports = {
  listReviews,
  createReview,
  updateReview,
  deleteReview,
};
