import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { TrainingCalendar } from "@/components/TrainingCalendar";
import { getFormations, getSessions } from "@/lib/content";

export const metadata: Metadata = {
  title: "Inscrivez-vous",
  description: "Sélectionnez une formation et une session Oxideve, puis envoyez votre demande d'inscription globale.",
};

export default async function InscriptionsPage() {
  const [formations, sessions] = await Promise.all([getFormations(), getSessions()]);

  return (
    <section className="section">
      <div className="container">
        <div className="page-title">
          <span className="eyebrow">Inscrivez-vous</span>
          <h1>Centralisez vos inscriptions inter, intra et vos demandes de planification.</h1>
          <p>Choisissez la formation, la prochaine session disponible et indiquez vos contraintes. L'équipe Oxideve valide ensuite la place, le financement et l'organisation.</p>
        </div>

        <div className="contact-layout">
          <article className="contact-card">
            <h2>Formulaire global d'inscription</h2>
            <p>Le formulaire est rattaché directement au catalogue et aux sessions ouvertes. Il peut être utilisé pour une personne ou pour une équipe complète.</p>
            <ContactForm
              formations={formations}
              sessions={sessions}
              showSelectors
              defaultFormationSlug={formations[0]?.slug}
              defaultSessionId={sessions[0]?.id}
              submitLabel="Envoyer l'inscription"
            />
          </article>
          <article className="contact-card">
            <h2>Sessions disponibles</h2>
            <p>Voici les créneaux actuellement commercialisables pour accélérer votre choix.</p>
            <TrainingCalendar formations={formations} sessions={sessions.slice(0, 5)} compact />
          </article>
        </div>
      </div>
    </section>
  );
}