import type { MetadataRoute } from "next";
import { getFormations, getSiteUrl } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const routes = ["", "/formations", "/calendrier", "/contact", "/admin"];
  const formationRoutes = getFormations().map((formation) => `/formations/${formation.slug}`);

  return [...routes, ...formationRoutes].map((route) => ({
    url: `${siteUrl}${route}`,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
