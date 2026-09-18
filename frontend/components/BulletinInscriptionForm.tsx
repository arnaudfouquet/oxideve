"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Formation, LearnerInput, Session } from "../../shared/types";
import { formatDateRange } from "@/lib/dates";

function createEmptyLearner(): LearnerInput {
  return { fullName: "", email: "", role: "", phone: "", birthDate: "", hasDisability: false, disabilityDetails: "" };
}

type Props = {
  formations: Formation[];
  sessions: Session[];
  defaultFormationSlug?: string;
  defaultSessionId?: string;
  defaultCompanyName?: string;
  defaultSponsorFullName?: string;
  defaultSponsorEmail?: string;
  defaultSponsorPhone?: string;
};

const sourceOptions = ["Bouche à oreille", "Moteur de recherche", "Votre distributeur", "Nouvel Horizon", "Réseaux sociaux"];
const distributorOptions = ["Solipac", "Tereva", "Nouvel Horizon"];

export function BulletinInscriptionForm({
  formations,
  sessions,
  defaultFormationSlug = "",
  defaultSessionId = "",
  defaultCompanyName = "",
  defaultSponsorFullName = "",
  defaultSponsorEmail = "",
  defaultSponsorPhone = "",
}: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [quizLinks, setQuizLinks] = useState<{ learnerFullName: string; url: string }[]>([]);
  const [selectedFormationSlug, setSelectedFormationSlug] = useState(defaultFormationSlug);
  const [selectedSessionId, setSelectedSessionId] = useState(defaultSessionId);
  const [source, setSource] = useState("");
  const [distributorName, setDistributorName] = useState("");
  const [learners, setLearners] = useState<LearnerInput[]>([createEmptyLearner()]);

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

  function updateLearner(index: number, patch: Partial<LearnerInput>) {
    setLearners((current) => current.map((learner, learnerIndex) => (learnerIndex === index ? { ...learner, ...patch } : learner)));
  }

  function addLearner() {
    setLearners((current) => (current.length < 3 ? [...current, createEmptyLearner()] : current));
  }

  function removeLearner(index: number) {
    setLearners((current) => (current.length > 1 ? current.filter((_, learnerIndex) => learnerIndex !== index) : current));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload: Record<string, unknown> = Object.fromEntries(formData.entries());
    delete payload.hasDisability;
    payload.sessionId = selectedSession?.id || "";
    payload.sessionDates = selectedSession ? formatDateRange(selectedSession.startDate, selectedSession.endDate) : "";
    payload.sessionLocation = selectedSession?.city || "";
    payload.learners = learners;

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
      data?: { id?: string; quizSlug?: string | null; quizLinks?: { learnerFullName: string; url: string }[] };
    } | null;
    setQuizLinks(data?.data?.quizLinks || []);
    form.reset();
    setLearners([createEmptyLearner()]);
    setSource("");
    setDistributorName("");
    setStatus("success");
    setMessage("Votre bulletin d'inscription a bien été enregistré. Un email de confirmation avec le récapitulatif vous a été envoyé.");
  }

  if (status === "success") {
    return (
      <div className="bulletin-success">
        <div className="bulletin-success-icon" aria-hidden="true">✓</div>
        <h2 className="bulletin-success-title">Bulletin d&apos;inscription enregistré</h2>
        <p className="bulletin-success-message">{message}</p>
        {quizLinks.length ? (
          <div className="quiz-result-links">
            <p className="quiz-result-links-intro">
              {quizLinks.length > 1
                ? "Prochaine étape : chaque apprenant peut réaliser dès maintenant son auto-évaluation. Ce lien lui a également été envoyé par email."
                : "Prochaine étape : l'apprenant peut réaliser dès maintenant son auto-évaluation. Ce lien lui a également été envoyé par email."}
            </p>
            {quizLinks.map((link) => (
              <a key={link.url} className="ui-button ui-button-primary" href={link.url}>
                Auto-évaluation de {link.learnerFullName}
              </a>
            ))}
          </div>
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
            <input className="ui-field" name="companyName" type="text" required placeholder="Nom de l'entreprise" defaultValue={defaultCompanyName} />
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
            <input className="ui-field" name="sponsorFullName" type="text" required placeholder="Prénom Nom" defaultValue={defaultSponsorFullName} />
          </label>
          <label>
            Fonction
            <input className="ui-field" name="sponsorRole" type="text" placeholder="Fonction dans l'entreprise" />
          </label>
          <label>
            Email
            <input className="ui-field" name="sponsorEmail" type="email" required placeholder="contact@entreprise.fr" defaultValue={defaultSponsorEmail} />
          </label>
          <label>
            Téléphone portable
            <input className="ui-field" name="sponsorPhone" type="tel" required placeholder="06 00 00 00 00" defaultValue={defaultSponsorPhone} />
          </label>
        </div>
      </section>

      {learners.map((learner, index) => (
        <section className="bulletin-form-block" key={index}>
          <h2 className="bulletin-form-block-title">
            <span>3</span> {learners.length > 1 ? `Apprenant ${index + 1}` : "Apprenant"}
          </h2>
          <div className="form-grid">
            <label>
              Prénom et nom
              <input
                className="ui-field"
                type="text"
                required
                placeholder="Prénom Nom"
                value={learner.fullName}
                onChange={(event) => updateLearner(index, { fullName: event.target.value })}
              />
            </label>
            <label>
              Email
              <input
                className="ui-field"
                type="email"
                required
                placeholder="apprenant@entreprise.fr"
                value={learner.email}
                onChange={(event) => updateLearner(index, { email: event.target.value })}
              />
            </label>
            <label>
              Fonction
              <input
                className="ui-field"
                type="text"
                placeholder="Fonction dans l'entreprise"
                value={learner.role}
                onChange={(event) => updateLearner(index, { role: event.target.value })}
              />
            </label>
            <label>
              Téléphone portable
              <input
                className="ui-field"
                type="tel"
                placeholder="06 00 00 00 00"
                value={learner.phone}
                onChange={(event) => updateLearner(index, { phone: event.target.value })}
              />
            </label>
            <label>
              Date de naissance
              <input
                className="ui-field"
                type="date"
                value={learner.birthDate}
                onChange={(event) => updateLearner(index, { birthDate: event.target.value })}
              />
            </label>
          </div>
          <label className="bulletin-checkbox">
            <input
              type="checkbox"
              checked={learner.hasDisability}
              onChange={(event) => updateLearner(index, { hasDisability: event.target.checked })}
            />
            Situation de handicap à signaler
          </label>
          {learner.hasDisability ? (
            <label>
              Précisions sur la situation de handicap
              <textarea
                className="ui-field bulletin-form-textarea"
                rows={4}
                placeholder="Merci de préciser les besoins d'adaptation éventuels"
                value={learner.disabilityDetails}
                onChange={(event) => updateLearner(index, { disabilityDetails: event.target.value })}
              />
            </label>
          ) : null}
          {learners.length > 1 ? (
            <button
              className="ui-button ui-button-secondary"
              type="button"
              onClick={() => removeLearner(index)}
            >
              Retirer cet apprenant
            </button>
          ) : null}
        </section>
      ))}

      {learners.length < 3 ? (
        <button className="ui-button ui-button-secondary" type="button" onClick={addLearner}>
          + Ajouter un apprenant
        </button>
      ) : null}

      <button className="ui-button ui-button-primary" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Envoi..." : "Envoyer le bulletin d'inscription"}
      </button>
      {message && status === "error" ? <p className="form-status error">{message}</p> : null}
    </form>
  );
}
