import type { Metadata } from "next";
import Link from "next/link";
import { FormationCard } from "@/components/FormationCard";
import { Container, Section, Title } from "@/components/ui";
import { getFormations } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogue des formations",
  description: "Découvrez les formations Oxideve en photovoltaïque, pompe à chaleur, IRVE, sécurité au travail et bureautique.",
};

function categoryId(category: string) {
  return `category-${category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

export default async function FormationsPage() {
  const formations = await getFormations();
  const categories = Array.from(new Set(formations.map((formation) => formation.category))).sort((left, right) =>
    left.localeCompare(right, "fr")
  );
  const groupedFormations = categories.map((category) => ({
    category,
    formations: formations.filter((formation) => formation.category === category),
  }));

  return (
    <Section>
      <Container>
        <Title
          as="h1"
          title="Toutes nos formations professionnelles"
          description="Retrouvez toutes les formations sur une seule page, puis accédez directement à la famille qui vous intéresse."
        />

        <div className="catalog-summary-row">
          {categories.map((item) => (
            <Link className="catalog-summary-card catalog-summary-card-link" href={`#${categoryId(item)}`} key={item} scroll>
              <strong>{item}</strong>
              <span>{formations.filter((formation) => formation.category === item).length} formations</span>
            </Link>
          ))}
        </div>

        <div className="catalog-sections">
          {groupedFormations.map(({ category, formations: categoryFormations }) => (
            <section className="catalog-category-section" id={categoryId(category)} key={category}>
              <div className="catalog-category-heading">
                <h2>{category}</h2>
                <span>{categoryFormations.length} formations</span>
              </div>

              <div className="training-showcase-grid">
                {categoryFormations.map((formation) => (
                  <FormationCard formation={formation} key={formation.slug} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>
    </Section>
  );
}
