const express = require("express");
const { z } = require("zod");
const { formLimiter } = require("../middleware/security");
const {
  listFormations,
  getFormationBySlug,
  listSessions,
  createFormation,
  createSession,
  deleteSession,
  updateFormation,
  updateSession,
} = require("../services/catalogService");
const { createArticle, deleteArticle, getArticleBySlug, listArticles, updateArticle } = require("../services/editorialService");
const { createCompany, listCompanies, updateCompany } = require("../services/companyService");
const { createRegistration, listRegistrations } = require("../services/registrationService");

const inscriptionSchema = z.object({
  company: z.string().min(2).max(120),
  contactName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(8).max(30),
  formationSlug: z.string().min(2),
  sessionId: z.string().min(2),
  message: z.string().max(1000).optional().default(""),
});

const formationSchema = z.object({
  slug: z.string().min(3).max(120).regex(/^[a-z0-9-]+$/),
  title: z.string().min(3).max(160),
  shortTitle: z.string().min(2).max(80),
  category: z.string().min(2).max(100),
  duration: z.string().min(2).max(60),
  durationDetails: z.string().min(10).max(1000),
  location: z.string().min(2).max(160),
  audience: z.string().min(2).max(240),
  summary: z.string().min(10).max(500),
  description: z.string().min(20).max(4000),
  benefits: z.array(z.string().min(2).max(200)).min(1).max(10),
  objectives: z.array(z.string().min(2).max(200)).min(1).max(10),
  prerequisites: z.array(z.string().min(2).max(240)).min(1).max(12),
  modalities: z.array(z.string().min(2).max(240)).min(1).max(12),
  programme: z.array(z.string().min(2).max(500)).min(1).max(20),
  certification: z.string().min(10).max(1000),
  price: z.string().min(2).max(60),
  priceDetails: z.string().min(10).max(1000),
  successRate: z.string().min(2).max(120),
  handicapPolicy: z.string().min(10).max(1200),
});

const sessionSchema = z.object({
  formationSlug: z.string().min(3).max(120),
  city: z.string().min(2).max(120),
  startDate: z.string().min(10).max(10),
  endDate: z.string().min(10).max(10),
  seatsLeft: z.coerce.number().int().min(0).max(999),
  mode: z.string().min(2).max(40),
});

const articleSchema = z.object({
  slug: z.string().min(3).max(160).regex(/^[a-z0-9-]+$/),
  title: z.string().min(5).max(220),
  category: z.string().min(2).max(80),
  excerpt: z.string().min(20).max(600),
  body: z.array(z.string().min(20).max(4000)).min(1).max(20),
  readingTime: z.string().min(2).max(40),
  publishedAt: z.string().min(10).max(10),
  featuredFormationSlug: z.string().max(120).optional().default(""),
});

