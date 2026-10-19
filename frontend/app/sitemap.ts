import type { MetadataRoute } from "next";
import { getPublishedArticles, getSiteUrl } from "@/lib/content";

type CatalogData = {
  formations: Array<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  // L'espace d'administration n'a rien à faire dans un sitemap public.
  const routes = [
    "",
    "/qui-sommes-nous",
    "/formations",
    "/financement",
    "/actualites",
    "/calendrier",
    "/inscriptions",
    "/contact",
    "/mentions-legales",
    "/politique-confidentialite",
  ];

  const { formations } = require("../../shared/catalog-data.json") as CatalogData;
  const formationRoutes = formations.map((formation) => `/formations/${formation.slug}`);

  // Seuls les articles publiés ET référençables entrent dans le sitemap.
  const articles = await getPublishedArticles();
  const articleRoutes = articles
    .filter((article) => article.indexable !== false)
    .map((article) => `/actualites/${article.slug}`);

  return [...routes, ...formationRoutes, ...articleRoutes].map((route) => ({
    url: `${siteUrl}${route}`,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
