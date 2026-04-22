import type { MetadataRoute } from "next";
import { getFormations, getSiteUrl } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const routes = ["", "/qui-sommes-nous", "/formations", "/calendrier", "/inscriptions", "/contact", "/admin"];
  const formations = await getFormations();
  const formationRoutes = formations.map((formation) => `/formations/${formation.slug}`);

  return [...routes, ...formationRoutes].map((route) => ({
    url: `${siteUrl}${route}`,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
