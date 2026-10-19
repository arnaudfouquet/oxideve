const { randomUUID } = require("crypto");
const blogArticles = require("../../shared/editorial-data.json");
const { getPrismaClient } = require("./prismaClient");
const { sanitizeArticleHtml, htmlToPlainText } = require("./articleSanitizer");
const { uniqueSlug } = require("./slugify");

/** ~200 mots par minute, arrondi à la minute supérieure. */
function estimateReadingTime(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}

/** Coupe au dernier mot entier, puis ajoute une ellipse. */
function truncateAtWord(text, limit) {
  const clean = (text || "").trim();
  if (clean.length <= limit) return clean;

  const cut = clean.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : limit).trim()}…`;
}

/**
 * Prépare les champs calculés d'un article : contenu filtré, extrait et temps
 * de lecture déduits du texte, métadonnées SEO tronquées proprement.
 */
function prepareArticle(payload) {
  const raw = payload.bodyHtml || "";

  // Garde-fou : un contenu sans la moindre balise signale presque toujours un
  // texte déjà aplati qu'on s'apprête à réécrire par-dessus le vrai HTML. On
  // le réenveloppe en paragraphes plutôt que de perdre la mise en forme.
  const bodyHtml = /<[a-z][\s\S]*>/i.test(raw)
    ? sanitizeArticleHtml(raw)
    : sanitizeArticleHtml(
        raw
          .split(/\n\s*\n/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean)
          .map((paragraph) => `<p>${paragraph}</p>`)
          .join(""),
      );

  const plainText = htmlToPlainText(bodyHtml);

  const excerpt = (payload.excerpt || "").trim() || truncateAtWord(plainText, 200);

  return {
    bodyHtml,
    // On conserve `body` en paragraphes bruts : les anciens articles et les
    // exports continuent de fonctionner sans connaître le HTML.
    body: plainText ? plainText.split(/(?<=\.)\s+(?=[A-ZÀ-Ý])/).slice(0, 40) : [],
    excerpt,
    readingTime: (payload.readingTime || "").trim() || estimateReadingTime(plainText),
    // Vides, le titre et l'accroche de l'article prennent le relais.
    seoTitle: truncateAtWord((payload.seoTitle || "").trim(), 60),
    seoDescription: truncateAtWord((payload.seoDescription || "").trim(), 160),
    published: payload.published !== false,
    indexable: payload.indexable !== false,
  };
}

const inMemoryArticles = blogArticles.map((article) => ({ ...article }));

function listFallbackArticles() {
  return [...inMemoryArticles].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt)).map(normalizeArticle);
}

function normalizeArticle(article) {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    category: article.category,
    excerpt: article.excerpt,
    body: Array.isArray(article.body) ? article.body : [],
    bodyHtml: article.bodyHtml || undefined,
    readingTime: article.readingTime,
    publishedAt: typeof article.publishedAt === "string" ? article.publishedAt.slice(0, 10) : new Date(article.publishedAt).toISOString().slice(0, 10),
    featuredFormationSlug: article.featuredFormationSlug || undefined,
    coverImageUrl: article.coverImageUrl || undefined,
    // Les anciens articles n'ont pas ces colonnes : ils sont publiés et indexés.
    published: article.published !== false,
    indexable: article.indexable !== false,
    seoTitle: article.seoTitle || "",
    seoDescription: article.seoDescription || "",
  };
}

/**
 * Recopie les articles de démo dans la vraie table dès que la base est vide, pour que
 * l'admin ne serve jamais ces articles en lecture seule depuis le JSON de secours : sans
 * ça, listArticles() retombait silencieusement sur le fallback mémoire et les boutons
 * Modifier/Supprimer de l'admin échouaient avec P2025 (la ligne n'existait pas en base).
 */
async function seedArticlesIfEmpty(prisma) {
  await prisma.article.createMany({
    data: blogArticles.map((article) => ({
      slug: article.slug,
      title: article.title,
      category: article.category,
      excerpt: article.excerpt,
      body: article.body,
      readingTime: article.readingTime,
      publishedAt: new Date(article.publishedAt),
      featuredFormationSlug: article.featuredFormationSlug || null,
      coverImageUrl: article.coverImageUrl || null,
    })),
    skipDuplicates: true,
  });
}

async function listArticles() {
  const prisma = getPrismaClient();

  if (!prisma) {
    return listFallbackArticles();
  }

  let articles = await prisma.article.findMany({
    orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
  });

  if (articles.length === 0) {
    await seedArticlesIfEmpty(prisma);
    articles = await prisma.article.findMany({
      orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
    });
  }

  return articles.map(normalizeArticle);
}

async function getArticleBySlug(slug) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const article = inMemoryArticles.find((item) => item.slug === slug);
    return article ? normalizeArticle(article) : null;
  }

  const article = await prisma.article.findUnique({ where: { slug } });

  if (article) {
    return normalizeArticle(article);
  }

  const fallbackArticle = inMemoryArticles.find((item) => item.slug === slug);
  return fallbackArticle ? normalizeArticle(fallbackArticle) : null;
}

async function createArticle(payload) {
  const prisma = getPrismaClient();
  const prepared = prepareArticle(payload);

  // Le slug est calculé à la création puis figé : une adresse déjà partagée
  // ou indexée par Google ne doit jamais changer.
  const existingSlugs = prisma
    ? (await prisma.article.findMany({ select: { slug: true } })).map((item) => item.slug)
    : inMemoryArticles.map((item) => item.slug);

  const slug = uniqueSlug(payload.slug || payload.title, existingSlugs);

  if (!prisma) {
    const article = normalizeArticle({ id: randomUUID(), ...payload, ...prepared, slug });
    inMemoryArticles.push(article);
    return article;
  }

  const article = await prisma.article.create({
    data: {
      slug,
      title: payload.title,
      category: payload.category,
      excerpt: prepared.excerpt,
      body: prepared.body,
      bodyHtml: prepared.bodyHtml,
      readingTime: prepared.readingTime,
      publishedAt: new Date(payload.publishedAt),
      featuredFormationSlug: payload.featuredFormationSlug || null,
      coverImageUrl: payload.coverImageUrl || null,
      published: prepared.published,
      indexable: prepared.indexable,
      seoTitle: prepared.seoTitle,
      seoDescription: prepared.seoDescription,
    },
  });

  return normalizeArticle(article);
}

async function updateArticle(slug, payload) {
  const prisma = getPrismaClient();
  const prepared = prepareArticle(payload);

  if (!prisma) {
    const index = inMemoryArticles.findIndex((item) => item.slug === slug);

    if (index === -1) {
      throw new Error("Article not found");
    }

    // `slug` en dernier : il reste celui d'origine même si le titre change.
    const updated = normalizeArticle({ ...inMemoryArticles[index], ...payload, ...prepared, slug });
    inMemoryArticles[index] = updated;
    return updated;
  }

  const article = await prisma.article.update({
    where: { slug },
    data: {
      title: payload.title,
      category: payload.category,
      excerpt: prepared.excerpt,
      body: prepared.body,
      bodyHtml: prepared.bodyHtml,
      readingTime: prepared.readingTime,
      published: prepared.published,
      indexable: prepared.indexable,
      seoTitle: prepared.seoTitle,
      seoDescription: prepared.seoDescription,
      publishedAt: new Date(payload.publishedAt),
      featuredFormationSlug: payload.featuredFormationSlug || null,
      coverImageUrl: payload.coverImageUrl || null,
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