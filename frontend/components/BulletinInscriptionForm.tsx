"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Formation, Session } from "../../shared/types";
import { formatDateRange } from "@/lib/dates";

type Props = {
  formations: Formation[];
  sessions: Session[];
  defaultFormationSlug?: string;
  defaultSessionId?: string;
};

const sourceOptions = ["Bouche à oreille", "Moteur de recherche", "Votre distributeur", "Nouvel Horizon", "Réseaux sociaux"];
const distributorOptions = ["Solipac", "Tereva", "Nouvel Horizon"];

export function BulletinInscriptionForm({ formations, sessions, defaultFormationSlug = "", defaultSessionId = "" }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [quizSlug, setQuizSlug] = useState<string | null>(null);
  const [bulletinId, setBulletinId] = useState<string | null>(null);
  const [selectedFormationSlug, setSelectedFormationSlug] = useState(defaultFormationSlug);
  const [selectedSessionId, setSelectedSessionId] = useState(defaultSessionId);
  const [source, setSource] = useState("");
  const [distributorName, setDistributorName] = useState("");
  const [hasDisability, setHasDisability] = useState(false);

  const isFormationLocked = Boolean(defaultFormationSlug);

  const categories = useMemo(
    () => Array.from(new Set(formations.map((formation) => formation.category))),
    [formations],
  );

  const formationSessions = useMemo(
    () => sessions.filter((session) => session.formationSlug === selectedFormationSlug),
    [sessions, selectedFormationSlug],
  );

  const selectedSession =
    formationSessions.find((session) => session.id === selectedSessionId) || formationSessions[0];

  function handleFormationChange(slug: string) {
    setSelectedFormationSlug(slug);
    const nextSessions = sessions.filter((session) => session.formationSlug === slug);
    setSelectedSessionId(nextSessions[0]?.id || "");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload: Record<string, unknown> = Object.fromEntries(formData.entries());
    payload.hasDisability = formData.get("hasDisability") === "on";
    payload.sessionId = selectedSession?.id || "";
    payload.sessionDates = selectedSession ? formatDateRange(selectedSession.startDate, selectedSession.endDate) : "";
    payload.sessionLocation = selectedSession?.city || "";

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
    form.reset();
    setHasDisability(false);
    setSource("");
    setDistributorName("");
    setStatus("success");
    setMessage("Votre bulletin d'inscription a bien été enregistré. Un email de confirmation avec le récapitulatif vous a été envoyé.");
  }

  if (status === "success") {
    return (
      <div className="bulletin-success">
        <h2 className="bulletin-form-block-title">
          <span>✓</span> Bulletin d&apos;inscription enregistré
        </h2>
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
        <h2 className="bulletin-form-block-title">
          <span>1</span> Formation
        </h2>
        <div className="form-grid">
          <label>
            Formation
            <select
              className="ui-field"
              name="formationSlug"
              value={selectedFormationSlug}
              onChange={(event) => handleFormationChange(event.target.value)}
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
          {formationSessions.length > 1 ? (
            <label>
              Session
              <select
                className="ui-field"
                value={selectedSessionId}
                onChange={(event) => setSelectedSessionId(event.target.value)}
                required
              >
                <option disabled value="">
                  Choisir une session
                </option>
                {formationSessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.city} - {formatDateRange(session.startDate, session.endDate)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label>
                Dates de la session
                <input
                  className="ui-field"
                  type="text"
                  readOnly
                  value={selectedSession ? formatDateRange(selectedSession.startDate, selectedSession.endDate) : ""}
                  placeholder="Choisissez d'abord une formation"
                />
              </label>
              <label>
                Lieu de la session
                <input
                  className="ui-field"
                  type="text"
                  readOnly
                  value={selectedSession?.city || ""}
                  placeholder="Choisissez d'abord une formation"
                />
              </label>
            </>
          )}
          <label>
            Comment avez-vous connu la formation ?
            <select className="ui-field" name="source" value={source} onChange={(event) => setSource(event.target.value)}>
              <option value="">Sélectionner</option>
              {sourceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Nom du distributeur (optionnel)
            <select
              className="ui-field"
              name="distributorName"
              value={distributorName}
              onChange={(event) => setDistributorName(event.target.value)}
            >
              <option value="">Non applicable</option>
              {distributorOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="bulletin-form-block">
        <h2 className="bulletin-form-block-title">
          <span>2</span> Commanditaire de la formation
        </h2>
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
        <h2 className="bulletin-form-block-title">
          <span>3</span> Apprenant
        </h2>
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
