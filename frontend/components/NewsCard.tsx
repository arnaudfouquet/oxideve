import Link from "next/link";
import type { Article } from "../../shared/types";

const FALLBACK_COVERS: Record<string, string> = {
  rge: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
  irve: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1200&q=80",
  "pompes a chaleur": "https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?auto=format&fit=crop&w=1200&q=80",
  "pompes à chaleur": "https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?auto=format&fit=crop&w=1200&q=80",
  photovoltaique: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80",
  photovoltaïque: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80",
  securite: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
  sécurité: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
};

const GENERIC_COVER = "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80";

export function getArticleCover(article: Article): string {
  if (article.coverImageUrl) {
    return article.coverImageUrl;
  }

  return FALLBACK_COVERS[article.category.trim().toLowerCase()] ?? GENERIC_COVER;
}

export function formatArticleDate(publishedAt: string): string {
  const date = new Date(publishedAt);

  if (Number.isNaN(date.getTime())) {
    return publishedAt;
  }

  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

type NewsCardProps = {
  article: Article;
};

export function NewsCard({ article }: NewsCardProps) {
  return (
    <Link className="news-card" href={`/actualites/${article.slug}`}>
      <span className="news-card-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={getArticleCover(article)} alt="" loading="lazy" />
        <span className="news-card-chip">{article.category}</span>
      </span>
      <span className="news-card-body">
        <span className="news-card-meta">
          <span>{formatArticleDate(article.publishedAt)}</span>
          <span className="news-card-dot" aria-hidden="true" />
          <span>{article.readingTime}</span>
        </span>
        <span className="news-card-title">{article.title}</span>
        <span className="news-card-excerpt">{article.excerpt}</span>
        <span className="news-card-link">Lire l&apos;article</span>
      </span>
    </Link>
  );
}
