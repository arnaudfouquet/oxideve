import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { FormationCatalog } from "@/components/FormationCatalog";
import { getFormations, getSessions } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogue des formations",
  description:
    "Trouvez la formation adaptée à votre activité, à vos objectifs et à vos besoins parmi l'ensemble de nos domaines.",
};

export default async function FormationsPage() {
  const formations = await getFormations();
  const categories = Array.from(new Set(formations.map((formation) => formation.category))).sort((left, right) =>
    left.localeCompare(right, "fr"),
  );
  const durations = Array.from(new Set(formations.map((formation) => formation.duration))).sort((left, right) =>
    left.localeCompare(right, "fr", { numeric: true }),
  );

  // Villes réellement programmées, par formation : alimente le filtre Ville.
  const sessions = await getSessions();
  const citiesByFormation = sessions.reduce<Record<string, string[]>>((accumulator, session) => {
    const cities = accumulator[session.formationSlug] || [];
    if (!cities.includes(session.city)) cities.push(session.city);
    accumulator[session.formationSlug] = cities;
    return accumulator;
  }, {});

  // Prochaines dates à venir, par formation, pour les afficher sur les tuiles.
  const today = new Date().toISOString().slice(0, 10);
  const sessionsByFormation = sessions
    .filter((session) => session.endDate >= today)
    .sort((left, right) => left.startDate.localeCompare(right.startDate))
    .reduce<Record<string, { startDate: string; endDate: string; city: string }[]>>((accumulator, session) => {
      const list = accumulator[session.formationSlug] || [];
      list.push({ startDate: session.startDate, endDate: session.endDate, city: session.city });
      accumulator[session.formationSlug] = list;
      return accumulator;
    }, {});

  return (
    <section className="catalog-page">
      <Container>
        <div className="catalog-intro">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="catalog-intro-illustration" alt="" src="/assets/formations/illustration-2.png" />
          <div className="catalog-intro-copy">
            <h1>
              Nos formations
              <br />
              <em>professionnelles</em>
            </h1>
          </div>
        </div>

        <FormationCatalog
          categories={categories}
          citiesByFormation={citiesByFormation}
          sessionsByFormation={sessionsByFormation}
          durations={durations}
          formations={formations}
        />
      </Container>
    </section>
  );
}
