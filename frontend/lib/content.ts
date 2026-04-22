import "server-only";
import catalogData from "../../shared/catalog-data.json";
import type { CatalogData, Formation, Registration, Session } from "../../shared/types";

const catalog = catalogData as CatalogData;

type CatalogServiceModule = {
  listFormations: () => Promise<Formation[]>;
  getFormationBySlug: (slug: string) => Promise<Formation | null>;
  listSessions: () => Promise<Session[]>;
};

type RegistrationServiceModule = {
  listRegistrations: () => Promise<Registration[]>;
};

export const siteName = "Oxideve";
export const siteDescription =
  "Organisme de formation BTP et énergie spécialisé en QualiPV, QualiPAC, IRVE et climatisation.";
export const contactPhone = "02 35 00 00 00";
export const contactEmail = "contact@oxideve.fr";

export function getSiteUrl() {
  return process.env.SITE_URL || "http://localhost:3000";
}

function getCatalogService(): CatalogServiceModule {
  return require("../../backend/services/catalogService.js") as CatalogServiceModule;
}

function getRegistrationService(): RegistrationServiceModule {
  return require("../../backend/services/registrationService.js") as RegistrationServiceModule;
}

export async function getFormations(): Promise<Formation[]> {
  try {
    const service = getCatalogService();
    return await service.listFormations();
  } catch {
    return catalog.formations;
  }
}

export async function getFormationBySlug(slug: string): Promise<Formation | undefined> {
  try {
    const service = getCatalogService();
    const formation = await service.getFormationBySlug(slug);
    return formation ?? undefined;
  } catch {
    return catalog.formations.find((formation) => formation.slug === slug);
  }
}

export async function getSessions(): Promise<Session[]> {
  try {
    const service = getCatalogService();
    return await service.listSessions();
  } catch {
    return catalog.sessions;
  }
}

export async function getSessionsForFormation(slug: string): Promise<Session[]> {
  const sessions = await getSessions();
  return sessions.filter((session) => session.formationSlug === slug);
}

export async function getRegistrations(): Promise<Registration[]> {
  try {
    const service = getRegistrationService();
    return await service.listRegistrations();
  } catch {
    return [];
  }
}

export function formatDateRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return `${formatter.format(new Date(startDate))} au ${formatter.format(new Date(endDate))}`;
}

export function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(date));
}
