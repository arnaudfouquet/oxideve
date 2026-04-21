"use client";

import { FormEvent, useState } from "react";

type Props = {
  defaultFormationSlug?: string;
  defaultSessionId?: string;
};

export function ContactForm({ defaultFormationSlug = "formation-qualipv", defaultSessionId = "sess-qpv-1" }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

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
      <input name="formationSlug" type="hidden" defaultValue={defaultFormationSlug} />
      <input name="sessionId" type="hidden" defaultValue={defaultSessionId} />
      <label>
        Besoin
        <textarea name="message" rows={5} placeholder="Objectif, nombre de stagiaires, besoin de financement, délais..." />
      </label>
      <button className="button button-primary" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Envoi..." : "Réserver un échange"}
      </button>
      {message ? <p className={`form-status ${status}`}>{message}</p> : null}
    </form>
  );
}
