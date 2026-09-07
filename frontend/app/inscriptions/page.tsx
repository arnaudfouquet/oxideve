import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { getFormations, getSessions } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inscrivez-vous",
  description: "Sélectionnez une formation et une session Oxideve, puis envoyez votre demande d'inscription globale.",
};

type Props = {
  searchParams?: Promise<{ formationSlug?: string; sessionId?: string }>;
};

export default async function InscriptionsPage({ searchParams }: Props) {
  const [formations, sessions] = await Promise.all([getFormations(), getSessions()]);
  const params = searchParams ? await searchParams : {};
  const defaultFormationSlug =
    params?.formationSlug && formations.some((formation) => formation.slug === params.formationSlug)
      ? params.formationSlug
      : "";
  const scopedSessions = sessions.filter((session) => session.formationSlug === defaultFormationSlug);
  const defaultSessionId =
    params?.sessionId && scopedSessions.some((session) => session.id === params.sessionId) ? params.sessionId : "";

  return (
    <section className="section">
      <div className="container">
        <div className="page-title">
          <span className="eyebrow">Inscrivez-vous</span>
          <h1>Inscrivez-vous à une formation Oxideve</h1>
          <p>Choisissez une formation, une session disponible et transmettez votre demande. L'équipe Oxideve vous recontacte ensuite pour confirmer l'organisation.</p>
        </div>

        <article className="contact-card contact-card-standalone">
          <ContactForm
            formations={formations}
            sessions={sessions}
            showSelectors
            defaultFormationSlug={defaultFormationSlug}
            defaultSessionId={defaultSessionId}
            submitLabel="Envoyer l'inscription"
          />
        </article>
      </div>
    </section>
  );
}