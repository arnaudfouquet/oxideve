const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

function sanitizeValue(value) {
  if (typeof value === "string") {
    return value.replace(/<[^>]*>?/gm, "").trim();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, sanitizeValue(nestedValue)])
    );
  }

  return value;
}

function sanitizeInputs(req, _res, next) {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  if (req.query) {
    req.query = sanitizeValue(req.query);
  }

  next();
}

const HONEYPOT_FIELD = "website";
const FORM_TIMESTAMP_FIELD = "formRenderedAt";
const MIN_FILL_TIME_MS = 2000;

/**
 * Anti-bot minimal sans dépendance externe ni clé d'API : un champ caché (piège à bots,
 * jamais rempli par un humain) et un horodatage du rendu du formulaire (un envoi trop
 * rapide trahit un script). Les deux valeurs sont retirées du payload avant validation
 * métier pour ne pas polluer les schémas Zod.
 */
function honeypotGuard(req, res, next) {
  if (req.body && typeof req.body === "object") {
    const honeypotValue = req.body[HONEYPOT_FIELD];
    const renderedAt = req.body[FORM_TIMESTAMP_FIELD];

    delete req.body[HONEYPOT_FIELD];
    delete req.body[FORM_TIMESTAMP_FIELD];

    if (typeof honeypotValue === "string" && honeypotValue.trim() !== "") {
      return res.status(400).json({ error: "Requête invalide." });
    }

    const renderedAtMs = Number.parseInt(renderedAt, 10);
    if (!renderedAtMs || Date.now() - renderedAtMs < MIN_FILL_TIME_MS) {
      return res.status(400).json({ error: "Requête invalide." });
    }
  }

  next();
}

module.exports = {
  apiLimiter,
  formLimiter,
  sanitizeInputs,
  honeypotGuard,
};
