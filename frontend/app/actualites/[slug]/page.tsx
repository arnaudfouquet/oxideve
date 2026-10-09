import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink, Container } from "@/components/ui";
import { NewsCard, formatArticleDate, getArticleCover } from "@/components/NewsCard";
import { getArticleBySlug, getArticles, getFormationBySlug } from "@/lib/content";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  return {
    title: article ? `${article.title} | Oxideve` : "Article introuvable",
    description: article?.excerpt,
  };
}

export const dynamic = "force-dynamic";

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const featuredFormation = article.featuredFormationSlug ? await getFormationBySlug(article.featuredFormationSlug) : undefined;

  const others = (await getArticles())
    .filter((item) => item.slug !== article.slug)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 3);

  return (
    <div className="news-article">
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

        <div className="news-article-body">
          {article.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

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