const companySchema = z.object({
  name: z.string().min(2).max(160),
  contactName: z.string().min(2).max(160),
  email: z.string().email(),
  phone: z.string().min(8).max(40),
  status: z.string().min(2).max(40),
  source: z.string().min(2).max(60),
  priority: z.string().min(2).max(40),
  notes: z.string().max(4000).optional().default(""),
  nextFollowUpAt: z.string().max(10).optional().or(z.literal("")),
  lastContactAt: z.string().max(10).optional().or(z.literal("")),
});

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function createApiRouter() {
  const router = express.Router();

  router.get(
    "/formations",
    asyncHandler(async (_req, res) => {
      const formations = await listFormations();
      res.json({ data: formations });
    })
  );

  router.get(
    "/formations/:slug",
    asyncHandler(async (req, res) => {
      const formation = await getFormationBySlug(req.params.slug);

      if (!formation) {
        return res.status(404).json({ error: "Formation not found" });
      }

      return res.json({ data: formation });
    })
  );

  router.get(
    "/sessions",
    asyncHandler(async (_req, res) => {
      const sessions = await listSessions();
      res.json({ data: sessions });
    })
  );

  router.get(
    "/articles",
    asyncHandler(async (_req, res) => {
      const articles = await listArticles();
      res.json({ data: articles });
    })
  );

  router.get(
    "/articles/:slug",
    asyncHandler(async (req, res) => {
      const article = await getArticleBySlug(req.params.slug);

      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }

      return res.json({ data: article });
    })
  );

  router.post(
    "/inscription",
    formLimiter,
    asyncHandler(async (req, res) => {
      const payload = inscriptionSchema.parse(req.body);
      const registration = await createRegistration(payload);
      res.status(201).json({ data: registration, message: "Inscription enregistrée" });
    })
  );

  router.get(
    "/admin/overview",
    asyncHandler(async (_req, res) => {
      const [formations, sessions, registrations, articles, companies] = await Promise.all([
        listFormations(),
        listSessions(),
        listRegistrations(),
        listArticles(),
        listCompanies(),
      ]);

      res.json({ data: { formations, sessions, registrations, articles, companies } });
    })
  );

  router.get(
    "/admin/companies",
    asyncHandler(async (_req, res) => {
      const companies = await listCompanies();
      res.json({ data: companies });
    })
  );

  router.post(
    "/admin/companies",
    asyncHandler(async (req, res) => {
      const payload = companySchema.parse(req.body);
      const company = await createCompany(payload);
      res.status(201).json({ data: company, message: "Fiche entreprise créée" });
    })
  );

  router.patch(
    "/admin/companies/:id",
    asyncHandler(async (req, res) => {
      const payload = companySchema.parse(req.body);
      const company = await updateCompany(req.params.id, payload);
      res.json({ data: company, message: "Fiche entreprise mise à jour" });
    })
  );

  router.post(
    "/admin/formations",
    asyncHandler(async (req, res) => {
      const payload = formationSchema.parse(req.body);
      const formation = await createFormation(payload);
      res.status(201).json({ data: formation, message: "Formation créée" });
    })
  );

  router.patch(
    "/admin/formations/:slug",
    asyncHandler(async (req, res) => {
      const payload = formationSchema.omit({ slug: true }).parse(req.body);
      const formation = await updateFormation(req.params.slug, payload);
      res.json({ data: formation, message: "Formation mise à jour" });
    })
  );

  router.post(
    "/admin/sessions",
    asyncHandler(async (req, res) => {
      const payload = sessionSchema.parse(req.body);
      const session = await createSession({ ...payload, id: `session-${Date.now()}` });
      res.status(201).json({ data: session, message: "Session créée" });
    })
  );

  router.patch(
    "/admin/sessions/:id",
    asyncHandler(async (req, res) => {
      const payload = sessionSchema.parse(req.body);
      const session = await updateSession(req.params.id, payload);
      res.json({ data: session, message: "Session mise à jour" });
    })
  );

  router.delete(
    "/admin/sessions/:id",
    asyncHandler(async (req, res) => {
      const session = await deleteSession(req.params.id);
      res.json({ data: session, message: "Session supprimée" });
    })
  );

  router.post(
    "/admin/articles",
    asyncHandler(async (req, res) => {
      const payload = articleSchema.parse(req.body);
      const article = await createArticle(payload);
      res.status(201).json({ data: article, message: "Article créé" });
    })
  );

  router.patch(
    "/admin/articles/:slug",
    asyncHandler(async (req, res) => {
      const payload = articleSchema.omit({ slug: true }).parse(req.body);
      const article = await updateArticle(req.params.slug, payload);
      res.json({ data: article, message: "Article mis à jour" });
    })
  );

  router.delete(
    "/admin/articles/:slug",
    asyncHandler(async (req, res) => {
      const article = await deleteArticle(req.params.slug);
      res.json({ data: article, message: "Article supprimé" });
    })
  );

  return router;
}

module.exports = {
  createApiRouter,
};
