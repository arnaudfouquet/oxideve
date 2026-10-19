import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ButtonLink, Container } from "@/components/ui";
import { NewsCard, formatArticleDate, getArticleCover } from "@/components/NewsCard";
import { getArticleBySlug, getPublishedArticles, getFormationBySlug, getSiteUrl } from "@/lib/content";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ apercu?: string }>;
};

/** Vrai si la requête porte une session d'administration valide. */
async function hasAdminSession() {
  const store = await cookies();
  const token = store.get("oxideve_admin_session")?.value;
  if (!token) return false;

  const { readSessionToken } = require("../../../../backend/services/adminSession.js") as {
    readSessionToken: (value: string) => unknown;
  };

  return Boolean(readSessionToken(token));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return { title: "Article introuvable" };
  }

  const title = article.seoTitle?.trim() || `${article.title} | Oxideve`;
  const description = article.seoDescription?.trim() || article.excerpt;

  // Un brouillon ou un article non référençable sort des résultats, tout en
  // restant accessible par son lien.
  const indexable = article.published !== false && article.indexable !== false;

  return {
    title,
    description,
    alternates: { canonical: `${getSiteUrl()}/actualites/${article.slug}` },
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: {
      type: "article",
      title,
      description,
      images: [getArticleCover(article)],
    },
  };
}

export const dynamic = "force-dynamic";

export default async function ArticlePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { apercu } = await searchParams;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // Un brouillon n'est visible qu'en aperçu, et uniquement par un
  // administrateur connecté : un visiteur qui devine l'adresse obtient une 404.
  const isDraft = article.published === false;
  const previewing = isDraft && apercu === "1" && (await hasAdminSession());

  if (isDraft && !previewing) {
    notFound();
  }

  const featuredFormation = article.featuredFormationSlug ? await getFormationBySlug(article.featuredFormationSlug) : undefined;

  const others = (await getPublishedArticles())
    .filter((item) => item.slug !== article.slug)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: article.title,
        description: article.excerpt,
        datePublished: article.publishedAt,
        image: getArticleCover(article),
        author: { "@type": "Organization", name: "Oxideve" },
        publisher: { "@type": "Organization", name: "Oxideve" },
        mainEntityOfPage: `${getSiteUrl()}/actualites/${article.slug}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: getSiteUrl() },
          { "@type": "ListItem", position: 2, name: "Actualités", item: `${getSiteUrl()}/actualites` },
          { "@type": "ListItem", position: 3, name: article.title },
        ],
      },
    ],
  };

  return (
    <div className="news-article">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {previewing ? (
        <div className="news-preview-banner">
          <span>Aperçu — brouillon non publié</span>
          <Link href="/admin">Modifier l&apos;article</Link>
        </div>
      ) : null}

      <div className="news-article-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={getArticleCover(article)} alt="" />
        <span className="news-article-hero-veil" aria-hidden="true" />
      </div>

      <Container>
        <Link className="news-back" href="/actualites">
          Retour aux actualites
        </Link>

        <header className="news-article-head">
          <span className="news-card-chip news-article-chip">{article.category}</span>
          <h1 className="news-article-title">{article.title}</h1>
          <p className="news-article-lead">{article.excerpt}</p>
          <div className="news-card-meta news-article-meta">
            <span>{formatArticleDate(article.publishedAt)}</span>
            <span className="news-card-dot" aria-hidden="true" />
            <span>{article.readingTime}</span>
          </div>
        </header>

        {/* Le contenu riche a déjà été filtré au moment de l'enregistrement. */}
        {article.bodyHtml ? (
          <div className="news-article-body" dangerouslySetInnerHTML={{ __html: article.bodyHtml }} />
        ) : (
          <div className="news-article-body">
            {article.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}

        {featuredFormation ? (
          <aside className="news-formation-box">
            <span className="news-pill news-formation-pill">Formation associee</span>
            <h2 className="news-formation-title">{featuredFormation.title}</h2>
            <p className="news-formation-copy">{featuredFormation.summary}</p>
            <ButtonLink className="home-cta-arrow news-formation-cta" href={`/formations/${featuredFormation.slug}`}>
              Decouvrir la formation
            </ButtonLink>
          </aside>
        ) : null}

        {others.length > 0 ? (
          <section className="news-section news-more">
            <h2 className="news-section-title">
              Nos dernieres <em>actualites</em>
            </h2>
            <div className="news-grid">
              {others.map((item) => (
                <NewsCard article={item} key={item.slug} />
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </div>
  );
}
