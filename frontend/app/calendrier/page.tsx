import type { Metadata } from "next";
import Link from "next/link";
import { TrainingCalendar } from "@/components/TrainingCalendar";
import { getFormations, getSessions } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calendrier des sessions",
  description: "Visualisez les prochaines sessions de formation Oxideve et les places disponibles.",
};

export default async function CalendrierPage() {
  const sessions = await getSessions();
  const formations = await getFormations();

  return (
    <section className="section">
      <div className="container">
        <div className="page-title">
          <span className="eyebrow">Planning</span>
          <h1>Calendrier des prochaines sessions</h1>
          <p>Visualisez rapidement les prochaines dates, le format de formation et les places encore disponibles.</p>
        </div>

        <TrainingCalendar formations={formations} sessions={sessions} />

        <div className="section grid-2">
          <article className="card card-highlight">
            <h2>Besoin d'une autre date ?</h2>
            <p>Si aucune session ne correspond à votre agenda, contactez Oxideve pour étudier une nouvelle ouverture.</p>
          </article>
          <article className="card">
            <h2>Prêt à réserver ?</h2>
            <p>La page d'inscription vous permet d'envoyer votre demande en quelques étapes.</p>
            <div className="cta-row">
              <Link href="/inscriptions" className="button button-primary">
                Aller à l'inscription
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
