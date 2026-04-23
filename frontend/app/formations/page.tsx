import type { Metadata } from "next";
import { FormationCard } from "@/components/FormationCard";
import { Container, Input, Section, Select, Title } from "@/components/ui";
import { getFormations } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogue des formations",
  description: "Découvrez les formations Oxideve en photovoltaïque, pompe à chaleur, IRVE, sécurité au travail et bureautique.",
};

type Props = {
  searchParams?: Promise<{ q?: string; category?: string }>;
};

function normalizeParam(value?: string) {
  return value?.trim() || "";
}

export default async function FormationsPage({ searchParams }: Props) {
  const formations = await getFormations();
  const params = searchParams ? await searchParams : {};
  const query = normalizeParam(params.q).toLowerCase();
  const category = normalizeParam(params.category);
  const categories = Array.from(new Set(formations.map((formation) => formation.category))).sort((left, right) =>
    left.localeCompare(right, "fr")
  );
  const filteredFormations = formations.filter((formation) => {
    const matchesCategory = !category || formation.category === category;
    const haystack = [formation.title, formation.shortTitle, formation.category, formation.summary, formation.audience].join(" ").toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    return matchesCategory && matchesQuery;
  });

  return (
    <Section>
      <Container>
        <Title
          as="h1"
          eyebrow="Catalogue"
          title="Découvrez nos formations bâtiment"
          description="Filtrez par famille de métier ou par besoin, puis ouvrez chaque fiche pour retrouver le programme, les objectifs, les sessions disponibles et les informations pratiques."
        />

        <form className="catalog-filter-bar" method="get">
          <Input defaultValue={query} label="Recherche" name="q" placeholder="QualiPV, IRVE, maintenance..." />
          <Select defaultValue={category} label="Categorie" name="category">
            <option value="">Toutes les categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <button className="ui-button ui-button-primary catalog-submit" type="submit">
            Filtrer
          </button>
        </form>

        <div className="catalog-summary-row">
          {categories.map((item) => (
            <div className="catalog-summary-card" key={item}>
              <strong>{item}</strong>
              <span>{formations.filter((formation) => formation.category === item).length} parcours</span>
            </div>
          ))}
        </div>

        <div className="training-showcase-grid">
          {filteredFormations.map((formation) => (
            <FormationCard formation={formation} key={formation.slug} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
