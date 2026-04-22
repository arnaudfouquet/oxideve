"use client";

import { useMemo, useState } from "react";
import type { Formation, Registration, Session } from "../../shared/types";

type Props = {
  initialFormations: Formation[];
  initialSessions: Session[];
  initialRegistrations: Registration[];
};

type Draft = {
  slug: string;
  title: string;
  shortTitle: string;
  category: string;
  duration: string;
  durationDetails: string;
  location: string;
  audience: string;
  summary: string;
  description: string;
  benefits: string;
  objectives: string;
  prerequisites: string;
  modalities: string;
  programme: string;
  certification: string;
  price: string;
  priceDetails: string;
  successRate: string;
  handicapPolicy: string;
};

function toDraft(formation?: Formation): Draft {
  if (!formation) {
    return {
      slug: "",
      title: "",
      shortTitle: "",
      category: "",
      duration: "",
      durationDetails: "",
      location: "",
      audience: "",
      summary: "",
      description: "",
      benefits: "",
      objectives: "",
      prerequisites: "",
      modalities: "",
      programme: "",
      certification: "",
      price: "",
      priceDetails: "",
      successRate: "",
      handicapPolicy: "",
    };
  }

  return {
    slug: formation.slug,
    title: formation.title,
    shortTitle: formation.shortTitle,
    category: formation.category,
    duration: formation.duration,
    durationDetails: formation.durationDetails,
    location: formation.location,
    audience: formation.audience,
    summary: formation.summary,
    description: formation.description,
    benefits: formation.benefits.join("\n"),
    objectives: formation.objectives.join("\n"),
    prerequisites: formation.prerequisites.join("\n"),
    modalities: formation.modalities.join("\n"),
    programme: formation.programme.join("\n"),
    certification: formation.certification,
    price: formation.price,
    priceDetails: formation.priceDetails,
    successRate: formation.successRate,
    handicapPolicy: formation.handicapPolicy,
  };
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatRegistrationDate(value: string) {
  const date = new Date(value);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes} UTC`;
}

export function AdminConsole({ initialFormations, initialSessions, initialRegistrations }: Props) {
  const [formations, setFormations] = useState(initialFormations);
  const [draft, setDraft] = useState<Draft>(toDraft(initialFormations[0]));
  const [editingSlug, setEditingSlug] = useState(initialFormations[0]?.slug || "");
  const [status, setStatus] = useState<string>("");
  const [statusTone, setStatusTone] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);

  const registrationsByFormation = useMemo(() => {
    return initialRegistrations.reduce<Record<string, number>>((accumulator, registration) => {
      accumulator[registration.formationSlug] = (accumulator[registration.formationSlug] || 0) + 1;
      return accumulator;
    }, {});
  }, [initialRegistrations]);

  function selectFormation(slug: string) {
    const formation = formations.find((item) => item.slug === slug);
    setEditingSlug(slug);
    setDraft(toDraft(formation));
    setStatus("");
  }

  function handleChange(field: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    const payload = {
      slug: draft.slug.trim(),
      title: draft.title.trim(),
      shortTitle: draft.shortTitle.trim(),
      category: draft.category.trim(),
      duration: draft.duration.trim(),
      durationDetails: draft.durationDetails.trim(),
      location: draft.location.trim(),
      audience: draft.audience.trim(),
      summary: draft.summary.trim(),
      description: draft.description.trim(),
      benefits: splitLines(draft.benefits),
      objectives: splitLines(draft.objectives),
      prerequisites: splitLines(draft.prerequisites),
      modalities: splitLines(draft.modalities),
      programme: splitLines(draft.programme),
      certification: draft.certification.trim(),
      price: draft.price.trim(),
      priceDetails: draft.priceDetails.trim(),
      successRate: draft.successRate.trim(),
      handicapPolicy: draft.handicapPolicy.trim(),
    };

    const isEditing = Boolean(editingSlug);
    const response = await fetch(isEditing ? `/api/admin/formations/${editingSlug}` : "/api/admin/formations", {
      method: isEditing ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(isEditing ? { ...payload, slug: undefined } : payload),
    });

    const result = (await response.json().catch(() => null)) as { data?: Formation; error?: string; message?: string } | null;

    if (!response.ok || !result?.data) {
      setSaving(false);
      setStatusTone("error");
      setStatus(result?.error || "La sauvegarde a échoué.");
      return;
    }

    const savedFormation = result.data;

    setFormations((current) => {
      const others = current.filter((formation) => formation.slug !== editingSlug && formation.slug !== savedFormation.slug);
      return [...others, savedFormation].sort((left, right) => left.title.localeCompare(right.title, "fr"));
    });
    setEditingSlug(savedFormation.slug);
    setDraft(toDraft(savedFormation));
    setSaving(false);
    setStatusTone("success");
    setStatus(result.message || "Formation enregistrée.");
  }

  return (
    <div className="admin-console">
      <section className="admin-shell">
        <div className="section-heading section-heading-tight">
          <div>
            <span className="eyebrow">Pilotage</span>
            <h2>Vue catalogue et inscriptions</h2>
          </div>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => {
              setEditingSlug("");
              setDraft(toDraft());
              setStatus("");
            }}
          >
            Nouvelle formation
          </button>
        </div>

        <div className="stats-strip">
          <span className="stat-pill">{formations.length} formations</span>
          <span className="stat-pill">{initialSessions.length} sessions</span>
          <span className="stat-pill">{initialRegistrations.length} inscriptions</span>
        </div>

        <div className="admin-list">
          {formations.map((formation) => (
            <button key={formation.slug} type="button" className="admin-list-item" onClick={() => selectFormation(formation.slug)}>
              <strong>{formation.title}</strong>
              <span>{formation.category}</span>
              <span>{registrationsByFormation[formation.slug] || 0} inscriptions</span>
            </button>
          ))}
        </div>
      </section>

      <section className="admin-shell">
        <div className="section-heading section-heading-tight">
          <div>
            <span className="eyebrow">Edition</span>
            <h2>{editingSlug ? "Modifier une formation" : "Créer une formation"}</h2>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="admin-form-section">
            <h3>Identité de la formation</h3>
            <div className="form-grid">
              <label>
                Slug
                <input value={draft.slug} onChange={(event) => handleChange("slug", event.target.value)} disabled={Boolean(editingSlug)} required />
              </label>
              <label>
                Nom complet
                <input value={draft.title} onChange={(event) => handleChange("title", event.target.value)} required />
              </label>
              <label>
                Nom court
                <input value={draft.shortTitle} onChange={(event) => handleChange("shortTitle", event.target.value)} required />
              </label>
              <label>
                Catégorie
                <input value={draft.category} onChange={(event) => handleChange("category", event.target.value)} required />
              </label>
              <label>
                Durée affichée
                <input value={draft.duration} onChange={(event) => handleChange("duration", event.target.value)} required />
              </label>
              <label>
                Lieu
                <input value={draft.location} onChange={(event) => handleChange("location", event.target.value)} required />
              </label>
              <label>
                Public visé
                <input value={draft.audience} onChange={(event) => handleChange("audience", event.target.value)} required />
              </label>
              <label>
                Tarif affiché
                <input value={draft.price} onChange={(event) => handleChange("price", event.target.value)} required />
              </label>
            </div>
          </div>

          <div className="admin-form-section">
            <h3>Présentation</h3>
            <label>
              Résumé court
              <textarea rows={3} value={draft.summary} onChange={(event) => handleChange("summary", event.target.value)} required />
            </label>
            <label>
              Présentation détaillée
              <textarea rows={5} value={draft.description} onChange={(event) => handleChange("description", event.target.value)} required />
            </label>
            <label>
              Certification ou finalité
              <textarea rows={3} value={draft.certification} onChange={(event) => handleChange("certification", event.target.value)} required />
            </label>
          </div>

          <div className="admin-form-section">
            <h3>Contenu pédagogique</h3>
            <div className="form-grid">
              <label>
                Points forts, une ligne par item
                <textarea rows={6} value={draft.benefits} onChange={(event) => handleChange("benefits", event.target.value)} required />
              </label>
              <label>
                Objectifs, une ligne par item
                <textarea rows={6} value={draft.objectives} onChange={(event) => handleChange("objectives", event.target.value)} required />
              </label>
              <label>
                Prérequis, une ligne par item
                <textarea rows={6} value={draft.prerequisites} onChange={(event) => handleChange("prerequisites", event.target.value)} required />
              </label>
              <label>
                Modalités, une ligne par item
                <textarea rows={6} value={draft.modalities} onChange={(event) => handleChange("modalities", event.target.value)} required />
              </label>
            </div>
            <label>
              Programme, une ligne par étape ou module
              <textarea rows={8} value={draft.programme} onChange={(event) => handleChange("programme", event.target.value)} required />
            </label>
          </div>

          <div className="admin-form-section">
            <h3>Conditions et informations pratiques</h3>
            <div className="form-grid">
              <label>
                Détails de durée
                <textarea rows={4} value={draft.durationDetails} onChange={(event) => handleChange("durationDetails", event.target.value)} required />
              </label>
              <label>
                Détails tarifaires
                <textarea rows={4} value={draft.priceDetails} onChange={(event) => handleChange("priceDetails", event.target.value)} required />
              </label>
            </div>
            <div className="form-grid">
              <label>
                Taux de réussite
                <input value={draft.successRate} onChange={(event) => handleChange("successRate", event.target.value)} required />
              </label>
              <label>
                Accueil du public en situation de handicap
                <textarea rows={4} value={draft.handicapPolicy} onChange={(event) => handleChange("handicapPolicy", event.target.value)} required />
              </label>
            </div>
          </div>

          <button className="button button-primary" type="submit" disabled={saving}>
            {saving ? "Enregistrement..." : editingSlug ? "Mettre à jour" : "Créer la formation"}
          </button>
          {status ? <p className={`form-status ${statusTone}`}>{status}</p> : null}
        </form>
      </section>

      <section className="admin-shell admin-shell-full">
        <div className="section-heading section-heading-tight">
          <div>
            <span className="eyebrow">Entrants</span>
            <h2>Dernières inscriptions</h2>
          </div>
        </div>
        <div className="data-table admin-table-shell">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Entreprise</th>
                <th>Contact</th>
                <th>Formation</th>
                <th>Session</th>
              </tr>
            </thead>
            <tbody>
              {initialRegistrations.map((registration) => (
                <tr key={registration.id}>
                  <td>{formatRegistrationDate(registration.createdAt)}</td>
                  <td>{registration.company}</td>
                  <td>
                    {registration.contactName}
                    <br />
                    {registration.email}
                  </td>
                  <td>{registration.formationSlug}</td>
                  <td>{registration.sessionId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}