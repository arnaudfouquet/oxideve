const { randomUUID } = require("crypto");
const blogArticles = require("../../shared/editorial-data.json");
const { getPrismaClient } = require("./prismaClient");

const inMemoryArticles = blogArticles.map((article) => ({ ...article }));

function normalizeArticle(article) {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    category: article.category,
    excerpt: article.excerpt,
    body: Array.isArray(article.body) ? article.body : [],
    readingTime: article.readingTime,
    publishedAt: typeof article.publishedAt === "string" ? article.publishedAt.slice(0, 10) : new Date(article.publishedAt).toISOString().slice(0, 10),
    featuredFormationSlug: article.featuredFormationSlug || undefined,
  };
}

async function listArticles() {
  const prisma = getPrismaClient();

  if (!prisma) {
    return [...inMemoryArticles].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt)).map(normalizeArticle);
  }

  const articles = await prisma.article.findMany({
    orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
  });

  return articles.map(normalizeArticle);
}

async function getArticleBySlug(slug) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const article = inMemoryArticles.find((item) => item.slug === slug);
    return article ? normalizeArticle(article) : null;
  }

  const article = await prisma.article.findUnique({ where: { slug } });
  return article ? normalizeArticle(article) : null;
}

async function createArticle(payload) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const article = normalizeArticle({ id: randomUUID(), ...payload });
    inMemoryArticles.push(article);
    return article;
  }

  const article = await prisma.article.create({
    data: {
      slug: payload.slug,
      title: payload.title,
      category: payload.category,
      excerpt: payload.excerpt,
      body: payload.body,
      readingTime: payload.readingTime,
      publishedAt: new Date(payload.publishedAt),
      featuredFormationSlug: payload.featuredFormationSlug || null,
    },
  });

  return normalizeArticle(article);
}

async function updateArticle(slug, payload) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const index = inMemoryArticles.findIndex((item) => item.slug === slug);

    if (index === -1) {
      throw new Error("Article not found");
    }

    const updated = normalizeArticle({ ...inMemoryArticles[index], ...payload, slug });
    inMemoryArticles[index] = updated;
    return updated;
  }

  const article = await prisma.article.update({
    where: { slug },
    data: {
      title: payload.title,
      category: payload.category,
      excerpt: payload.excerpt,
      body: payload.body,
      readingTime: payload.readingTime,
      publishedAt: new Date(payload.publishedAt),
      featuredFormationSlug: payload.featuredFormationSlug || null,
    },
  });

  return normalizeArticle(article);
}

async function deleteArticle(slug) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const index = inMemoryArticles.findIndex((item) => item.slug === slug);

    if (index === -1) {
      throw new Error("Article not found");
    }

    const [deleted] = inMemoryArticles.splice(index, 1);
    return normalizeArticle(deleted);
  }

  const article = await prisma.article.delete({ where: { slug } });
  return normalizeArticle(article);
}

module.exports = {
  listArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
};