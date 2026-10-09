import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Container } from "@/components/ui";
import { formatArticleDate, getArticleCover } from "@/components/NewsCard";
import { NewsCategoryFilter } from "@/components/NewsCategoryFilter";
import { getArticles } from "@/lib/content";

export const metadata: Metadata = {
  title: "Actus sur la formation",
  description: "Notes Oxideve sur les pratiques chantier, les qualifications RGE et l'organisation des parcours de formation.",
};

export const dynamic = "force-dynamic";

export default async function ActualitesPage() {
  const articles = await getArticles();
  const sorted = [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const [featured, ...rest] = sorted;

  return (
    <div className="news-page">
      <Container>
        <header className="news-hero">
          <span className="news-pill">Actualites</span>
          <h1 className="news-hero-title">
            Nos <em>actualites</em> terrain
          </h1>
          <p className="news-hero-copy">
            Nos notes sur les pratiques chantier, les qualifications RGE, l&apos;IRVE et les pompes a chaleur : des reperes
            concrets pour organiser vos parcours de formation et securiser vos interventions.
          </p>
        </header>

        {featured ? (
          <Link className="news-featured" href={`/actualites/${featured.slug}`}>
            <div className="news-featured-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getArticleCover(featured)} alt="" />
              <span className="news-featured-flag">A la une</span>
            </div>
            <div className="news-featured-body">
              <span className="news-card-chip news-featured-chip">{featured.category}</span>
              <span className="news-card-meta">
                <span>{formatArticleDate(featured.publishedAt)}</span>
                <span className="news-card-dot" aria-hidden="true" />
                <span>{featured.readingTime}</span>
              </span>
              <h2 className="news-featured-title">{featured.title}</h2>
              <p className="news-featured-excerpt">{featured.excerpt}</p>
              <span className="ui-button ui-button-primary home-cta-arrow news-featured-cta">Lire l&apos;article</span>
            </div>
          </Link>
        ) : null}

        {rest.length > 0 ? (
          <section className="news-section">
            <h2 className="news-section-title">
              Tous nos <em>articles</em>
            </h2>
            <NewsCategoryFilter articles={rest} />
          </section>
        ) : null}

        <aside className="news-outro">
          <div>
            <h2 className="news-outro-title">
              Besoin d&apos;un <em>parcours</em> adapte a vos equipes ?
            </h2>
            <p className="news-outro-copy">Parcourez le catalogue ou echangez avec nous pour construire un plan de formation.</p>
          </div>
          <ButtonLink className="home-cta-arrow news-outro-cta" href="/formations">
            Voir le catalogue
          </ButtonLink>
        </aside>
      </Container>
    </div>
  );
}
