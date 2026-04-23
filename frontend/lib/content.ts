import "server-only";
import catalogData from "../../shared/catalog-data.json";
import type { Article, CatalogData, Formation, Registration, Session } from "../../shared/types";
import { blogArticles } from "./editorial";

const catalog = catalogData as CatalogData;

type CatalogServiceModule = {
  listFormations: () => Promise<Formation[]>;
  getFormationBySlug: (slug: string) => Promise<Formation | null>;
  listSessions: () => Promise<Session[]>;
};

type RegistrationServiceModule = {
  listRegistrations: () => Promise<Registration[]>;
};

type EditorialServiceModule = {
  listArticles: () => Promise<Article[]>;
  getArticleBySlug: (slug: string) => Promise<Article | null>;
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

function getEditorialService(): EditorialServiceModule {
  return require("../../backend/services/editorialService.js") as EditorialServiceModule;
}

function mergeByKey<T>(primary: T[], fallback: T[], getKey: (item: T) => string) {
  const merged = new Map<string, T>();

  for (const item of fallback) {
    merged.set(getKey(item), item);
  }

  for (const item of primary) {
    merged.set(getKey(item), item);
  }

  return [...merged.values()];
}

export async function getFormations(): Promise<Formation[]> {
  try {
    const service = getCatalogService();
    return mergeByKey(await service.listFormations(), catalog.formations, (formation) => formation.slug).sort(
      (left, right) => left.title.localeCompare(right.title, "fr"),
    );
  } catch {
    return catalog.formations;
  }
}

export async function getFormationBySlug(slug: string): Promise<Formation | undefined> {
  const formations = await getFormations();
  return formations.find((formation) => formation.slug === slug);
}

export async function getSessions(): Promise<Session[]> {
  try {
    const service = getCatalogService();
    return mergeByKey(await service.listSessions(), catalog.sessions, (session) => session.id).sort(
      (left, right) => left.startDate.localeCompare(right.startDate),
    );
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

export async function getArticles(): Promise<Article[]> {
  try {
    const service = getEditorialService();
    return await service.listArticles();
  } catch {
    return blogArticles;
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  try {
    const service = getEditorialService();
    const article = await service.getArticleBySlug(slug);
    return article ?? undefined;
  } catch {
    return blogArticles.find((article) => article.slug === slug);
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
