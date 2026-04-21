const express = require("express");
const { z } = require("zod");
const { formLimiter } = require("../middleware/security");
const { listFormations, getFormationBySlug, listSessions } = require("../services/catalogService");
const { createRegistration } = require("../services/registrationService");

const inscriptionSchema = z.object({
  company: z.string().min(2).max(120),
  contactName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(8).max(30),
  formationSlug: z.string().min(2),
  sessionId: z.string().min(2),
  message: z.string().max(1000).optional().default(""),
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

  return router;
}

module.exports = {
  createApiRouter,
};
