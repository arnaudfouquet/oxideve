const express = require("express");
const { z } = require("zod");
const { formLimiter } = require("../middleware/security");
const {
  listFormations,
  getFormationBySlug,
  listSessions,
  createFormation,
  updateFormation,
} = require("../services/catalogService");
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
  location: z.string().min(2).max(160),
  audience: z.string().min(2).max(240),
  summary: z.string().min(10).max(500),
  description: z.string().min(20).max(4000),
  benefits: z.array(z.string().min(2).max(200)).min(1).max(10),
  objectives: z.array(z.string().min(2).max(200)).min(1).max(10),
  price: z.string().min(2).max(60),
  seoTitle: z.string().min(10).max(160),
  seoDescription: z.string().min(10).max(320),
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
      const [formations, sessions, registrations] = await Promise.all([
        listFormations(),
        listSessions(),
        listRegistrations(),
      ]);

      res.json({ data: { formations, sessions, registrations } });
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

  return router;
}

module.exports = {
  createApiRouter,
};
