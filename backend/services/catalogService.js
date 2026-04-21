const catalog = require("../../shared/catalog-data.json");

async function listFormations() {
  return catalog.formations;
}

async function getFormationBySlug(slug) {
  return catalog.formations.find((formation) => formation.slug === slug) || null;
}

async function listSessions() {
  return catalog.sessions;
}

module.exports = {
  listFormations,
  getFormationBySlug,
  listSessions,
};
