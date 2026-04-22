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
  location: string;
  audience: string;
  summary: string;
  description: string;
  benefits: string;
  objectives: string;
  price: string;
  seoTitle: string;
  seoDescription: string;
};

function toDraft(formation?: Formation): Draft {
  if (!formation) {
    return {
      slug: "",
      title: "",
      shortTitle: "",
      category: "",
      duration: "",
      location: "",
      audience: "",
      summary: "",
      description: "",
      benefits: "",
      objectives: "",
      price: "",
      seoTitle: "",
      seoDescription: "",
    };
  }

  return {
    slug: formation.slug,
    title: formation.title,
    shortTitle: formation.shortTitle,
    category: formation.category,
    duration: formation.duration,
    location: formation.location,
    audience: formation.audience,
    summary: formation.summary,
    description: formation.description,
    benefits: formation.benefits.join("\n"),
    objectives: formation.objectives.join("\n"),
    price: formation.price,
    seoTitle: formation.seoTitle,
    seoDescription: formation.seoDescription,
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
      location: draft.location.trim(),
      audience: draft.audience.trim(),
      summary: draft.summary.trim(),
      description: draft.description.trim(),
      benefits: splitLines(draft.benefits),
      objectives: splitLines(draft.objectives),
      price: draft.price.trim(),
      seoTitle: draft.seoTitle.trim(),
      seoDescription: draft.seoDescription.trim(),
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
              Durée
              <input value={draft.duration} onChange={(event) => handleChange("duration", event.target.value)} required />
            </label>
            <label>
              Lieu
              <input value={draft.location} onChange={(event) => handleChange("location", event.target.value)} required />
            </label>
            <label>
              Audience
              <input value={draft.audience} onChange={(event) => handleChange("audience", event.target.value)} required />
            </label>
            <label>
              Tarif
              <input value={draft.price} onChange={(event) => handleChange("price", event.target.value)} required />
            </label>
          </div>

          <label>
            Résumé court
            <textarea rows={3} value={draft.summary} onChange={(event) => handleChange("summary", event.target.value)} required />
          </label>
          <label>
            Description
            <textarea rows={6} value={draft.description} onChange={(event) => handleChange("description", event.target.value)} required />
          </label>
          <div className="form-grid">
            <label>
              Bénéfices, une ligne par item
              <textarea rows={6} value={draft.benefits} onChange={(event) => handleChange("benefits", event.target.value)} required />
            </label>
            <label>
              Objectifs, une ligne par item
              <textarea rows={6} value={draft.objectives} onChange={(event) => handleChange("objectives", event.target.value)} required />
            </label>
          </div>
          <label>
            SEO title
            <input value={draft.seoTitle} onChange={(event) => handleChange("seoTitle", event.target.value)} required />
          </label>
          <label>
            SEO description
            <textarea rows={3} value={draft.seoDescription} onChange={(event) => handleChange("seoDescription", event.target.value)} required />
          </label>
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