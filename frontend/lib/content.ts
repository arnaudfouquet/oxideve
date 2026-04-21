import catalogData from "../../shared/catalog-data.json";
import type { CatalogData, Formation, Session } from "../../shared/types";

const catalog = catalogData as CatalogData;

export const siteName = "Oxideve";
export const siteDescription =
  "Organisme de formation BTP et énergie spécialisé en QualiPV, QualiPAC, IRVE et climatisation.";
export const contactPhone = "02 35 00 00 00";
export const contactEmail = "contact@oxideve.fr";

export function getSiteUrl() {
  return process.env.SITE_URL || "http://localhost:3000";
}

export function getFormations(): Formation[] {
  return catalog.formations;
}

export function getFormationBySlug(slug: string): Formation | undefined {
  return catalog.formations.find((formation) => formation.slug === slug);
}

export function getSessions(): Session[] {
  return catalog.sessions;
}

export function getSessionsForFormation(slug: string): Session[] {
  return catalog.sessions.filter((session) => session.formationSlug === slug);
}

export function formatDateRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return `${formatter.format(new Date(startDate))} au ${formatter.format(new Date(endDate))}`;
}
