"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Formation, Session } from "../../shared/types";
import { Title } from "@/components/ui";

type Props = {
  formations: Formation[];
  sessions: Session[];
  defaultFormationSlug?: string;
  defaultSessionId?: string;
  defaultSessionDates?: string;
  defaultSessionLocation?: string;
};

export function BulletinInscriptionForm({
  formations,
  sessions,
  defaultFormationSlug = "",
  defaultSessionId = "",
  defaultSessionDates = "",
  defaultSessionLocation = "",
}: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [quizSlug, setQuizSlug] = useState<string | null>(null);
  const [bulletinId, setBulletinId] = useState<string | null>(null);
  const [selectedFormationSlug, setSelectedFormationSlug] = useState(defaultFormationSlug);
  const [hasDisability, setHasDisability] = useState(false);

  const isFormationLocked = Boolean(defaultFormationSlug);
  const isSessionLocked = Boolean(defaultSessionId);

  const categories = useMemo(
    () => Array.from(new Set(formations.map((formation) => formation.category))),
    [formations],
  );

  const selectedFormation = formations.find((formation) => formation.slug === selectedFormationSlug);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = Object.fromEntries(formData.entries());
    payload.hasDisability = formData.get("hasDisability") === "on";

    const response = await fetch("/api/bulletin-inscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus("error");
      setMessage(data?.error || "Impossible d'envoyer le bulletin d'inscription pour le moment.");
      return;
    }

    const data = (await response.json().catch(() => null)) as {
      data?: { id?: string; quizSlug?: string | null };
    } | null;
    setQuizSlug(data?.data?.quizSlug || null);
    setBulletinId(data?.data?.id || null);
    event.currentTarget.reset();
    setHasDisability(false);
    setStatus("success");
    setMessage("Votre bulletin d'inscription a bien été enregistré. Un email de confirmation avec le récapitulatif vous a été envoyé.");
  }

  if (status === "success") {
    return (
      <div className="bulletin-success">
        <Title eyebrow="Merci" title="Bulletin d'inscription enregistré" />
        <p>{message}</p>
        {quizSlug ? (
          <p>
            Prochaine étape : l&apos;apprenant peut réaliser dès maintenant son{" "}
            <a
              className="ui-button ui-button-primary"
              href={`/auto-evaluation/${quizSlug}${bulletinId ? `?bulletinInscriptionId=${bulletinId}` : ""}`}
            >
              auto-évaluation
            </a>
            .
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form className="contact-form bulletin-form" onSubmit={handleSubmit}>
      <section className="bulletin-form-block">
        <Title as="h2" eyebrow="1. Formation" title="Formation choisie" />
        <div className="form-grid">
          <label>
            Formation
            <select
              className="ui-field"
              name="formationSlug"
              value={selectedFormationSlug}
              onChange={(event) => setSelectedFormationSlug(event.target.value)}
              disabled={isFormationLocked}
              required
            >
              <option disabled value="">
                Choisir une formation
              </option>
              {categories.map((category) => (
                <optgroup key={category} label={category}>
                  {formations
                    .filter((formation) => formation.category === category)
                    .map((formation) => (
                      <option key={formation.slug} value={formation.slug}>
                        {formation.title}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            {isFormationLocked ? <input type="hidden" name="formationSlug" value={selectedFormationSlug} /> : null}
          </label>
          <label>
            Comment avez-vous connu la formation ?
            <input className="ui-field" name="source" type="text" placeholder="Site internet, distributeur, bouche-à-oreille..." />
          </label>
          <label>
            Dates de la session
            <input
              className="ui-field"
              name="sessionDates"
              type="text"
              defaultValue={defaultSessionDates}
              readOnly={isSessionLocked}
              placeholder="Ex : 12 au 14 mars 2026"
            />
          </label>
          <label>
            Lieu de la session
            <input
              className="ui-field"
              name="sessionLocation"
              type="text"
              defaultValue={defaultSessionLocation || selectedFormation?.location || ""}
              readOnly={isSessionLocked}
              placeholder="Ville / lieu de la formation"
            />
          </label>
          <label>
            Nom du distributeur (optionnel)
            <input className="ui-field" name="distributorName" type="text" placeholder="Nom du distributeur, si applicable" />
          </label>
        </div>
        {isSessionLocked ? <input type="hidden" name="sessionId" value={defaultSessionId} /> : null}
      </section>

      <section className="bulletin-form-block">
        <Title as="h2" eyebrow="2. Commanditaire" title="Commanditaire de la formation" />
        <div className="form-grid">
          <label>
            Raison sociale
            <input className="ui-field" name="companyName" type="text" required placeholder="Nom de l'entreprise" />
          </label>
          <label>
            SIRET
            <input className="ui-field" name="siret" type="text" placeholder="14 chiffres" />
          </label>
          <label>
            Code APE
            <input className="ui-field" name="apeCode" type="text" placeholder="Ex : 4321A" />
          </label>
          <label>
            Adresse de l&apos;entreprise
            <input className="ui-field" name="companyAddress" type="text" placeholder="Adresse complète" />
          </label>
          <label>
            Prénom et nom du commanditaire
            <input className="ui-field" name="sponsorFullName" type="text" required placeholder="Prénom Nom" />
          </label>
          <label>
            Fonction
            <input className="ui-field" name="sponsorRole" type="text" placeholder="Fonction dans l'entreprise" />
          </label>
          <label>
            Email
            <input className="ui-field" name="sponsorEmail" type="email" required placeholder="contact@entreprise.fr" />
          </label>
          <label>
            Téléphone portable
            <input className="ui-field" name="sponsorPhone" type="tel" required placeholder="06 00 00 00 00" />
          </label>
        </div>
      </section>

      <section className="bulletin-form-block">
        <Title as="h2" eyebrow="3. Apprenant" title="Informations sur l'apprenant" />
        <div className="form-grid">
          <label>
            Prénom et nom
            <input className="ui-field" name="learnerFullName" type="text" required placeholder="Prénom Nom" />
          </label>
          <label>
            Fonction
            <input className="ui-field" name="learnerRole" type="text" placeholder="Fonction dans l'entreprise" />
          </label>
          <label>
            Téléphone portable
            <input className="ui-field" name="learnerPhone" type="tel" placeholder="06 00 00 00 00" />
          </label>
          <label>
            Date de naissance
            <input className="ui-field" name="learnerBirthDate" type="date" />
          </label>
        </div>
        <label className="bulletin-checkbox">
          <input
            name="hasDisability"
            type="checkbox"
            checked={hasDisability}
            onChange={(event) => setHasDisability(event.target.checked)}
          />
          Situation de handicap à signaler
        </label>
        {hasDisability ? (
          <label>
            Précisions sur la situation de handicap
            <textarea
              className="ui-field bulletin-form-textarea"
              name="disabilityDetails"
              rows={4}
              placeholder="Merci de préciser les besoins d'adaptation éventuels"
            />
          </label>
        ) : null}
      </section>

      <button className="ui-button ui-button-primary" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Envoi..." : "Envoyer le bulletin d'inscription"}
      </button>
      {message && status === "error" ? <p className="form-status error">{message}</p> : null}
    </form>
  );
}
