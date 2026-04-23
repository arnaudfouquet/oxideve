import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { TrainingCalendar } from "@/components/TrainingCalendar";
import { getFormations, getSessions } from "@/lib/content";

export const dynamic = "force-dynamic";

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
          <h1>Inscrivez-vous à une formation Oxideve</h1>
          <p>Choisissez une formation, une session disponible et transmettez votre demande. L'équipe Oxideve vous recontacte ensuite pour confirmer l'organisation.</p>
        </div>

        <div className="contact-layout">
          <article className="contact-card">
            <h2>Formulaire d'inscription</h2>
            <p>Utilisez ce formulaire pour réserver une place ou demander des informations complémentaires sur une session.</p>
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
            <p>Voici les créneaux actuellement ouverts pour vous aider à choisir une date adaptée.</p>
            <TrainingCalendar formations={formations} sessions={sessions.slice(0, 5)} compact />
          </article>
        </div>
      </div>
    </section>
  );
}