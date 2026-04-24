import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section, Text, Title } from "@/components/ui";
import { getArticles } from "@/lib/content";

export const metadata: Metadata = {
  title: "Actus sur la formation",
  description: "Notes Oxideve sur les pratiques chantier, les qualifications RGE et l'organisation des parcours de formation.",
};

export const dynamic = "force-dynamic";

export default async function ActualitesPage() {
  const articles = await getArticles();

  return (
    <Section>
      <Container>
        <Title as="h1" title="Actus sur la formation" />
        <div className="article-grid">
          {articles.map((article) => (
            <article className="article-card" key={article.slug}>
              <span>{article.category}</span>
              <h2>{article.title}</h2>
              <Text tone="muted">{article.excerpt}</Text>
              <div className="article-card-foot">
                <small>{article.readingTime}</small>
                <Link href={`/actualites/${article.slug}`}>Lire l'article</Link>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}