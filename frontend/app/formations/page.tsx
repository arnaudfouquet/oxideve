import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { FormationCatalog } from "@/components/FormationCatalog";
import { getFormations } from "@/lib/content";

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

  return (
    <section className="catalog-page">
      <Container>
        <div className="catalog-intro">
          <h1>
            Nos formations <em>professionnelles</em>
          </h1>
          <p>Trouvez la formation adaptée à votre activité, à vos objectifs et à vos besoins parmi l&apos;ensemble de nos domaines.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="catalog-intro-illustration" alt="" src="/assets/home/illustration-home.png" />
        </div>

        <FormationCatalog categories={categories} durations={durations} formations={formations} />
      </Container>
    </section>
  );
}
