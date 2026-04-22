"use client";

import { useMemo, useState } from "react";
import type { Article, Formation, Registration, Session } from "../../shared/types";

type Props = {
  initialArticles: Article[];
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

type SessionDraft = {
  id: string;
  formationSlug: string;
  city: string;
  startDate: string;
  endDate: string;
  seatsLeft: string;
  mode: string;
};

type ArticleDraft = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  body: string;
  readingTime: string;
  publishedAt: string;
  featuredFormationSlug: string;
};

function toSessionDraft(session?: Session): SessionDraft {
  return {
    id: session?.id || "",
    formationSlug: session?.formationSlug || "",
    city: session?.city || "",
    startDate: session?.startDate || "",
    endDate: session?.endDate || "",
    seatsLeft: session ? String(session.seatsLeft) : "",
    mode: session?.mode || "",
  };
}

function toArticleDraft(article?: Article): ArticleDraft {
  return {
    slug: article?.slug || "",
    title: article?.title || "",
    category: article?.category || "",
    excerpt: article?.excerpt || "",
    body: article?.body.join("\n\n") || "",
    readingTime: article?.readingTime || "",
    publishedAt: article?.publishedAt || "",
    featuredFormationSlug: article?.featuredFormationSlug || "",
  };
}

export function AdminConsole({ initialArticles, initialFormations, initialSessions, initialRegistrations }: Props) {
  const [panel, setPanel] = useState<"formations" | "sessions" | "registrations" | "blog">("formations");
  const [articles, setArticles] = useState(initialArticles);
  const [formations, setFormations] = useState(initialFormations);
  const [sessions, setSessions] = useState(initialSessions);
  const [draft, setDraft] = useState<Draft>(toDraft(initialFormations[0]));
  const [sessionDraft, setSessionDraft] = useState<SessionDraft>(toSessionDraft(initialSessions[0]));
  const [articleDraft, setArticleDraft] = useState<ArticleDraft>(toArticleDraft(initialArticles[0]));
  const [editingSlug, setEditingSlug] = useState(initialFormations[0]?.slug || "");
  const [editingSessionId, setEditingSessionId] = useState(initialSessions[0]?.id || "");
  const [editingArticleSlug, setEditingArticleSlug] = useState(initialArticles[0]?.slug || "");
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

  function selectSession(id: string) {
    const session = sessions.find((item) => item.id === id);
    setEditingSessionId(id);
    setSessionDraft(toSessionDraft(session));
    setStatus("");
  }

  function selectArticle(slug: string) {
    const article = articles.find((item) => item.slug === slug);
    setEditingArticleSlug(slug);
    setArticleDraft(toArticleDraft(article));
    setStatus("");
  }

  function handleChange(field: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSessionChange(field: keyof SessionDraft, value: string) {
    setSessionDraft((current) => ({ ...current, [field]: value }));
  }

  function handleArticleChange(field: keyof ArticleDraft, value: string) {
    setArticleDraft((current) => ({ ...current, [field]: value }));
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

  async function handleSessionSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    const payload = {
      formationSlug: sessionDraft.formationSlug,
      city: sessionDraft.city,
      startDate: sessionDraft.startDate,
      endDate: sessionDraft.endDate,
      seatsLeft: Number(sessionDraft.seatsLeft),
      mode: sessionDraft.mode,
    };

    const isEditing = Boolean(editingSessionId);
    const response = await fetch(isEditing ? `/api/admin/sessions/${editingSessionId}` : "/api/admin/sessions", {
      method: isEditing ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json().catch(() => null)) as { data?: Session; error?: string; message?: string } | null;

    if (!response.ok || !result?.data) {
      setSaving(false);
      setStatusTone("error");
      setStatus(result?.error || "La sauvegarde de la session a échoué.");
      return;
    }

    const savedSession = result.data;
    setSessions((current) => {
      const others = current.filter((session) => session.id !== savedSession.id);
      return [...others, savedSession].sort((left, right) => left.startDate.localeCompare(right.startDate));
    });
    setEditingSessionId(savedSession.id);
    setSessionDraft(toSessionDraft(savedSession));
    setSaving(false);
    setStatusTone("success");
    setStatus(result.message || "Session enregistrée.");
  }

  async function handleArticleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    const payload = {
      slug: articleDraft.slug.trim(),
      title: articleDraft.title.trim(),
      category: articleDraft.category.trim(),
      excerpt: articleDraft.excerpt.trim(),
      body: articleDraft.body.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean),
      readingTime: articleDraft.readingTime.trim(),
      publishedAt: articleDraft.publishedAt.trim(),
      featuredFormationSlug: articleDraft.featuredFormationSlug.trim(),
    };

    const isEditing = Boolean(editingArticleSlug);
    const response = await fetch(isEditing ? `/api/admin/articles/${editingArticleSlug}` : "/api/admin/articles", {
      method: isEditing ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(isEditing ? { ...payload, slug: undefined } : payload),
    });

    const result = (await response.json().catch(() => null)) as { data?: Article; error?: string; message?: string } | null;

    if (!response.ok || !result?.data) {
      setSaving(false);
      setStatusTone("error");
      setStatus(result?.error || "La sauvegarde de l'article a échoué.");
      return;
    }

    const savedArticle = result.data;
    setArticles((current) => {
      const others = current.filter((article) => article.slug !== savedArticle.slug && article.slug !== editingArticleSlug);
      return [...others, savedArticle].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
    });
    setEditingArticleSlug(savedArticle.slug);
    setArticleDraft(toArticleDraft(savedArticle));
    setSaving(false);
    setStatusTone("success");
    setStatus(result.message || "Article enregistré.");
  }

  async function handleDeleteSession() {
    if (!editingSessionId) {
      return;
    }

    setSaving(true);
    const response = await fetch(`/api/admin/sessions/${editingSessionId}`, { method: "DELETE" });
    const result = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;

    if (!response.ok) {
      setSaving(false);
      setStatusTone("error");
      setStatus(result?.error || "Suppression impossible.");
      return;
    }

    const remaining = sessions.filter((session) => session.id !== editingSessionId);
    setSessions(remaining);
    setEditingSessionId(remaining[0]?.id || "");
    setSessionDraft(toSessionDraft(remaining[0]));
    setSaving(false);
    setStatusTone("success");
    setStatus(result?.message || "Session supprimée.");
  }

  async function handleDeleteArticle() {
    if (!editingArticleSlug) {
      return;
    }

    setSaving(true);
    const response = await fetch(`/api/admin/articles/${editingArticleSlug}`, { method: "DELETE" });
    const result = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;

    if (!response.ok) {
      setSaving(false);
      setStatusTone("error");
      setStatus(result?.error || "Suppression impossible.");
      return;
    }

    const remaining = articles.filter((article) => article.slug !== editingArticleSlug);
    setArticles(remaining);
    setEditingArticleSlug(remaining[0]?.slug || "");
    setArticleDraft(toArticleDraft(remaining[0]));
    setSaving(false);
    setStatusTone("success");
    setStatus(result?.message || "Article supprimé.");
  }

  return (
    <div className="cms-shell">
      <aside className="cms-sidebar">
        <button className={`cms-nav-item${panel === "formations" ? " active" : ""}`} onClick={() => setPanel("formations")} type="button">Formations</button>
        <button className={`cms-nav-item${panel === "sessions" ? " active" : ""}`} onClick={() => setPanel("sessions")} type="button">Sessions</button>
        <button className={`cms-nav-item${panel === "registrations" ? " active" : ""}`} onClick={() => setPanel("registrations")} type="button">Inscriptions</button>
        <button className={`cms-nav-item${panel === "blog" ? " active" : ""}`} onClick={() => setPanel("blog")} type="button">Blog</button>
      </aside>

      <div className="cms-content">
        {panel === "formations" ? (
          <div className="cms-panel-grid">
            <section className="admin-shell">
              <div className="section-heading section-heading-tight">
                <div>
                  <span className="eyebrow">Catalogue</span>
                  <h2>Formations</h2>
                </div>
                <button
                  className="ui-button ui-button-secondary"
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
          </div>
        ) : null}

        {panel === "sessions" ? (
          <div className="cms-panel-grid">
            <section className="admin-shell">
              <div className="section-heading section-heading-tight">
                <div>
                  <span className="eyebrow">Planning</span>
                  <h2>Sessions</h2>
                </div>
                <button className="ui-button ui-button-secondary" onClick={() => {
                  setEditingSessionId("");
                  setSessionDraft(toSessionDraft());
                  setStatus("");
                }} type="button">Nouvelle session</button>
              </div>
              <div className="admin-list">
                {sessions.map((session) => (
                  <button className="admin-list-item" key={session.id} onClick={() => selectSession(session.id)} type="button">
                    <strong>{formations.find((formation) => formation.slug === session.formationSlug)?.shortTitle || session.formationSlug}</strong>
                    <span>{session.city}</span>
                    <span>{session.startDate}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="admin-shell">
              <div className="section-heading section-heading-tight">
                <div>
                  <span className="eyebrow">Edition</span>
                  <h2>{editingSessionId ? "Modifier une session" : "Créer une session"}</h2>
                </div>
                {editingSessionId ? <button className="ui-button ui-button-ghost" disabled={saving} onClick={handleDeleteSession} type="button">Supprimer</button> : null}
              </div>
              <form className="contact-form" onSubmit={handleSessionSubmit}>
                <div className="form-grid">
                  <label>
                    Formation
                    <select className="ui-field" onChange={(event) => handleSessionChange("formationSlug", event.target.value)} required value={sessionDraft.formationSlug}>
                      <option value="">Choisir</option>
                      {formations.map((formation) => (
                        <option key={formation.slug} value={formation.slug}>{formation.title}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Ville
                    <input className="ui-field" onChange={(event) => handleSessionChange("city", event.target.value)} required value={sessionDraft.city} />
                  </label>
                  <label>
                    Début
                    <input className="ui-field" onChange={(event) => handleSessionChange("startDate", event.target.value)} required type="date" value={sessionDraft.startDate} />
                  </label>
                  <label>
                    Fin
                    <input className="ui-field" onChange={(event) => handleSessionChange("endDate", event.target.value)} required type="date" value={sessionDraft.endDate} />
                  </label>
                  <label>
                    Places restantes
                    <input className="ui-field" min="0" onChange={(event) => handleSessionChange("seatsLeft", event.target.value)} required type="number" value={sessionDraft.seatsLeft} />
                  </label>
                  <label>
                    Mode
                    <input className="ui-field" onChange={(event) => handleSessionChange("mode", event.target.value)} required value={sessionDraft.mode} />
                  </label>
                </div>
                <button className="ui-button ui-button-primary" disabled={saving} type="submit">{saving ? "Enregistrement..." : editingSessionId ? "Mettre à jour" : "Créer la session"}</button>
                {status ? <p className={`form-status ${statusTone}`}>{status}</p> : null}
              </form>
            </section>
          </div>
        ) : null}

        {panel === "blog" ? (
          <div className="cms-panel-grid">
            <section className="admin-shell">
              <div className="section-heading section-heading-tight">
                <div>
                  <span className="eyebrow">Editorial</span>
                  <h2>Articles</h2>
                </div>
                <button className="ui-button ui-button-secondary" onClick={() => {
                  setEditingArticleSlug("");
                  setArticleDraft(toArticleDraft());
                  setStatus("");
                }} type="button">Nouvel article</button>
              </div>
              <div className="admin-list">
                {articles.map((article) => (
                  <button className="admin-list-item" key={article.slug} onClick={() => selectArticle(article.slug)} type="button">
                    <strong>{article.title}</strong>
                    <span>{article.category}</span>
                    <span>{article.publishedAt}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="admin-shell">
              <div className="section-heading section-heading-tight">
                <div>
                  <span className="eyebrow">Edition</span>
                  <h2>{editingArticleSlug ? "Modifier un article" : "Créer un article"}</h2>
                </div>
                {editingArticleSlug ? <button className="ui-button ui-button-ghost" disabled={saving} onClick={handleDeleteArticle} type="button">Supprimer</button> : null}
              </div>
              <form className="contact-form" onSubmit={handleArticleSubmit}>
                <div className="form-grid">
                  <label>
                    Slug
                    <input className="ui-field" disabled={Boolean(editingArticleSlug)} onChange={(event) => handleArticleChange("slug", event.target.value)} required value={articleDraft.slug} />
                  </label>
                  <label>
                    Titre
                    <input className="ui-field" onChange={(event) => handleArticleChange("title", event.target.value)} required value={articleDraft.title} />
                  </label>
                  <label>
                    Catégorie
                    <input className="ui-field" onChange={(event) => handleArticleChange("category", event.target.value)} required value={articleDraft.category} />
                  </label>
                  <label>
                    Temps de lecture
                    <input className="ui-field" onChange={(event) => handleArticleChange("readingTime", event.target.value)} required value={articleDraft.readingTime} />
                  </label>
                  <label>
                    Date de publication
                    <input className="ui-field" onChange={(event) => handleArticleChange("publishedAt", event.target.value)} required type="date" value={articleDraft.publishedAt} />
                  </label>
                  <label>
                    Formation associée
                    <select className="ui-field" onChange={(event) => handleArticleChange("featuredFormationSlug", event.target.value)} value={articleDraft.featuredFormationSlug}>
                      <option value="">Aucune</option>
                      {formations.map((formation) => (
                        <option key={formation.slug} value={formation.slug}>{formation.title}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  Extrait
                  <textarea className="ui-field contact-form-textarea" onChange={(event) => handleArticleChange("excerpt", event.target.value)} rows={3} value={articleDraft.excerpt} />
                </label>
                <label>
                  Corps de l'article, un paragraphe par bloc séparé par une ligne vide
                  <textarea className="ui-field contact-form-textarea" onChange={(event) => handleArticleChange("body", event.target.value)} rows={10} value={articleDraft.body} />
                </label>
                <button className="ui-button ui-button-primary" disabled={saving} type="submit">{saving ? "Enregistrement..." : editingArticleSlug ? "Mettre à jour" : "Créer l'article"}</button>
                {status ? <p className={`form-status ${statusTone}`}>{status}</p> : null}
              </form>
            </section>
          </div>
        ) : null}

        {panel === "registrations" ? (
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
        ) : null}
      </div>
    </div>
  );
}