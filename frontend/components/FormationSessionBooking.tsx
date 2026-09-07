"use client";

import { useRef, useState } from "react";
import type { Formation, Session } from "../../shared/types";
import { ContactForm } from "@/components/ContactForm";
import { SessionCard } from "@/components/SessionCard";
import { Title } from "@/components/ui";

type Props = {
  formation: Formation;
  sessions: Session[];
};

function formatDateRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  return `${formatter.format(new Date(startDate))} au ${formatter.format(new Date(endDate))}`;
}

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

  return (
    <div className="session-booking-stack">
      {sessions.length > 1 ? (
        <div>
          <Title eyebrow="Sessions" title="Sessions disponibles" />
          <div className="session-grid">
            {sessions.map((session) => (
              <SessionCard
                formation={formation}
                isSelected={session.id === selectedSessionId}
                key={session.id}
                onSelect={handleSelectSession}
                session={session}
              />
            ))}
          </div>
        </div>
      ) : null}
      <div className="contact-card contact-card-form" ref={formRef}>
        <Title eyebrow="Inscription" title={`Préparer votre inscription à ${formation.shortTitle}`} />
        {selectedSession ? (
          <p className="contact-card-session-summary">
            Session choisie : <strong>{selectedSession.city}</strong>, du {formatDateRange(selectedSession.startDate, selectedSession.endDate)}
          </p>
        ) : null}
        <ContactForm defaultFormationSlug={formation.slug} selectedSessionId={selectedSessionId} />
      </div>
    </div>
  );
}
