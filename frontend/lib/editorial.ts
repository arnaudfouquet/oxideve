import editorialData from "../../shared/editorial-data.json";
import type { Article } from "../../shared/types";

export const blogArticles = editorialData as Article[];

export function getArticleBySlug(slug: string) {
  return blogArticles.find((article) => article.slug === slug);
}