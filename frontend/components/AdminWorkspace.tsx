"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import type { Article, BulletinInscriptionWithAttempts, Company, CrmInteraction, CrmTask, Formation, Participant, PendingSyncSession, ProgrammeDay, Registration, Session } from "../../shared/types";

type Props = {
  initialArticles: Article[];
  initialCompanies: Company[];
  initialCrmInteractions: CrmInteraction[];
  initialCrmTasks: CrmTask[];
  initialFormations: Formation[];
  initialSessions: Session[];
  initialRegistrations: Registration[];
  initialBulletinInscriptions: BulletinInscriptionWithAttempts[];
  initialParticipants: Participant[];
};

type Section = "dashboard" | "sessions" | "participants" | "formations" | "editorial";

type FormationDraft = {
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
  programme: ProgrammeDay[];
  certification: string;
  price: string;
  priceDetails: string;
  successRate: string;
  handicapPolicy: string;
};

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

type RegistrationDetail = {
  registration: Registration;
  formation?: Formation;
  session?: Session;
};

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createProgrammeDay(): ProgrammeDay {
  return { title: "", sequences: [] };
}

function createProgrammeSequence(): ProgrammeDay["sequences"][number] {
  return { title: "", points: [] };
}

function formatDateLabel(value?: string) {
  if (!value) {
    return "Non planifiée";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
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

function formatSessionRange(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) {
    return "Session à planifier";
  }

  return `${formatDateLabel(startDate)} au ${formatDateLabel(endDate)}`;
}

function compareDate(left?: string, right?: string) {
  return (left || "9999-12-31").localeCompare(right || "9999-12-31");
}

function compareDateDesc(left?: string, right?: string) {
  return (right || "").localeCompare(left || "");
}

function isUpcoming(session?: Session) {
  if (!session) {
    return false;
  }

  const today = new Date().toISOString().slice(0, 10);
  return session.endDate >= today;
}

function getSessionState(session: Session) {
  if (session.seatsLeft === 0) {
    return "Complet";
  }

  if (session.seatsLeft <= 2) {
    return "Dernières places";
  }

  if (isUpcoming(session)) {
    return "À venir";
  }

  return "Passée";
}

function toFormationDraft(formation?: Formation): FormationDraft {
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
      programme: [],
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
    programme: formation.programme || [],
    certification: formation.certification,
    price: formation.price,
    priceDetails: formation.priceDetails,
    successRate: formation.successRate,
    handicapPolicy: formation.handicapPolicy,
  };
}

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

type DetailFieldProps = {
  label: string;
  value: string;
  copyKey: string;
  copiedKey: string;
  copyToClipboard: (key: string, text: string) => void;
};

function DetailField({ label, value, copyKey, copiedKey, copyToClipboard }: DetailFieldProps) {
  return (
    <div className="admin-detail-field">
      <span>{label}</span>
      <div className="admin-field-row">
        <p>{value}</p>
        <button
          className={`admin-field-copy${copiedKey === copyKey ? " is-copied" : ""}`}
          onClick={() => copyToClipboard(copyKey, value)}
          title="Copier"
          type="button"
        >
          {copiedKey === copyKey ? "✓" : "⧉"}
        </button>
      </div>
    </div>
  );
}

