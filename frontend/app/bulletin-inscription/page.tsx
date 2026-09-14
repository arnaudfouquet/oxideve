import type { Metadata } from "next";
import { BulletinInscriptionForm } from "@/components/BulletinInscriptionForm";
import { getFormations, getSessions } from "@/lib/content";
import { formatDateRange } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bulletin d'inscription",
  description: "Complétez le bulletin d'inscription détaillé pour finaliser votre demande de formation Oxideve.",
};

type Props = {
  searchParams?: Promise<{ formationSlug?: string; sessionId?: string }>;
};

export default async function BulletinInscriptionPage({ searchParams }: Props) {
  const [formations, sessions] = await Promise.all([getFormations(), getSessions()]);
  const params = searchParams ? await searchParams : {};

  const defaultFormationSlug =
    params?.formationSlug && formations.some((formation) => formation.slug === params.formationSlug)
      ? params.formationSlug
      : "";

  const scopedSessions = sessions.filter((session) => session.formationSlug === defaultFormationSlug);
  const defaultSession =
    params?.sessionId && scopedSessions.some((session) => session.id === params.sessionId)
      ? scopedSessions.find((session) => session.id === params.sessionId)
      : undefined;

  const defaultSessionDates = defaultSession ? formatDateRange(defaultSession.startDate, defaultSession.endDate) : "";
  const defaultSessionLocation = defaultSession?.city || "";

  return (
    <section className="section">
      <div className="container">
        <div className="page-title">
          <span className="eyebrow">Bulletin d'inscription</span>
          <h1>Bulletin d'inscription à une formation Oxideve</h1>
          <p>
            Ce formulaire complet permet d'enregistrer officiellement l'inscription du commanditaire et de l'apprenant.
            Un récapitulatif vous sera envoyé par email dès la validation.
          </p>
        </div>

        <article className="contact-card contact-card-standalone">
          <BulletinInscriptionForm
            formations={formations}
            sessions={sessions}
            defaultFormationSlug={defaultFormationSlug}
            defaultSessionId={defaultSession?.id || ""}
            defaultSessionDates={defaultSessionDates}
            defaultSessionLocation={defaultSessionLocation}
          />
        </article>
      </div>
    </section>
  );
}
