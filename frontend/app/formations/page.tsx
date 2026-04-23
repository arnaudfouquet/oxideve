import type { Metadata } from "next";
import { FormationCard } from "@/components/FormationCard";
import { formatDateRange, getSessions } from "@/lib/content";
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

const categoryContent: Record<string, { title: string; description: string; points: string[] }> = {
  "Pompes à chaleur": {
    title: "Formations pompe à chaleur pour installateurs et techniciens CVC",
    description:
      "Travaillez le dimensionnement, la mise en service, la maintenance et les réglages terrain des PAC air / eau avec une lecture claire des besoins chantier.",
    points: [
      "Parcours QualiPAC et montée en compétence constructeur",
      "Formats courts pour vos équipes terrain et mise en service",
      "Sessions visibles immédiatement avec lieux et places restantes",
    ],
  },
  Photovoltaïque: {
    title: "Formations photovoltaïques pour la pose, le raccordement et l'administratif",
    description:
      "Retrouvez les parcours QualiPV, les modules haute puissance, les démarches administratives et les formations commerciales liées au solaire.",
    points: [
      "Parcours techniques, réglementaires et commerciaux",
      "Vision chantier, raccordement et qualification",
      "Ouvertures de sessions partagées avec le calendrier global",
    ],
  },
  "Sécurité au travail": {
    title: "Formations sécurité pour les équipes bâtiment et maintenance",
    description:
      "Préparez vos équipes aux interventions en hauteur et au risque électrique avec des formats courts et directement applicables sur chantier.",
    points: [
      "Prévention terrain et mise en conformité",
      "Sessions ciblées pour les équipes opérationnelles",
      "Lecture claire des prochaines dates disponibles",
    ],
  },
};

function normalizeParam(value?: string) {
  return value?.trim() || "";
}

export default async function FormationsPage({ searchParams }: Props) {
  const [formations, sessions] = await Promise.all([getFormations(), getSessions()]);
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
  const filteredSessions = sessions
    .filter((session) => {
      const formation = formations.find((item) => item.slug === session.formationSlug);
      return formation && (!category || formation.category === category);
    })
    .slice(0, 3);
  const categoryConfig = category ? categoryContent[category] : undefined;
  const pageTitle = categoryConfig?.title || "Découvrez nos formations bâtiment";
  const pageDescription =
    categoryConfig?.description ||
    "Filtrez par famille de métier ou par besoin, puis ouvrez chaque fiche pour retrouver le programme, les objectifs, les sessions disponibles et les informations pratiques.";

  return (
    <Section>
      <Container>
        <Title
          as="h1"
          eyebrow="Catalogue"
          title={pageTitle}
          description={pageDescription}
        />

        {categoryConfig ? (
          <div className="catalog-hero-shell">
            <div className="catalog-hero-copy">
              <span className="section-kicker">{category}</span>
              <h2>{categoryConfig.title}</h2>
              <p>{categoryConfig.description}</p>
              <ul className="detail-list">
                {categoryConfig.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>

            <aside className="catalog-hero-side">
              <div className="catalog-summary-card">
                <strong>{filteredFormations.length}</strong>
                <span>formations dans cette famille</span>
              </div>
              <div className="catalog-summary-card">
                <strong>{filteredSessions.length}</strong>
                <span>prochaines sessions visibles</span>
              </div>
              <div className="catalog-next-sessions">
                {filteredSessions.map((session) => {
                  const formation = formations.find((item) => item.slug === session.formationSlug);
                  return (
                    <article className="catalog-next-session-item" key={session.id}>
                      <strong>{formation?.shortTitle || session.formationSlug}</strong>
                      <span>{formatDateRange(session.startDate, session.endDate)}</span>
                      <span>{session.city} · {session.seatsLeft} places</span>
                    </article>
                  );
                })}
              </div>
            </aside>
          </div>
        ) : null}

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

        {filteredFormations.length === 0 ? (
          <div className="catalog-empty-state">
            <h2>Aucune formation ne correspond à ce filtre</h2>
            <p>Essayez une autre catégorie ou élargissez la recherche pour afficher davantage de parcours.</p>
          </div>
        ) : null}

        <div className="training-showcase-grid">
          {filteredFormations.map((formation) => (
            <FormationCard formation={formation} key={formation.slug} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
