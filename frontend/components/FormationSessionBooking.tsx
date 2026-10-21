"use client";

import { useRef, useState } from "react";
import type { Formation, Session } from "../../shared/types";
import { ContactForm } from "@/components/ContactForm";
import { SessionCard } from "@/components/SessionCard";
import { formatDateRange } from "@/lib/dates";

type Props = {
  formation: Formation;
  sessions: Session[];
};

export function FormationSessionBooking({ formation, sessions }: Props) {
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id || "");
  const formRef = useRef<HTMLDivElement>(null);
  const selectedSession = sessions.find((session) => session.id === selectedSessionId);

  function handleSelectSession(sessionId: string) {
    setSelectedSessionId(sessionId);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    const firstField = formRef.current?.querySelector<HTMLInputElement>('input[name="company"]');
    firstField?.focus({ preventScroll: true });
  }

  // Un seul niveau de carte : le titre et le cadre sont portés par la section
  // de la page, on n'en rajoute pas ici.
  return (
    <div className="session-booking-stack">
      <p className="fd-signup-note">
        {sessions.length
          ? "Ceci constitue la première étape de votre inscription. Dès réception de votre demande, vous serez contactés pour valider celle-ci."
          : "Dès réception de votre demande, notre équipe vous recontacte pour organiser une session adaptée à vos disponibilités."}
      </p>

      {/* Sans date programmée, un formulaire d'inscription classique laissait
          croire à une erreur : on explique la démarche et on demande les
          disponibilités, information utile pour planifier la session. */}
      {sessions.length ? null : (
        <div className="fd-signup-nodate">
          <strong>Pas encore de date programmée pour cette formation</strong>
          <p>
            Cette formation est organisée à la demande, en inter-entreprises ou directement dans vos locaux.
            Indiquez vos disponibilités souhaitées dans le message ci-dessous : nous vous proposons une session
            sous 48 heures ouvrées.
          </p>
        </div>
      )}

      {sessions.length ? (
        <div className="fd-signup-sessions">
          <span className="fd-signup-subtitle">
            {sessions.length > 1 ? "Choisissez votre session" : "Session programmée"}
          </span>
          <div className="session-grid">
            {sessions.map((session) => (
              <SessionCard
                formation={formation}
                hideFormationTitle
                isSelected={session.id === selectedSessionId}
                key={session.id}
                onSelect={handleSelectSession}
                session={session}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="fd-signup-form" ref={formRef}>
        {selectedSession ? (
          <p className="contact-card-session-summary">
            Session choisie : <strong>{selectedSession.city}</strong>
            {/* « du » n'a de sens que pour une période, pas pour une journée. */}
            {selectedSession.startDate === selectedSession.endDate ? ", le " : ", du "}
            {formatDateRange(selectedSession.startDate, selectedSession.endDate)}
          </p>
        ) : null}
        <ContactForm
          askAvailability={!sessions.length}
          defaultFormationSlug={formation.slug}
          selectedSessionId={selectedSessionId}
        />
      </div>
    </div>
  );
}
