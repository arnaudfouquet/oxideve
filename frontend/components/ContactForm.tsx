"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Formation, Session } from "../../shared/types";

type Props = {
  defaultFormationSlug?: string;
  defaultSessionId?: string;
  formations?: Formation[];
  sessions?: Session[];
  showSelectors?: boolean;
  submitLabel?: string;
};

export function ContactForm({
  defaultFormationSlug = "formation-qualipv",
  defaultSessionId = "sess-qpv-1",
  formations = [],
  sessions = [],
  showSelectors = false,
  submitLabel = "Réserver un échange",
}: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [selectedFormationSlug, setSelectedFormationSlug] = useState(defaultFormationSlug);
  const [selectedSessionId, setSelectedSessionId] = useState(defaultSessionId);

  const availableSessions = useMemo(
    () => sessions.filter((session) => session.formationSlug === selectedFormationSlug),
    [selectedFormationSlug, sessions]
  );

  useEffect(() => {
    if (!showSelectors) {
      return;
    }

    if (availableSessions.some((session) => session.id === selectedSessionId)) {
      return;
    }

    setSelectedSessionId(availableSessions[0]?.id || "");
  }, [availableSessions, selectedSessionId, showSelectors]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch("/api/inscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus("error");
      setMessage(data?.error || "Impossible d'envoyer la demande pour le moment.");
      return;
    }

    event.currentTarget.reset();
    if (showSelectors) {
      setSelectedFormationSlug(defaultFormationSlug || formations[0]?.slug || "");
      setSelectedSessionId(defaultSessionId || sessions[0]?.id || "");
    }
    setStatus("success");
    setMessage("Votre demande a bien été enregistrée. L'équipe Oxideve vous recontacte rapidement.");
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Société
          <input name="company" type="text" required placeholder="Nom de l'entreprise" />
        </label>
        <label>
          Contact
          <input name="contactName" type="text" required placeholder="Nom et prénom" />
        </label>
        <label>
          Email
          <input name="email" type="email" required placeholder="contact@entreprise.fr" />
        </label>
        <label>
          Téléphone
          <input name="phone" type="tel" required placeholder="06 00 00 00 00" />
        </label>
      </div>
      {showSelectors ? (
        <div className="form-grid">
          <label>
            Formation
            <select
              name="formationSlug"
              value={selectedFormationSlug}
              onChange={(event) => setSelectedFormationSlug(event.target.value)}
              required
            >
              {formations.map((formation) => (
                <option key={formation.slug} value={formation.slug}>
                  {formation.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Session
            <select name="sessionId" value={selectedSessionId} onChange={(event) => setSelectedSessionId(event.target.value)} required>
              {availableSessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.city} - {new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(session.startDate))}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <>
          <input name="formationSlug" type="hidden" value={selectedFormationSlug} readOnly />
          <input name="sessionId" type="hidden" value={selectedSessionId} readOnly />
        </>
      )}
      <label>
        Besoin
        <textarea name="message" rows={5} placeholder="Objectif, nombre de stagiaires, besoin de financement, délais..." />
      </label>
      <button className="button button-primary" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Envoi..." : submitLabel}
      </button>
      {message ? <p className={`form-status ${status}`}>{message}</p> : null}
    </form>
  );
}
