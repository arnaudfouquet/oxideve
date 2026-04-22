import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormationCard } from "@/components/FormationCard";
import { Container, Section, Text, Title } from "@/components/ui";
import { getArticleBySlug, getFormationBySlug } from "@/lib/content";

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

  return (
    <Section>
      <Container>
        <article className="article-detail-shell">
          <Title as="h1" eyebrow={article.category} title={article.title} description={article.excerpt} />
          <div className="article-meta-row">
            <span>{article.readingTime}</span>
            <span>{new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(article.publishedAt))}</span>
          </div>
          <div className="article-body">
            {article.body.map((paragraph) => (
              <Text key={paragraph} size="lg">{paragraph}</Text>
            ))}
          </div>
        </article>

        {featuredFormation ? (
          <div className="article-related-block">
            <Title eyebrow="Formation associee" title="Continuer avec le parcours concerne" />
            <FormationCard formation={featuredFormation} tone="highlight" />
          </div>
        ) : null}
      </Container>
    </Section>
  );
}