export function AdminWorkspace({
  initialArticles,
  initialCompanies,
  initialCrmInteractions,
  initialCrmTasks,
  initialFormations,
  initialSessions,
  initialRegistrations,
  initialBulletinInscriptions,
  initialParticipants,
}: Props) {
  const [section, setSection] = useState<Section>("dashboard");
  const [articles, setArticles] = useState(initialArticles);
  const [formations, setFormations] = useState(initialFormations);
  const [sessions, setSessions] = useState(initialSessions);
  const [registrations] = useState(initialRegistrations);
  const [bulletinInscriptions] = useState(initialBulletinInscriptions);
  const [participants] = useState(initialParticipants);

  const [editingFormationSlug, setEditingFormationSlug] = useState(initialFormations[0]?.slug || "");
  const [editingSessionId, setEditingSessionId] = useState(initialSessions[0]?.id || "");
  const [customCities, setCustomCities] = useState<string[]>([]);
  const [newCityInput, setNewCityInput] = useState("");
  const [editingArticleSlug, setEditingArticleSlug] = useState(initialArticles[0]?.slug || "");
  const [selectedParticipantId, setSelectedParticipantId] = useState("");

  const [participantSearch, setParticipantSearch] = useState("");
  const [participantFormationFilter, setParticipantFormationFilter] = useState("Toutes");
  const [participantStatusFilter, setParticipantStatusFilter] = useState("Tous");

  const [formationDraft, setFormationDraft] = useState(toFormationDraft(initialFormations[0]));
  const [sessionDraft, setSessionDraft] = useState(toSessionDraft(initialSessions[0]));
  const [articleDraft, setArticleDraft] = useState(toArticleDraft(initialArticles[0]));

  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionStateFilter, setSessionStateFilter] = useState("Tous");
  const [sessionCategoryFilter, setSessionCategoryFilter] = useState("Toutes");
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [bulkSessionMode, setBulkSessionMode] = useState("");
  const [bulkSessionCity, setBulkSessionCity] = useState("");
  const [bulkSessionSeats, setBulkSessionSeats] = useState("");

  const [queovalSyncing, setQueovalSyncing] = useState(false);
  const [queovalStageIds, setQueovalStageIds] = useState("");
  const [pendingSessions, setPendingSessions] = useState<PendingSyncSession[]>([]);
  const [pendingFormationChoice, setPendingFormationChoice] = useState<Record<string, string>>({});

  useEffect(() => {
    if (section !== "sessions") return;

    let cancelled = false;

    fetch("/api/admin/queoval/pending")
      .then((response) => response.json())
      .then((result: { data?: PendingSyncSession[] }) => {
        if (!cancelled && result?.data) setPendingSessions(result.data);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [section]);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">("success");
  const [copiedKey, setCopiedKey] = useState("");

  async function copyToClipboard(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((current) => (current === key ? "" : current)), 1800);
    } catch {
      setFeedback("Impossible de copier dans le presse-papiers.");
      setFeedbackTone("error");
    }
  }

  const registrationsBySession = useMemo(() => {
    return registrations.reduce<Record<string, number>>((accumulator, registration) => {
      accumulator[registration.sessionId] = (accumulator[registration.sessionId] || 0) + 1;
      return accumulator;
    }, {});
  }, [registrations]);

  const editingSessionRegistrations = useMemo(
    () => registrations.filter((registration) => registration.sessionId === editingSessionId),
    [registrations, editingSessionId],
  );

  const registrationsByFormation = useMemo(() => {
    return registrations.reduce<Record<string, number>>((accumulator, registration) => {
      accumulator[registration.formationSlug] = (accumulator[registration.formationSlug] || 0) + 1;
      return accumulator;
    }, {});
  }, [registrations]);

  const filteredParticipants = useMemo(() => {
    const search = participantSearch.trim().toLowerCase();
    return participants
      .filter((participant) => {
        const matchesSearch =
          !search || `${participant.fullName} ${participant.company} ${participant.email}`.toLowerCase().includes(search);
        const matchesFormation = participantFormationFilter === "Toutes" || participant.formationSlug === participantFormationFilter;
        const matchesStatus = participantStatusFilter === "Tous" || participant.status === participantStatusFilter;
        return matchesSearch && matchesFormation && matchesStatus;
      })
      .sort((left, right) => compareDateDesc(left.firstContactAt, right.firstContactAt));
  }, [participantFormationFilter, participantSearch, participantStatusFilter, participants]);

  const selectedParticipant = participants.find((participant) => participant.id === selectedParticipantId);
  const selectedParticipantBulletin = selectedParticipant?.bulletinInscriptionId
    ? bulletinInscriptions.find((bulletin) => bulletin.id === selectedParticipant.bulletinInscriptionId)
    : undefined;

  const filteredSessions = sessions.filter((session) => {
    const formation = formations.find((item) => item.slug === session.formationSlug);
    const state = getSessionState(session);
    const matchesSearch = !sessionSearch.trim() || `${formation?.title || ""} ${session.city} ${session.mode}`.toLowerCase().includes(sessionSearch.trim().toLowerCase());
    const matchesState = sessionStateFilter === "Tous" || state === sessionStateFilter;
    const matchesCategory = sessionCategoryFilter === "Toutes" || formation?.category === sessionCategoryFilter;
    return matchesSearch && matchesState && matchesCategory;
  });

  const totalSeatsLeft = sessions.reduce((total, session) => total + session.seatsLeft, 0);

  function setSuccess(message: string) {
    setFeedbackTone("success");
    setFeedback(message);
  }

  function setError(message: string) {
    setFeedbackTone("error");
    setFeedback(message);
  }

  function selectParticipant(participantId: string) {
    setSelectedParticipantId((current) => (current === participantId ? "" : participantId));
    setFeedback("");
  }

  function selectSession(sessionId: string) {
    const session = sessions.find((item) => item.id === sessionId);
    setEditingSessionId(sessionId);
    setSessionDraft(toSessionDraft(session));
    setFeedback("");
  }

  function selectFormation(slug: string) {
    const formation = formations.find((item) => item.slug === slug);
    setEditingFormationSlug(slug);
    setFormationDraft(toFormationDraft(formation));
    setFeedback("");
  }

  function addProgrammeDay() {
    setFormationDraft((current) => ({
      ...current,
      programme: [...current.programme, createProgrammeDay()],
    }));
  }

  function removeProgrammeDay(dayIndex: number) {
    setFormationDraft((current) => ({
      ...current,
      programme: current.programme.filter((_, index) => index !== dayIndex),
    }));
  }

  function updateProgrammeDayTitle(dayIndex: number, title: string) {
    setFormationDraft((current) => ({
      ...current,
      programme: current.programme.map((day, index) => (index === dayIndex ? { ...day, title } : day)),
    }));
  }

  function addProgrammeSequence(dayIndex: number) {
    setFormationDraft((current) => ({
      ...current,
      programme: current.programme.map((day, index) =>
        index === dayIndex ? { ...day, sequences: [...day.sequences, createProgrammeSequence()] } : day,
      ),
    }));
  }

  function removeProgrammeSequence(dayIndex: number, sequenceIndex: number) {
    setFormationDraft((current) => ({
      ...current,
      programme: current.programme.map((day, index) =>
        index === dayIndex ? { ...day, sequences: day.sequences.filter((_, seqIndex) => seqIndex !== sequenceIndex) } : day,
      ),
    }));
  }

  function updateProgrammeSequenceTitle(dayIndex: number, sequenceIndex: number, title: string) {
    setFormationDraft((current) => ({
      ...current,
      programme: current.programme.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              sequences: day.sequences.map((sequence, seqIndex) => (seqIndex === sequenceIndex ? { ...sequence, title } : sequence)),
            }
          : day,
      ),
    }));
  }

  function updateProgrammeSequencePoints(dayIndex: number, sequenceIndex: number, pointsText: string) {
    const points = pointsText.split(/\r?\n/);
    setFormationDraft((current) => ({
      ...current,
      programme: current.programme.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              sequences: day.sequences.map((sequence, seqIndex) => (seqIndex === sequenceIndex ? { ...sequence, points } : sequence)),
            }
          : day,
      ),
    }));
  }

  function selectArticle(slug: string) {
    const article = articles.find((item) => item.slug === slug);
    setEditingArticleSlug(slug);
    setArticleDraft(toArticleDraft(article));
    setFeedback("");
  }

  async function handleSessionSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFeedback("");

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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json().catch(() => null)) as { data?: Session; error?: string; message?: string } | null;

    if (!response.ok || !result?.data) {
      setSaving(false);
      setError(result?.error || "La session n'a pas pu être enregistrée.");
      return;
    }

    setSessions((current) => [...current.filter((item) => item.id !== result.data?.id), result.data as Session]);
    selectSession((result.data as Session).id);
    setSaving(false);
    setSuccess(result.message || "Session enregistrée.");
  }

  async function handleBulkSessionApply() {
    if (!selectedSessionIds.length) return;
    setSaving(true);
    setFeedback("");

    try {
      await Promise.all(
        selectedSessionIds.map(async (sessionId) => {
          const session = sessions.find((item) => item.id === sessionId);
          if (!session) return;

          const response = await fetch(`/api/admin/sessions/${sessionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              formationSlug: session.formationSlug,
              city: bulkSessionCity || session.city,
              startDate: session.startDate,
              endDate: session.endDate,
              seatsLeft: bulkSessionSeats ? Number(bulkSessionSeats) : session.seatsLeft,
              mode: bulkSessionMode || session.mode,
            }),
          });

          if (!response.ok) {
            throw new Error("Bulk session update failed");
          }

          const result = (await response.json()) as { data: Session };
          setSessions((current) => [...current.filter((item) => item.id !== sessionId), result.data]);
        }),
      );

      setSelectedSessionIds([]);
      setSuccess("Actions de masse sessions appliquées.");
    } catch {
      setError("Impossible d'appliquer les actions de masse sessions.");
    } finally {
      setSaving(false);
    }
  }

  async function loadPendingSessions() {
    const response = await fetch("/api/admin/queoval/pending");
    const result = (await response.json().catch(() => null)) as { data?: PendingSyncSession[] } | null;

    if (response.ok && result?.data) {
      setPendingSessions(result.data);
    }
  }

  async function handleQueovalSync() {
    const externalIds = queovalStageIds
      .split(/[\s,;]+/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (!externalIds.length) {
      setError("Indiquez au moins un identifiant de stage Queoval.");
      return;
    }

    setQueovalSyncing(true);
    setFeedback("");

    const response = await fetch("/api/admin/queoval/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ externalIds }),
    });
    const result = (await response.json().catch(() => null)) as { data?: { matched: number; pending: number; total: number }; error?: string; message?: string } | null;

    setQueovalSyncing(false);

    if (!response.ok || !result?.data) {
      setError(result?.error || "La synchronisation Queoval a échoué.");
      return;
    }

    await loadPendingSessions();
    setSuccess(result.message || "Synchronisation Queoval terminée.");
  }

  async function handleResolvePendingSession(pendingId: string) {
    const formationSlug = pendingFormationChoice[pendingId];

    if (!formationSlug) {
      setError("Choisissez une formation avant de rattacher cette session.");
      return;
    }

    setSaving(true);
    setFeedback("");

    const response = await fetch(`/api/admin/queoval/pending/${pendingId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formationSlug }),
    });
    const result = (await response.json().catch(() => null)) as { data?: Session; error?: string; message?: string } | null;

    setSaving(false);

    if (!response.ok || !result?.data) {
      setError(result?.error || "Le rattachement a échoué.");
      return;
    }

    setSessions((current) => [...current.filter((item) => item.id !== result.data?.id), result.data as Session]);
    setPendingSessions((current) => current.filter((item) => item.id !== pendingId));
    setSuccess(result.message || "Session rattachée.");
  }

  async function handleFormationSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFeedback("");

    const payload = {
      slug: formationDraft.slug.trim(),
      title: formationDraft.title.trim(),
      shortTitle: formationDraft.shortTitle.trim(),
      category: formationDraft.category.trim(),
      duration: formationDraft.duration.trim(),
      durationDetails: formationDraft.durationDetails.trim(),
      location: formationDraft.location.trim(),
      audience: formationDraft.audience.trim(),
      summary: formationDraft.summary.trim(),
      description: formationDraft.description.trim(),
      benefits: splitLines(formationDraft.benefits),
      objectives: splitLines(formationDraft.objectives),
      prerequisites: splitLines(formationDraft.prerequisites),
      modalities: splitLines(formationDraft.modalities),
      programme: formationDraft.programme,
      certification: formationDraft.certification.trim(),
      price: formationDraft.price.trim(),
      priceDetails: formationDraft.priceDetails.trim(),
      successRate: formationDraft.successRate.trim(),
      handicapPolicy: formationDraft.handicapPolicy.trim(),
    };

    const isEditing = Boolean(editingFormationSlug);
    const response = await fetch(isEditing ? `/api/admin/formations/${editingFormationSlug}` : "/api/admin/formations", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEditing ? { ...payload, slug: undefined } : payload),
    });
    const result = (await response.json().catch(() => null)) as { data?: Formation; error?: string; message?: string } | null;

    if (!response.ok || !result?.data) {
      setSaving(false);
      setError(result?.error || "La formation n'a pas pu être enregistrée.");
      return;
    }

    setFormations((current) => [...current.filter((item) => item.slug !== result.data?.slug && item.slug !== editingFormationSlug), result.data as Formation]);
    selectFormation((result.data as Formation).slug);
    setSaving(false);
    setSuccess(result.message || "Formation enregistrée.");
  }

  async function handleArticleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFeedback("");

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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEditing ? { ...payload, slug: undefined } : payload),
    });
    const result = (await response.json().catch(() => null)) as { data?: Article; error?: string; message?: string } | null;

    if (!response.ok || !result?.data) {
      setSaving(false);
      setError(result?.error || "L'article n'a pas pu être enregistré.");
      return;
    }

    setArticles((current) => [...current.filter((item) => item.slug !== result.data?.slug && item.slug !== editingArticleSlug), result.data as Article]);
    selectArticle((result.data as Article).slug);
    setSaving(false);
    setSuccess(result.message || "Article enregistré.");
  }

  return (
    <div className="admin-workspace admin-workspace-shell">
      <nav className="admin-sidebar">
        <div className="admin-sidebar-nav">
          {[
            ["dashboard", "Dashboard"],
            ["sessions", "Sessions"],
            ["participants", "Inscrits"],
            ["formations", "Catalogue"],
            ["editorial", "Editorial"],
          ].map(([value, label]) => (
            <button className={`admin-sidebar-link${section === value ? " active" : ""}`} key={value} onClick={() => setSection(value as Section)} type="button">
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div className="admin-workspace-content">
        {feedback ? <p className={`form-status ${feedbackTone}`}>{feedback}</p> : null}

      {section === "dashboard" ? (
        <div className="admin-stack-grid">
          <section className="admin-shell admin-shell-hero">
            <div className="section-heading section-heading-tight">
              <div>
                <span className="eyebrow">Vue d&apos;ensemble</span>
                <h2>Dashboard</h2>
                <p>Catalogue de formations, sessions à venir et disponibilités.</p>
              </div>
            </div>
            <div className="admin-metric-grid">
              <article className="admin-metric-card"><span>Catalogue</span><strong>{formations.length}</strong><small>formations</small></article>
              <article className="admin-metric-card"><span>Sessions</span><strong>{sessions.filter((session) => isUpcoming(session)).length}</strong><small>à venir</small></article>
              <article className="admin-metric-card"><span>Places</span><strong>{totalSeatsLeft}</strong><small>encore disponibles</small></article>
            </div>
          </section>
        </div>
      ) : null}

      {section === "sessions" ? (
        <div className="admin-stack-grid">
          <div className="admin-dual-pane">
            <section className="admin-shell">
              <div className="section-heading section-heading-tight"><div><span className="eyebrow">Planning</span><h2>Sessions</h2></div></div>
              <div className="admin-filter-grid admin-filter-grid-compact">
                <label><span>Recherche</span><input className="ui-field" value={sessionSearch} onChange={(event) => setSessionSearch(event.target.value)} placeholder="Formation, ville, mode..." /></label>
                <label><span>État</span><select className="ui-field" value={sessionStateFilter} onChange={(event) => setSessionStateFilter(event.target.value)}><option>Tous</option><option>À venir</option><option>Dernières places</option><option>Complet</option><option>Passée</option></select></label>
              </div>
              <div className="admin-list admin-list-dense">
                {filteredSessions.map((session) => {
                  const formation = formations.find((item) => item.slug === session.formationSlug);
                  return (
                    <button className={`admin-list-item admin-selectable-item${editingSessionId === session.id ? " active" : ""}`} key={session.id} onClick={() => selectSession(session.id)} type="button">
                      <strong>{formation?.shortTitle || session.formationSlug}</strong>
                      <span>{formatSessionRange(session.startDate, session.endDate)} · {session.city}</span>
                      <span className="admin-list-item-meta">{getSessionState(session)} · {registrationsBySession[session.id] || 0} inscrit(s)</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="admin-shell">
              <div className="section-heading section-heading-tight"><div><span className="eyebrow">Édition</span><h2>{editingSessionId ? "Modifier la session" : "Créer une session"}</h2></div></div>
              <form className="contact-form" onSubmit={handleSessionSubmit}>
                <div className="form-grid">
                  <label><span>Formation</span><select className="ui-field" value={sessionDraft.formationSlug} onChange={(event) => setSessionDraft((current) => ({ ...current, formationSlug: event.target.value }))} required><option value="">Choisir</option>{formations.map((formation) => <option key={formation.slug} value={formation.slug}>{formation.title}</option>)}</select></label>
                  <label><span>Ville</span><input className="ui-field" value={sessionDraft.city} onChange={(event) => setSessionDraft((current) => ({ ...current, city: event.target.value }))} required /></label>
                  <label><span>Début</span><input className="ui-field" type="date" value={sessionDraft.startDate} onChange={(event) => setSessionDraft((current) => ({ ...current, startDate: event.target.value }))} required /></label>
                  <label><span>Fin</span><input className="ui-field" type="date" value={sessionDraft.endDate} onChange={(event) => setSessionDraft((current) => ({ ...current, endDate: event.target.value }))} required /></label>
                  <label><span>Places</span><input className="ui-field" type="number" min="0" value={sessionDraft.seatsLeft} onChange={(event) => setSessionDraft((current) => ({ ...current, seatsLeft: event.target.value }))} required /></label>
                  <label><span>Mode</span><input className="ui-field" value={sessionDraft.mode} onChange={(event) => setSessionDraft((current) => ({ ...current, mode: event.target.value }))} required /></label>
                </div>
                <div className="admin-session-overview">
                  <div><span>État</span><strong>{editingSessionId ? getSessionState(sessions.find((item) => item.id === editingSessionId) || sessions[0]) : "Nouvelle"}</strong></div>
                  <div><span>Inscrits</span><strong>{registrationsBySession[editingSessionId] || 0}</strong></div>
                  <div><span>Places restantes</span><strong>{sessionDraft.seatsLeft || "0"}</strong></div>
                </div>
                <div className="admin-form-actions">
                  <Button disabled={saving} type="submit">{saving ? "Enregistrement..." : editingSessionId ? "Mettre à jour" : "Créer la session"}</Button>
                  {editingSessionId ? <Button variant="secondary" type="button" onClick={() => selectSession("")}>Nouvelle session</Button> : null}
                </div>
              </form>
            </section>
          </div>

          {editingSessionId ? (
            <section className="admin-shell">
              <div className="section-heading section-heading-tight">
                <div><span className="eyebrow">Inscrits</span><h2>Participants de cette session</h2></div>
                {editingSessionRegistrations.length ? (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      copyToClipboard(
                        "session-all",
                        editingSessionRegistrations
                          .map((registration) => `${registration.company}\t${registration.contactName}\t${registration.email}\t${registration.phone}`)
                          .join("\n"),
                      )
                    }
                  >
                    {copiedKey === "session-all" ? "Copié !" : "Copier la liste"}
                  </Button>
                ) : null}
              </div>
              {editingSessionRegistrations.length ? (
                <div className="admin-table-shell admin-table-shell-solid">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Société</th>
                        <th>Contact</th>
                        <th>Email</th>
                        <th>Téléphone</th>
                        <th>Inscrit le</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingSessionRegistrations.map((registration) => (
                        <tr key={registration.id}>
                          <td>{registration.company}</td>
                          <td>{registration.contactName}</td>
                          <td>{registration.email}</td>
                          <td>{registration.phone}</td>
                          <td>{formatRegistrationDate(registration.createdAt)}</td>
                          <td>
                            <button
                              className="admin-copy-button"
                              onClick={() =>
                                copyToClipboard(
                                  registration.id,
                                  `${registration.company} - ${registration.contactName} - ${registration.email} - ${registration.phone}`,
                                )
                              }
                              type="button"
                            >
                              {copiedKey === registration.id ? "Copié !" : "Copier"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="admin-empty-state">Aucun inscrit pour cette session pour le moment.</p>
              )}
            </section>
          ) : null}

          <section className="admin-shell">
            <div className="section-heading section-heading-tight"><div><span className="eyebrow">Planning</span><h2>Actions de masse</h2><p>Sélectionnez des sessions dans la liste puis appliquez une modification groupée.</p></div></div>
            <div className="admin-filter-grid admin-filter-grid-compact">
              <label><span>Catégorie</span><select className="ui-field" value={sessionCategoryFilter} onChange={(event) => setSessionCategoryFilter(event.target.value)}><option>Toutes</option>{Array.from(new Set(formations.map((formation) => formation.category))).sort((a, b) => a.localeCompare(b, "fr")).map((category) => <option key={category}>{category}</option>)}</select></label>
            </div>
            <div className="admin-list admin-list-dense">
              {filteredSessions.map((session) => (
                <label className="admin-checkbox-item admin-list-item" key={session.id}>
                  <input checked={selectedSessionIds.includes(session.id)} onChange={(event) => {
                    setSelectedSessionIds((current) => event.target.checked ? [...current, session.id] : current.filter((item) => item !== session.id));
                  }} type="checkbox" />
                  <span>{formations.find((item) => item.slug === session.formationSlug)?.shortTitle || session.formationSlug} · {session.city}</span>
                </label>
              ))}
            </div>
            <div className="admin-bulk-grid">
              <label><span>Mode masse</span><input className="ui-field" value={bulkSessionMode} onChange={(event) => setBulkSessionMode(event.target.value)} placeholder="Présentiel, Distanciel..." /></label>
              <label><span>Ville masse</span><input className="ui-field" value={bulkSessionCity} onChange={(event) => setBulkSessionCity(event.target.value)} placeholder="Rouen, Paris..." /></label>
              <label><span>Places restantes</span><input className="ui-field" type="number" min="0" value={bulkSessionSeats} onChange={(event) => setBulkSessionSeats(event.target.value)} placeholder="10" /></label>
              <Button onClick={handleBulkSessionApply} disabled={saving || !selectedSessionIds.length}>Appliquer à {selectedSessionIds.length || 0} session(s)</Button>
            </div>
          </section>

          <details className="admin-collapsible">
            <summary>Synchronisation Queoval (optionnel)</summary>
            <section className="admin-shell">
              <div className="section-heading section-heading-tight">
                <div><span className="eyebrow">Queoval</span><h2>Synchronisation du calendrier</h2><p>Colle les identifiants de stage Queoval (visibles dans l'URL de la fiche stage, ex. stage-detail/191738) séparés par des virgules ou espaces.</p></div>
              </div>
              <div className="admin-bulk-grid">
                <label><span>Identifiants de stage</span><input className="ui-field" value={queovalStageIds} onChange={(event) => setQueovalStageIds(event.target.value)} placeholder="191738, 192274, 192282..." /></label>
                <Button onClick={handleQueovalSync} disabled={queovalSyncing}>{queovalSyncing ? "Synchronisation..." : "Synchroniser Queoval"}</Button>
              </div>
              {pendingSessions.length ? (
                <div className="admin-list admin-list-dense">
                  {pendingSessions.map((pending) => (
                    <div className="admin-list-item" key={pending.id}>
                      <strong>{pending.externalTitle}</strong>
                      <span>{formatSessionRange(pending.startDate, pending.endDate)} · {pending.city || "À distance"}</span>
                      <div className="admin-bulk-grid">
                        <select
                          className="ui-field"
                          value={pendingFormationChoice[pending.id] || ""}
                          onChange={(event) => setPendingFormationChoice((current) => ({ ...current, [pending.id]: event.target.value }))}
                        >
                          <option value="">Choisir la formation</option>
                          {formations.map((formation) => <option key={formation.slug} value={formation.slug}>{formation.title}</option>)}
                        </select>
                        <Button onClick={() => handleResolvePendingSession(pending.id)} disabled={saving || !pendingFormationChoice[pending.id]}>Rattacher</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="admin-empty-state">Aucune session Queoval en attente de rattachement.</p>
              )}
            </section>
          </details>
        </div>
      ) : null}

      {section === "formations" ? (
        <div className="admin-dual-pane">
          <section className="admin-shell">
            <div className="section-heading section-heading-tight"><div><span className="eyebrow">Catalogue</span><h2>Formations</h2></div><Button variant="secondary" onClick={() => { setEditingFormationSlug(""); setFormationDraft(toFormationDraft()); }}>Nouvelle formation</Button></div>
            <div className="admin-list admin-list-dense">
              {formations.sort((a, b) => a.title.localeCompare(b.title, "fr")).map((formation) => (
                <button className={`admin-list-item${editingFormationSlug === formation.slug ? " active" : ""}`} key={formation.slug} onClick={() => selectFormation(formation.slug)} type="button">
                  <strong>{formation.title}</strong>
                  <span>{formation.category}</span>
                  <span>{registrationsByFormation[formation.slug] || 0} inscriptions</span>
                </button>
              ))}
            </div>
          </section>
          <section className="admin-shell">
            <div className="section-heading section-heading-tight"><div><span className="eyebrow">Edition</span><h2>{editingFormationSlug ? "Modifier la formation" : "Créer une formation"}</h2></div></div>
            <form className="contact-form" onSubmit={handleFormationSubmit}>
              <div className="admin-form-section"><h3>Identité</h3><div className="form-grid">
                <label><span>Slug</span><input className="ui-field" disabled={Boolean(editingFormationSlug)} value={formationDraft.slug} onChange={(event) => setFormationDraft((current) => ({ ...current, slug: event.target.value }))} required /></label>
                <label><span>Nom complet</span><input className="ui-field" value={formationDraft.title} onChange={(event) => setFormationDraft((current) => ({ ...current, title: event.target.value }))} required /></label>
                <label><span>Nom court</span><input className="ui-field" value={formationDraft.shortTitle} onChange={(event) => setFormationDraft((current) => ({ ...current, shortTitle: event.target.value }))} required /></label>
                <label><span>Catégorie</span><input className="ui-field" value={formationDraft.category} onChange={(event) => setFormationDraft((current) => ({ ...current, category: event.target.value }))} required /></label>
                <label><span>Durée</span><input className="ui-field" value={formationDraft.duration} onChange={(event) => setFormationDraft((current) => ({ ...current, duration: event.target.value }))} required /></label>
                <label><span>Lieu</span><input className="ui-field" value={formationDraft.location} onChange={(event) => setFormationDraft((current) => ({ ...current, location: event.target.value }))} required /></label>
                <label><span>Public</span><input className="ui-field" value={formationDraft.audience} onChange={(event) => setFormationDraft((current) => ({ ...current, audience: event.target.value }))} required /></label>
                <label><span>Tarif</span><input className="ui-field" value={formationDraft.price} onChange={(event) => setFormationDraft((current) => ({ ...current, price: event.target.value }))} required /></label>
              </div></div>
              <div className="admin-form-section"><h3>Contenu</h3>
                <label><span>Résumé</span><textarea className="ui-field" rows={3} value={formationDraft.summary} onChange={(event) => setFormationDraft((current) => ({ ...current, summary: event.target.value }))} required /></label>
                <label><span>Description</span><textarea className="ui-field" rows={5} value={formationDraft.description} onChange={(event) => setFormationDraft((current) => ({ ...current, description: event.target.value }))} required /></label>
                <div className="form-grid">
                  <label><span>Points forts</span><textarea className="ui-field" rows={6} value={formationDraft.benefits} onChange={(event) => setFormationDraft((current) => ({ ...current, benefits: event.target.value }))} required /></label>
                  <label><span>Objectifs</span><textarea className="ui-field" rows={6} value={formationDraft.objectives} onChange={(event) => setFormationDraft((current) => ({ ...current, objectives: event.target.value }))} required /></label>
                  <label><span>Prérequis</span><textarea className="ui-field" rows={6} value={formationDraft.prerequisites} onChange={(event) => setFormationDraft((current) => ({ ...current, prerequisites: event.target.value }))} required /></label>
                  <label><span>Modalités</span><textarea className="ui-field" rows={6} value={formationDraft.modalities} onChange={(event) => setFormationDraft((current) => ({ ...current, modalities: event.target.value }))} required /></label>
                </div>
                <div className="admin-programme-editor">
                  <div className="admin-programme-editor-header">
                    <span>Programme</span>
                    <Button variant="secondary" type="button" onClick={addProgrammeDay}>Ajouter un jour</Button>
                  </div>
                  {formationDraft.programme.length === 0 ? (
                    <p className="admin-empty-state">Aucun jour de programme pour le moment.</p>
                  ) : (
                    formationDraft.programme.map((day, dayIndex) => (
                      <div className="admin-programme-day" key={dayIndex}>
                        <div className="admin-programme-row">
                          <label className="admin-programme-title-field">
                            <span>Titre du jour {dayIndex + 1}</span>
                            <input
                              className="ui-field"
                              value={day.title}
                              onChange={(event) => updateProgrammeDayTitle(dayIndex, event.target.value)}
                              required
                            />
                          </label>
                          <Button variant="ghost" type="button" onClick={() => removeProgrammeDay(dayIndex)}>Supprimer ce jour</Button>
                        </div>

                        <div className="admin-programme-sequences">
                          {day.sequences.length === 0 ? (
                            <p className="admin-empty-state">Aucune séquence pour ce jour.</p>
                          ) : (
                            day.sequences.map((sequence, sequenceIndex) => (
                              <div className="admin-programme-sequence" key={sequenceIndex}>
                                <div className="admin-programme-row">
                                  <label className="admin-programme-title-field">
                                    <span>Titre de la séquence {sequenceIndex + 1}</span>
                                    <input
                                      className="ui-field"
                                      value={sequence.title}
                                      onChange={(event) => updateProgrammeSequenceTitle(dayIndex, sequenceIndex, event.target.value)}
                                      required
                                    />
                                  </label>
                                  <Button variant="ghost" type="button" onClick={() => removeProgrammeSequence(dayIndex, sequenceIndex)}>Supprimer cette séquence</Button>
                                </div>
                                <label>
                                  <span>Points (un par ligne)</span>
                                  <textarea
                                    className="ui-field"
                                    rows={4}
                                    value={sequence.points.join("\n")}
                                    onChange={(event) => updateProgrammeSequencePoints(dayIndex, sequenceIndex, event.target.value)}
                                  />
                                </label>
                              </div>
                            ))
                          )}
                          <Button variant="secondary" type="button" onClick={() => addProgrammeSequence(dayIndex)}>Ajouter une séquence</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="admin-form-section"><h3>Infos pratiques</h3><div className="form-grid">
                <label><span>Détails durée</span><textarea className="ui-field" rows={4} value={formationDraft.durationDetails} onChange={(event) => setFormationDraft((current) => ({ ...current, durationDetails: event.target.value }))} required /></label>
                <label><span>Détails tarif</span><textarea className="ui-field" rows={4} value={formationDraft.priceDetails} onChange={(event) => setFormationDraft((current) => ({ ...current, priceDetails: event.target.value }))} required /></label>
                <label><span>Taux de réussite</span><input className="ui-field" value={formationDraft.successRate} onChange={(event) => setFormationDraft((current) => ({ ...current, successRate: event.target.value }))} required /></label>
                <label><span>Accessibilité</span><textarea className="ui-field" rows={4} value={formationDraft.handicapPolicy} onChange={(event) => setFormationDraft((current) => ({ ...current, handicapPolicy: event.target.value }))} required /></label>
              </div></div>
              <label><span>Finalité / certification</span><textarea className="ui-field" rows={3} value={formationDraft.certification} onChange={(event) => setFormationDraft((current) => ({ ...current, certification: event.target.value }))} required /></label>
              <Button disabled={saving} type="submit">{saving ? "Enregistrement..." : editingFormationSlug ? "Mettre à jour" : "Créer la formation"}</Button>
            </form>
          </section>
        </div>
      ) : null}

      {section === "editorial" ? (
        <div className="admin-dual-pane">
          <section className="admin-shell">
            <div className="section-heading section-heading-tight"><div><span className="eyebrow">Editorial</span><h2>Articles</h2></div><Button variant="secondary" onClick={() => { setEditingArticleSlug(""); setArticleDraft(toArticleDraft()); }}>Nouvel article</Button></div>
            <div className="admin-list admin-list-dense">
              {articles.sort((a, b) => compareDateDesc(a.publishedAt, b.publishedAt)).map((article) => (
                <button className={`admin-list-item${editingArticleSlug === article.slug ? " active" : ""}`} key={article.slug} onClick={() => selectArticle(article.slug)} type="button">
                  <strong>{article.title}</strong>
                  <span>{article.category}</span>
                  <span>{formatDateLabel(article.publishedAt)}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="admin-shell">
            <div className="section-heading section-heading-tight"><div><span className="eyebrow">Edition</span><h2>{editingArticleSlug ? "Modifier l'article" : "Créer un article"}</h2></div></div>
            <form className="contact-form" onSubmit={handleArticleSubmit}>
              <div className="form-grid">
                <label><span>Slug</span><input className="ui-field" disabled={Boolean(editingArticleSlug)} value={articleDraft.slug} onChange={(event) => setArticleDraft((current) => ({ ...current, slug: event.target.value }))} required /></label>
                <label><span>Titre</span><input className="ui-field" value={articleDraft.title} onChange={(event) => setArticleDraft((current) => ({ ...current, title: event.target.value }))} required /></label>
                <label><span>Catégorie</span><input className="ui-field" value={articleDraft.category} onChange={(event) => setArticleDraft((current) => ({ ...current, category: event.target.value }))} required /></label>
                <label><span>Lecture</span><input className="ui-field" value={articleDraft.readingTime} onChange={(event) => setArticleDraft((current) => ({ ...current, readingTime: event.target.value }))} required /></label>
                <label><span>Publication</span><input className="ui-field" type="date" value={articleDraft.publishedAt} onChange={(event) => setArticleDraft((current) => ({ ...current, publishedAt: event.target.value }))} required /></label>
                <label><span>Formation liée</span><select className="ui-field" value={articleDraft.featuredFormationSlug} onChange={(event) => setArticleDraft((current) => ({ ...current, featuredFormationSlug: event.target.value }))}><option value="">Aucune</option>{formations.map((formation) => <option key={formation.slug} value={formation.slug}>{formation.title}</option>)}</select></label>
              </div>
              <label><span>Extrait</span><textarea className="ui-field" rows={4} value={articleDraft.excerpt} onChange={(event) => setArticleDraft((current) => ({ ...current, excerpt: event.target.value }))} required /></label>
              <label><span>Corps</span><textarea className="ui-field" rows={12} value={articleDraft.body} onChange={(event) => setArticleDraft((current) => ({ ...current, body: event.target.value }))} required /></label>
              <Button disabled={saving} type="submit">{saving ? "Enregistrement..." : editingArticleSlug ? "Mettre à jour" : "Créer l'article"}</Button>
            </form>
          </section>
        </div>
      ) : null}

      {section === "participants" ? (
        <div className="admin-stack-grid">
          <section className="admin-shell">
            <div className="section-heading section-heading-tight">
              <div>
                <span className="eyebrow">Inscrits</span>
                <h2>Tous les inscrits</h2>
                <p>Pré-inscriptions rapides et bulletins d&apos;inscription détaillés, fusionnés en une seule liste par personne.</p>
              </div>
            </div>

            <div className="admin-filter-grid admin-filter-grid-compact">
              <label><span>Recherche</span><input className="ui-field" value={participantSearch} onChange={(event) => setParticipantSearch(event.target.value)} placeholder="Nom, entreprise, email..." /></label>
              <label>
                <span>Formation</span>
                <select className="ui-field" value={participantFormationFilter} onChange={(event) => setParticipantFormationFilter(event.target.value)}>
                  <option>Toutes</option>
                  {formations.map((formation) => <option key={formation.slug} value={formation.slug}>{formation.shortTitle}</option>)}
                </select>
              </label>
              <label>
                <span>Statut</span>
                <select className="ui-field" value={participantStatusFilter} onChange={(event) => setParticipantStatusFilter(event.target.value)}>
                  <option>Tous</option>
                  <option>Pré-inscrit seulement</option>
                  <option>Bulletin complété</option>
                  <option>Bulletin direct</option>
                </select>
              </label>
            </div>

            {filteredParticipants.length === 0 ? (
              <p className="admin-empty-state">Aucun inscrit ne correspond à ces filtres.</p>
            ) : (
              <div className="admin-table-shell admin-table-shell-solid">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Entreprise</th>
                      <th>Formation</th>
                      <th>Session</th>
                      <th>Statut</th>
                      <th>Auto-éval</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParticipants.map((participant) => {
                      const formation = formations.find((item) => item.slug === participant.formationSlug);
                      const session = sessions.find((item) => item.id === participant.sessionId);
                      const statusClassName =
                        participant.status === "Bulletin complété"
                          ? "ui-badge-accent"
                          : participant.status === "Bulletin direct"
                            ? "ui-badge-soft"
                            : "ui-badge-default";

                      return (
                        <tr
                          key={participant.id}
                          className={selectedParticipantId === participant.id ? "admin-row-active" : undefined}
                          onClick={() => selectParticipant(participant.id)}
                        >
                          <td>{participant.fullName}</td>
                          <td>{participant.company}</td>
                          <td>{formation?.shortTitle || participant.formationSlug}</td>
                          <td>{session ? `${formatSessionRange(session.startDate, session.endDate)} · ${session.city}` : "Non renseignée"}</td>
                          <td><span className={`ui-badge ${statusClassName}`}>{participant.status}</span></td>
                          <td>{participant.quizAttempt ? `${participant.quizAttempt.scoreOn20} / 20` : "-"}</td>
                          <td>
                            <div className="admin-table-actions" onClick={(event) => event.stopPropagation()}>
                              {participant.bulletinInscriptionId ? (
                                <a
                                  className="admin-copy-button"
                                  href={`/api/admin/bulletin-inscriptions/${participant.bulletinInscriptionId}/pdf`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Voir le PDF
                                </a>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {selectedParticipant ? (
            <section className="admin-shell">
              <div className="section-heading section-heading-tight">
                <div>
                  <span className="eyebrow">Détail</span>
                  <h2>{selectedParticipant.fullName}</h2>
                  <p>{selectedParticipant.status}</p>
                </div>
              </div>

              <div className="admin-form-section">
                <h3>Coordonnées</h3>
                <div className="form-grid">
                  <DetailField label="Nom" value={selectedParticipant.fullName} copyKey="p-name" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                  <DetailField label="Entreprise" value={selectedParticipant.company} copyKey="p-company" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                  <DetailField label="Email" value={selectedParticipant.email} copyKey="p-email" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                  <DetailField label="Téléphone" value={selectedParticipant.phone} copyKey="p-phone" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                  <DetailField label="Formation" value={formations.find((item) => item.slug === selectedParticipant.formationSlug)?.title || selectedParticipant.formationSlug} copyKey="p-formation" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                  <DetailField label="Premier contact" value={formatRegistrationDate(selectedParticipant.firstContactAt)} copyKey="p-firstcontact" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                </div>
              </div>

              {selectedParticipantBulletin ? (
                <>
                  <div className="admin-form-section">
                    <div className="section-heading section-heading-tight">
                      <h3>Bulletin d&apos;inscription</h3>
                      <a
                        className="admin-copy-button"
                        href={`/api/admin/bulletin-inscriptions/${selectedParticipantBulletin.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Voir le PDF
                      </a>
                    </div>
                    <div className="form-grid">
                      <DetailField label="Dates de session" value={selectedParticipantBulletin.sessionDates || "Non renseignées"} copyKey="b-dates" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                      <DetailField label="Lieu de session" value={selectedParticipantBulletin.sessionLocation || "Non renseigné"} copyKey="b-location" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                      <DetailField label="Origine" value={selectedParticipantBulletin.source || "Non renseignée"} copyKey="b-source" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                      <DetailField label="Raison sociale" value={selectedParticipantBulletin.companyName} copyKey="b-company" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                      <DetailField label="SIRET" value={selectedParticipantBulletin.siret || "Non renseigné"} copyKey="b-siret" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                      <DetailField label="Commanditaire" value={`${selectedParticipantBulletin.sponsorFullName} (${selectedParticipantBulletin.sponsorRole || "fonction non renseignée"})`} copyKey="b-sponsor" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                      <DetailField label="Apprenant" value={selectedParticipantBulletin.learnerFullName} copyKey="b-learner" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                      <DetailField label="Situation de handicap" value={selectedParticipantBulletin.hasDisability ? "Oui" : "Non"} copyKey="b-disability" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                    </div>
                  </div>

                  <div className="admin-form-section">
                    <h3>Auto-évaluation</h3>
                    {selectedParticipantBulletin.quizAttempts.length === 0 ? (
                      <p className="admin-empty-state">L&apos;apprenant n&apos;a pas encore réalisé son auto-évaluation.</p>
                    ) : (
                      <div className="admin-list admin-list-dense">
                        {selectedParticipantBulletin.quizAttempts.map((attempt) => (
                          <div className="admin-list-item" key={attempt.id}>
                            <strong>Score : {attempt.scoreOn20} / 20</strong>
                            <span>Passé le {formatRegistrationDate(attempt.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="admin-empty-state">Cette personne n&apos;a pas encore complété de bulletin d&apos;inscription détaillé.</p>
              )}
            </section>
          ) : null}
        </div>
      ) : null}
      </div>
    </div>
  );
}