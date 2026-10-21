function notFoundHandler(_req, res) {
  res.status(404).json({ error: "Not found" });
}

function errorHandler(error, _req, res, _next) {
  // Données envoyées invalides (schéma zod) : c'est une erreur du formulaire,
  // pas du serveur. Répondre 500 masquait la cause et laissait croire à une
  // panne ; on renvoie 400 avec le champ en cause.
  if (error && error.name === "ZodError" && Array.isArray(error.issues)) {
    const champs = [...new Set(error.issues.map((issue) => issue.path.join(".")).filter(Boolean))];
    console.warn("Requête refusée : données invalides", champs.join(", "));
    return res.status(400).json({
      error: champs.length
        ? `Certains champs sont invalides ou manquants : ${champs.join(", ")}.`
        : "Certains champs sont invalides ou manquants.",
      fields: champs,
    });
  }

  console.error("Request failed", error);

  const statusCode = error.statusCode || 500;
  const message = error.expose ? error.message : "Internal server error";

  res.status(statusCode).json({ error: message });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
