import "server-only";
import catalogData from "../../shared/catalog-data.json";
import type { Article, BulletinInscriptionWithAttempts, CatalogData, Company, CrmInteraction, CrmTask, Formation, Participant, QuizAttempt, Registration, Session } from "../../shared/types";
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

type BulletinInscriptionServiceModule = {
  listBulletinInscriptions: () => Promise<BulletinInscriptionWithAttempts[]>;
};

type QuizServiceModule = {
  listAllQuizAttempts: () => Promise<QuizAttempt[]>;
};

type ParticipantsServiceModule = {
  listParticipants: () => Promise<Participant[]>;
};

type CompanyServiceModule = {
  listCompanies: () => Promise<Company[]>;
};

type CrmServiceModule = {
  listCrmTasks: () => Promise<CrmTask[]>;
  listCrmInteractions: () => Promise<CrmInteraction[]>;
};

type EditorialServiceModule = {
  listArticles: () => Promise<Article[]>;
  getArticleBySlug: (slug: string) => Promise<Article | null>;
};

export const siteName = "Oxideve";
export const siteDescription =
  "Organisme de formation professionnelle généraliste : énergie, bâtiment, sécurité et bureautique.";
export const contactPhone = "06 36 44 55 93";
export const contactEmail = "contact@oxideve.fr";
export const contactAddress = "39 avenue Jean-François Champollion, 31100 Toulouse";

export function getSiteUrl() {
  return process.env.SITE_URL || "http://localhost:3000";
}

function getCatalogService(): CatalogServiceModule {
  return require("../../backend/services/catalogService.js") as CatalogServiceModule;
}

function getRegistrationService(): RegistrationServiceModule {
  return require("../../backend/services/registrationService.js") as RegistrationServiceModule;
}

function getBulletinInscriptionService(): BulletinInscriptionServiceModule {
  return require("../../backend/services/bulletinInscriptionService.js") as BulletinInscriptionServiceModule;
}

function getQuizService(): QuizServiceModule {
  return require("../../backend/services/quizService.js") as QuizServiceModule;
}

function getParticipantsService(): ParticipantsServiceModule {
  return require("../../backend/services/participantsService.js") as ParticipantsServiceModule;
}

function getCompanyService(): CompanyServiceModule {
  return require("../../backend/services/companyService.js") as CompanyServiceModule;
}

function getCrmService(): CrmServiceModule {
  return require("../../backend/services/crmService.js") as CrmServiceModule;
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

export async function getBulletinInscriptions(): Promise<BulletinInscriptionWithAttempts[]> {
  try {
    const bulletinService = getBulletinInscriptionService();
    const quizService = getQuizService();
    const [bulletins, quizAttempts] = await Promise.all([
      bulletinService.listBulletinInscriptions(),
      quizService.listAllQuizAttempts(),
    ]);

    return bulletins.map((bulletin) => ({
      ...bulletin,
      quizAttempts: quizAttempts.filter((attempt) => attempt.bulletinInscriptionId === bulletin.id),
    }));
  } catch {
    return [];
  }
}

export async function getParticipants(): Promise<Participant[]> {
  try {
    const service = getParticipantsService();
    return await service.listParticipants();
  } catch {
    return [];
  }
}

export async function getCompanies(): Promise<Company[]> {
  try {
    const service = getCompanyService();
    return await service.listCompanies();
  } catch {
    return [];
  }
}

export async function getCrmTasks(): Promise<CrmTask[]> {
  try {
    const service = getCrmService();
    return await service.listCrmTasks();
  } catch {
    return [];
  }
}

export async function getCrmInteractions(): Promise<CrmInteraction[]> {
  try {
    const service = getCrmService();
    return await service.listCrmInteractions();
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

export { formatDateRange, formatShortDate } from "./dates";
