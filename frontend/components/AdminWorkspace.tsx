"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { DataTable } from "@/components/admin/DataTable";
import { Drawer } from "@/components/admin/Drawer";
import type { AdminUser, Article, BulletinInscriptionWithAttempts, Company, CrmInteraction, CrmTask, Formation, Participant, PendingSyncSession, ProgrammeDay, Registration, Session } from "../../shared/types";

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

type Section = "dashboard" | "sessions" | "participants" | "formations" | "editorial" | "accounts";

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
  mode: string;
};

const SESSION_MODE_OPTIONS = ["Présentiel", "Distanciel"];

type ArticleDraft = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  readingTime: string;
  publishedAt: string;
  featuredFormationSlug: string;
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

function formatShortDateFr(value?: string | null) {
  if (!value) {
    return "Non renseignée";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
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
    mode: session?.mode || "",
  };
}

function toArticleDraft(article?: Article): ArticleDraft {
  return {
    slug: article?.slug || "",
    title: article?.title || "",
    category: article?.category || "",
    excerpt: article?.excerpt || "",
    readingTime: article?.readingTime || "",
    publishedAt: article?.publishedAt || "",
    featuredFormationSlug: article?.featuredFormationSlug || "",
  };
}

function toArticleBodyParagraphs(article?: Article): string[] {
  return article?.body && article.body.length > 0 ? [...article.body] : [""];
}

type DetailFieldProps = {
  label: string;
  value: string;
  copyKey: string;
  copiedKey: string;
  copyToClipboard: (key: string, text: string) => void;
};

const NAV_ITEMS: { value: Section; label: string; icon: string }[] = [
  { value: "dashboard", label: "Dashboard", icon: "◧" },
  { value: "sessions", label: "Sessions", icon: "◷" },
  { value: "participants", label: "Inscriptions", icon: "◍" },
  { value: "formations", label: "Catalogue", icon: "▤" },
  { value: "editorial", label: "Editorial", icon: "✎" },
  { value: "accounts", label: "Comptes", icon: "◉" },
];

function StatusBadge({ label, tone = "default" }: { label: string; tone?: "default" | "accent" | "soft" }) {
  return <span className={`admin-status-badge admin-status-badge-${tone}`}>{label}</span>;
}

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
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const MANUAL_REGISTRATION_STATUSES = ["Pré-inscription (à qualifier)", "Non intéressé", "BI envoyé"];
  const AUTOMATIC_REGISTRATION_STATUSES = ["En attente auto-éval", "Inscription complétée"];
  const [bulletinInscriptions, setBulletinInscriptions] = useState(initialBulletinInscriptions);
  const [participants, setParticipants] = useState(initialParticipants);
  const [refreshing, setRefreshing] = useState(false);

  async function refreshAdminData() {
    setRefreshing(true);
    setFeedback("");

    try {
      const [registrationsResponse, bulletinsResponse, participantsResponse] = await Promise.all([
        fetch("/api/admin/registrations"),
        fetch("/api/admin/bulletin-inscriptions"),
        fetch("/api/admin/participants"),
      ]);

      const [registrationsResult, bulletinsResult, participantsResult] = await Promise.all([
        registrationsResponse.json().catch(() => null),
        bulletinsResponse.json().catch(() => null),
        participantsResponse.json().catch(() => null),
      ]);

      const failures: string[] = [];

      if (registrationsResponse.ok && registrationsResult?.data) {
        setRegistrations(registrationsResult.data);
      } else {
        failures.push("pré-inscriptions");
      }

      if (bulletinsResponse.ok && bulletinsResult?.data) {
        setBulletinInscriptions(bulletinsResult.data);
      } else {
        failures.push("bulletins");
      }

      if (participantsResponse.ok && participantsResult?.data) {
        setParticipants(participantsResult.data);
      } else {
        failures.push("inscrits");
      }

      if (failures.length) {
        setFeedback(`Échec du rafraîchissement pour : ${failures.join(", ")}.`);
        setFeedbackTone("error");
      } else {
        setFeedback("Données à jour.");
        setFeedbackTone("success");
      }
    } catch {
      setFeedback("Impossible de rafraîchir les données pour le moment.");
      setFeedbackTone("error");
    } finally {
      setRefreshing(false);
    }
  }

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
  const [articleBodyParagraphs, setArticleBodyParagraphs] = useState<string[]>(toArticleBodyParagraphs(initialArticles[0]));
  const [articleSearch, setArticleSearch] = useState("");

  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionStateFilter, setSessionStateFilter] = useState("Tous");
  const [sessionCategoryFilter, setSessionCategoryFilter] = useState("Toutes");
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [bulkSessionMode, setBulkSessionMode] = useState("");
  const [bulkSessionCity, setBulkSessionCity] = useState("");
  const [sessionDrawerOpen, setSessionDrawerOpen] = useState(false);

  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const [customArticleCategories, setCustomArticleCategories] = useState<string[]>([]);
  const [newArticleCategoryInput, setNewArticleCategoryInput] = useState("");
  const [isAddingArticleCategory, setIsAddingArticleCategory] = useState(false);

  const [formationSearch, setFormationSearch] = useState("");

  const [participantDrawerOpen, setParticipantDrawerOpen] = useState(false);

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

  const [databaseConnected, setDatabaseConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/system-status")
      .then((response) => response.json())
      .then((result: { data?: { databaseConnected?: boolean } }) => {
        if (!cancelled && typeof result?.data?.databaseConnected === "boolean") {
          setDatabaseConnected(result.data.databaseConnected);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">("success");
  const [copiedKey, setCopiedKey] = useState("");

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  useEffect(() => {
    if (section !== "accounts") return;

    let cancelled = false;

    fetch("/api/admin/users")
      .then((response) => response.json())
      .then((result: { data?: AdminUser[] }) => {
        if (!cancelled && result?.data) setAdminUsers(result.data);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [section]);

  async function handleCreateAdminUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingAdmin(true);
    setFeedback("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword, name: newAdminName }),
      });
      const result = (await response.json()) as { data?: AdminUser; error?: string };

      if (!response.ok || !result.data) {
        setFeedback(result.error || "Impossible de créer ce compte.");
        setFeedbackTone("error");
        return;
      }

      setAdminUsers((current) => [...current, result.data as AdminUser]);
      setNewAdminEmail("");
      setNewAdminName("");
      setNewAdminPassword("");
      setFeedback("Compte administrateur créé.");
      setFeedbackTone("success");
    } finally {
      setCreatingAdmin(false);
    }
  }

  async function handleDeleteAdminUser(id: string) {
    const previous = adminUsers;
    setAdminUsers((current) => current.filter((user) => user.id !== id));

    const response = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setAdminUsers(previous);
      setFeedback(result?.error || "Impossible de supprimer ce compte.");
      setFeedbackTone("error");
    }
  }

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
      if (!registration.sessionId) return accumulator;
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

  const availableCities = useMemo(
    () =>
      Array.from(new Set([...sessions.map((session) => session.city), ...customCities]))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "fr")),
    [sessions, customCities],
  );

  function handleAddCustomCity() {
    const city = newCityInput.trim();
    if (!city) return;
    setCustomCities((current) => (current.includes(city) ? current : [...current, city]));
    setSessionDraft((current) => ({ ...current, city }));
    setNewCityInput("");
  }

  const availableCategories = useMemo(
    () =>
      Array.from(new Set([...formations.map((formation) => formation.category), ...customCategories]))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "fr")),
    [formations, customCategories],
  );

  function handleAddCustomCategory() {
    const category = newCategoryInput.trim();
    if (!category) return;
    setCustomCategories((current) => (current.includes(category) ? current : [...current, category]));
    setFormationDraft((current) => ({ ...current, category }));
    setNewCategoryInput("");
    setIsAddingCategory(false);
  }

  const availableArticleCategories = useMemo(
    () =>
      Array.from(new Set([...articles.map((article) => article.category), ...customArticleCategories]))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "fr")),
    [articles, customArticleCategories],
  );

  function handleAddCustomArticleCategory() {
    const category = newArticleCategoryInput.trim();
    if (!category) return;
    setCustomArticleCategories((current) => (current.includes(category) ? current : [...current, category]));
    setArticleDraft((current) => ({ ...current, category }));
    setNewArticleCategoryInput("");
    setIsAddingArticleCategory(false);
  }

  const filteredSessions = sessions.filter((session) => {
    const formation = formations.find((item) => item.slug === session.formationSlug);
    const state = getSessionState(session);
    const matchesSearch = !sessionSearch.trim() || `${formation?.title || ""} ${session.city} ${session.mode}`.toLowerCase().includes(sessionSearch.trim().toLowerCase());
    const matchesState = sessionStateFilter === "Tous" || state === sessionStateFilter;
    const matchesCategory = sessionCategoryFilter === "Toutes" || formation?.category === sessionCategoryFilter;
    return matchesSearch && matchesState && matchesCategory;
  });

  async function handleRegistrationStatusChange(registrationId: string, status: string) {
    const previous = registrations;
    setRegistrations((current) => current.map((item) => (item.id === registrationId ? { ...item, status } : item)));

    const response = await fetch(`/api/admin/registrations/${registrationId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      setRegistrations(previous);
      setError("Impossible de mettre à jour le statut de cette pré-inscription.");
      return;
    }

    setSuccess("Statut mis à jour.");
  }

  function copyBulletinLink(registrationId: string, formationSlug: string) {
    const url = `${window.location.origin}/bulletin-inscription?formationSlug=${encodeURIComponent(formationSlug)}`;
    copyToClipboard(`registration-bulletin-${registrationId}`, url);
  }

  function setSuccess(message: string) {
    setFeedbackTone("success");
    setFeedback(message);
  }

  function setError(message: string) {
    setFeedbackTone("error");
    setFeedback(message);
  }

  function selectParticipant(participantId: string) {
    setSelectedParticipantId(participantId);
    setParticipantDrawerOpen(true);
    setFeedback("");
  }

  function closeParticipantDrawer() {
    setParticipantDrawerOpen(false);
  }

  function selectSession(sessionId: string) {
    const session = sessions.find((item) => item.id === sessionId);
    setEditingSessionId(sessionId);
    setSessionDraft(toSessionDraft(session));
    setFeedback("");
  }

  function openSessionDrawer(sessionId: string) {
    selectSession(sessionId);
    setSessionDrawerOpen(true);
  }

  function openNewSessionDrawer() {
    selectSession("");
    setSessionDrawerOpen(true);
  }

  function closeSessionDrawer() {
    setSessionDrawerOpen(false);
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
    setArticleBodyParagraphs(toArticleBodyParagraphs(article));
    setFeedback("");
  }

  function addArticleParagraph() {
    setArticleBodyParagraphs((current) => [...current, ""]);
  }

  function removeArticleParagraph(index: number) {
    setArticleBodyParagraphs((current) => (current.length > 1 ? current.filter((_, i) => i !== index) : current));
  }

  function updateArticleParagraph(index: number, value: string) {
    setArticleBodyParagraphs((current) => current.map((paragraph, i) => (i === index ? value : paragraph)));
  }

  function moveArticleParagraph(index: number, direction: -1 | 1) {
    setArticleBodyParagraphs((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
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
    setSessionDrawerOpen(false);
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
      body: articleBodyParagraphs.map((paragraph) => paragraph.trim()).filter(Boolean),
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
    <div className="admin-shell-v2">
      <nav className="admin-shell-v2-sidebar">
        <div className="admin-shell-v2-brand">Oxideve</div>
        <div className="admin-shell-v2-nav">
          {NAV_ITEMS.map((item) => {
            const newRegistrationsCount = item.value === "dashboard" ? registrations.filter((registration) => registration.status === "Pré-inscription (à qualifier)").length : 0;
            return (
              <button
                className={`admin-shell-v2-link${section === item.value ? " active" : ""}`}
                key={item.value}
                onClick={() => setSection(item.value)}
                type="button"
              >
                <span className="admin-shell-v2-link-icon">{item.icon}</span>
                <span>{item.label}</span>
                {newRegistrationsCount > 0 ? <span className="admin-shell-v2-link-badge">{newRegistrationsCount}</span> : null}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="admin-shell-v2-main">
        {databaseConnected === false ? (
          <p className="form-status admin-shell-v2-feedback error">
            Attention : la base de données n&apos;est pas connectée. Les données créées maintenant ne seront pas conservées après le prochain redémarrage du serveur.
          </p>
        ) : null}
        {feedback ? <p className={`form-status admin-shell-v2-feedback ${feedbackTone}`}>{feedback}</p> : null}

      {section === "dashboard" ? (
        <div className="admin-stack-grid">
          <section className="admin-shell">
            <div className="section-heading section-heading-tight">
              <div>
                <span className="eyebrow">Vue d&apos;ensemble</span>
                <h2>Dashboard</h2>
                <p>Catalogue, sessions et suivi des leads. Pour la liste détaillée, voir l&apos;onglet Inscriptions.</p>
              </div>
              <Button variant="secondary" onClick={refreshAdminData} disabled={refreshing}>
                {refreshing ? "Actualisation..." : "Rafraîchir"}
              </Button>
            </div>
            <div className="admin-metric-grid">
              <article className="admin-metric-card"><span>Catalogue</span><strong>{formations.length}</strong><small>formations</small></article>
              <article className="admin-metric-card"><span>Sessions</span><strong>{sessions.filter((session) => isUpcoming(session)).length}</strong><small>à venir</small></article>
              <article className="admin-metric-card"><span>Articles</span><strong>{articles.length}</strong><small>publiés</small></article>
            </div>
          </section>

          <section className="admin-shell">
            <div className="section-heading section-heading-tight">
              <div>
                <span className="eyebrow">Suivi</span>
                <h2>Leads et conversion</h2>
                <p>Répartition des inscriptions par statut, tous canaux confondus.</p>
              </div>
            </div>
            <div className="admin-metric-grid">
              <article className="admin-metric-card">
                <span>Total</span>
                <strong>{registrations.length}</strong>
                <small>inscriptions</small>
              </article>
              <article className="admin-metric-card">
                <span>À qualifier</span>
                <strong>{registrations.filter((r) => r.status === "Pré-inscription (à qualifier)").length}</strong>
                <small>en attente</small>
              </article>
              <article className="admin-metric-card">
                <span>BI envoyé</span>
                <strong>{registrations.filter((r) => r.status === "BI envoyé").length}</strong>
                <small>en attente de retour</small>
              </article>
              <article className="admin-metric-card">
                <span>Auto-éval</span>
                <strong>{registrations.filter((r) => r.status === "En attente auto-éval").length}</strong>
                <small>en attente</small>
              </article>
              <article className="admin-metric-card">
                <span>Complétées</span>
                <strong>{registrations.filter((r) => r.status === "Inscription complétée").length}</strong>
                <small>inscriptions</small>
              </article>
              <article className="admin-metric-card">
                <span>Taux de conversion</span>
                <strong>
                  {registrations.length
                    ? Math.round(
                        (registrations.filter((r) => r.status === "Inscription complétée" || r.status === "En attente auto-éval").length /
                          registrations.length) *
                          100,
                      )
                    : 0}
                  %
                </strong>
                <small>lead → inscription</small>
              </article>
            </div>
          </section>
        </div>
      ) : null}

      {section === "sessions" ? (
        <div className="admin-stack-grid">
          <section className="admin-shell">
            <div className="section-heading section-heading-tight">
              <div><span className="eyebrow">Planning</span><h2>Sessions</h2></div>
              <Button onClick={openNewSessionDrawer}>Nouvelle session</Button>
            </div>
            <div className="admin-filter-grid admin-filter-grid-compact">
              <label><span>Recherche</span><input className="ui-field" value={sessionSearch} onChange={(event) => setSessionSearch(event.target.value)} placeholder="Formation, ville, mode..." /></label>
              <label><span>État</span><select className="ui-field" value={sessionStateFilter} onChange={(event) => setSessionStateFilter(event.target.value)}><option>Tous</option><option>À venir</option><option>Passée</option></select></label>
              <label><span>Catégorie</span><select className="ui-field" value={sessionCategoryFilter} onChange={(event) => setSessionCategoryFilter(event.target.value)}><option>Toutes</option>{Array.from(new Set(formations.map((formation) => formation.category))).sort((a, b) => a.localeCompare(b, "fr")).map((category) => <option key={category}>{category}</option>)}</select></label>
            </div>

            {selectedSessionIds.length > 0 ? (
              <div className="admin-bulk-actions-bar">
                <span className="admin-bulk-actions-bar-label">{selectedSessionIds.length} session(s) sélectionnée(s)</span>
                <label>
                  <span>Mode masse</span>
                  <select className="ui-field" value={bulkSessionMode} onChange={(event) => setBulkSessionMode(event.target.value)}>
                    <option value="">Ne pas modifier</option>
                    {SESSION_MODE_OPTIONS.map((mode) => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Ville masse</span>
                  <select className="ui-field" value={bulkSessionCity} onChange={(event) => setBulkSessionCity(event.target.value)}>
                    <option value="">Ne pas modifier</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </label>
                <Button onClick={handleBulkSessionApply} disabled={saving || !selectedSessionIds.length}>Appliquer à {selectedSessionIds.length} session(s)</Button>
              </div>
            ) : null}

            <DataTable
              columns={[
                {
                  key: "select",
                  label: "",
                  width: "40px",
                  headerRender: () => (
                    <input
                      type="checkbox"
                      checked={filteredSessions.length > 0 && filteredSessions.every((session) => selectedSessionIds.includes(session.id))}
                      onChange={(event) => {
                        setSelectedSessionIds(event.target.checked ? filteredSessions.map((session) => session.id) : []);
                      }}
                    />
                  ),
                  render: (row) => (
                    <input
                      type="checkbox"
                      checked={selectedSessionIds.includes(row.id)}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => {
                        setSelectedSessionIds((current) =>
                          event.target.checked ? [...current, row.id] : current.filter((item) => item !== row.id),
                        );
                      }}
                    />
                  ),
                },
                {
                  key: "formation",
                  label: "Formation",
                  sortable: true,
                  sortValue: (row) => formations.find((item) => item.slug === row.formationSlug)?.shortTitle || row.formationSlug,
                  render: (row) => formations.find((item) => item.slug === row.formationSlug)?.shortTitle || row.formationSlug,
                },
                { key: "city", label: "Ville", sortable: true, sortValue: (row) => row.city, render: (row) => row.city },
                {
                  key: "dates",
                  label: "Dates",
                  sortable: true,
                  sortValue: (row) => row.startDate || "",
                  render: (row) => formatSessionRange(row.startDate, row.endDate),
                },
                { key: "mode", label: "Mode", sortable: true, sortValue: (row) => row.mode, render: (row) => row.mode },
                {
                  key: "state",
                  label: "État",
                  sortable: true,
                  sortValue: (row) => getSessionState(row),
                  render: (row) => <StatusBadge label={getSessionState(row)} tone={isUpcoming(row) ? "accent" : "default"} />,
                },
                {
                  key: "registrations",
                  label: "Inscrits",
                  sortable: true,
                  sortValue: (row) => registrationsBySession[row.id] || 0,
                  render: (row) => registrationsBySession[row.id] || 0,
                },
                {
                  key: "actions",
                  label: "Actions",
                  width: "120px",
                  render: (row) => (
                    <button className="admin-copy-button" onClick={(event) => { event.stopPropagation(); openSessionDrawer(row.id); }} type="button">
                      Modifier
                    </button>
                  ),
                },
              ]}
              rows={filteredSessions}
              getRowKey={(row) => row.id}
              emptyLabel="Aucune session ne correspond à ces filtres."
              onRowClick={(row) => openSessionDrawer(row.id)}
              isRowActive={(row) => editingSessionId === row.id && sessionDrawerOpen}
              pageSize={15}
            />
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

          <Drawer
            open={sessionDrawerOpen}
            onClose={closeSessionDrawer}
            title={editingSessionId ? "Modifier la session" : "Créer une session"}
          >
            <form className="contact-form" onSubmit={handleSessionSubmit}>
              <div className="form-grid">
                <label><span>Formation</span><select className="ui-field" value={sessionDraft.formationSlug} onChange={(event) => setSessionDraft((current) => ({ ...current, formationSlug: event.target.value }))} required><option value="">Choisir</option>{formations.map((formation) => <option key={formation.slug} value={formation.slug}>{formation.title}</option>)}</select></label>
                <label>
                  <span>Ville</span>
                  <select
                    className="ui-field"
                    value={availableCities.includes(sessionDraft.city) ? sessionDraft.city : ""}
                    onChange={(event) => {
                      if (event.target.value === "__new__") return;
                      setSessionDraft((current) => ({ ...current, city: event.target.value }));
                    }}
                    required
                  >
                    <option value="">Choisir</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                    <option value="__new__">+ Ajouter une nouvelle ville</option>
                  </select>
                </label>
                <label><span>Début</span><input className="ui-field" type="date" value={sessionDraft.startDate} onChange={(event) => setSessionDraft((current) => ({ ...current, startDate: event.target.value }))} required /></label>
                <label><span>Fin</span><input className="ui-field" type="date" value={sessionDraft.endDate} onChange={(event) => setSessionDraft((current) => ({ ...current, endDate: event.target.value }))} required /></label>
                <label>
                  <span>Mode</span>
                  <select className="ui-field" value={sessionDraft.mode} onChange={(event) => setSessionDraft((current) => ({ ...current, mode: event.target.value }))} required>
                    <option value="">Choisir</option>
                    {SESSION_MODE_OPTIONS.map((mode) => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                <span>Nouvelle ville</span>
                <div className="admin-bulk-grid">
                  <input
                    className="ui-field"
                    value={newCityInput}
                    onChange={(event) => setNewCityInput(event.target.value)}
                    placeholder="Nom de la ville"
                  />
                  <Button type="button" variant="secondary" onClick={handleAddCustomCity} disabled={!newCityInput.trim()}>
                    Ajouter
                  </Button>
                </div>
              </label>
              <div className="admin-session-overview">
                <div><span>État</span><strong>{editingSessionId ? getSessionState(sessions.find((item) => item.id === editingSessionId) || sessions[0]) : "Nouvelle"}</strong></div>
                <div><span>Inscrits</span><strong>{registrationsBySession[editingSessionId] || 0}</strong></div>
              </div>
              <div className="admin-form-actions">
                <Button disabled={saving} type="submit">{saving ? "Enregistrement..." : editingSessionId ? "Mettre à jour" : "Créer la session"}</Button>
              </div>
            </form>

            {editingSessionId ? (
              <div className="admin-form-section">
                <div className="section-heading section-heading-tight">
                  <h3>Inscrits à cette session</h3>
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
                <DataTable
                  columns={[
                    { key: "company", label: "Société", sortable: true, sortValue: (row) => row.company, render: (row) => row.company },
                    { key: "contact", label: "Contact", sortable: true, sortValue: (row) => row.contactName, render: (row) => row.contactName },
                    { key: "email", label: "Email", render: (row) => row.email },
                    { key: "phone", label: "Téléphone", render: (row) => row.phone },
                    {
                      key: "createdAt",
                      label: "Inscrit le",
                      sortable: true,
                      sortValue: (row) => row.createdAt,
                      render: (row) => formatRegistrationDate(row.createdAt),
                    },
                    {
                      key: "actions",
                      label: "",
                      width: "110px",
                      render: (row) => (
                        <button
                          className="admin-copy-button"
                          onClick={() =>
                            copyToClipboard(row.id, `${row.company} - ${row.contactName} - ${row.email} - ${row.phone}`)
                          }
                          type="button"
                        >
                          {copiedKey === row.id ? "Copié !" : "Copier"}
                        </button>
                      ),
                    },
                  ]}
                  rows={editingSessionRegistrations}
                  getRowKey={(row) => row.id}
                  emptyLabel="Aucun inscrit pour cette session pour le moment."
                  pageSize={10}
                />
              </div>
            ) : null}
          </Drawer>
        </div>
      ) : null}

      {section === "formations" ? (
        <div className="admin-dual-pane">
          <section className="admin-shell">
            <div className="section-heading section-heading-tight"><div><span className="eyebrow">Catalogue</span><h2>Formations</h2></div><Button onClick={() => { setEditingFormationSlug(""); setFormationDraft(toFormationDraft()); }}>Nouvelle formation</Button></div>
            <div className="admin-filter-grid admin-filter-grid-compact">
              <label><span>Recherche</span><input className="ui-field" value={formationSearch} onChange={(event) => setFormationSearch(event.target.value)} placeholder="Nom, catégorie..." /></label>
            </div>
            <div className="admin-list admin-list-dense">
              {formations
                .filter((formation) => !formationSearch.trim() || `${formation.title} ${formation.category}`.toLowerCase().includes(formationSearch.trim().toLowerCase()))
                .sort((a, b) => a.title.localeCompare(b.title, "fr")).map((formation) => (
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
            <nav className="admin-form-toc">
              <a href="#formation-section-identite">Identité</a>
              <a href="#formation-section-contenu">Contenu</a>
              <a href="#formation-section-pratique">Infos pratiques</a>
            </nav>
            <form className="contact-form" onSubmit={handleFormationSubmit}>
              <div className="admin-form-section" id="formation-section-identite"><h3>Identité</h3><div className="form-grid">
                <label><span>Slug</span><input className="ui-field" disabled={Boolean(editingFormationSlug)} value={formationDraft.slug} onChange={(event) => setFormationDraft((current) => ({ ...current, slug: event.target.value }))} required /></label>
                <label><span>Nom complet</span><input className="ui-field" value={formationDraft.title} onChange={(event) => setFormationDraft((current) => ({ ...current, title: event.target.value }))} required /></label>
                <label><span>Nom court</span><input className="ui-field" value={formationDraft.shortTitle} onChange={(event) => setFormationDraft((current) => ({ ...current, shortTitle: event.target.value }))} required /></label>
                <label>
                  <span>Catégorie</span>
                  {isAddingCategory ? (
                    <div className="admin-bulk-grid">
                      <input
                        className="ui-field"
                        value={newCategoryInput}
                        onChange={(event) => setNewCategoryInput(event.target.value)}
                        placeholder="Nom de la catégorie"
                        autoFocus
                      />
                      <Button type="button" variant="secondary" onClick={handleAddCustomCategory} disabled={!newCategoryInput.trim()}>
                        Ajouter
                      </Button>
                    </div>
                  ) : (
                    <select
                      className="ui-field"
                      value={availableCategories.includes(formationDraft.category) ? formationDraft.category : ""}
                      onChange={(event) => {
                        if (event.target.value === "__new__") {
                          setIsAddingCategory(true);
                          return;
                        }
                        setFormationDraft((current) => ({ ...current, category: event.target.value }));
                      }}
                      required
                    >
                      <option value="">Choisir</option>
                      {availableCategories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                      <option value="__new__">+ Ajouter une nouvelle catégorie</option>
                    </select>
                  )}
                </label>
                <label><span>Durée</span><input className="ui-field" value={formationDraft.duration} onChange={(event) => setFormationDraft((current) => ({ ...current, duration: event.target.value }))} required /></label>
                <label>
                  <span>Lieu par défaut (si aucune session programmée)</span>
                  <input className="ui-field" value={formationDraft.location} onChange={(event) => setFormationDraft((current) => ({ ...current, location: event.target.value }))} required />
                  <p className="admin-field-hint">Affiché sur la fiche publique tant qu&apos;aucune session n&apos;est planifiée. Dès qu&apos;une session existe, sa ville réelle prend le dessus automatiquement.</p>
                </label>
                <label><span>Public</span><input className="ui-field" value={formationDraft.audience} onChange={(event) => setFormationDraft((current) => ({ ...current, audience: event.target.value }))} required /></label>
                <label><span>Tarif</span><input className="ui-field" value={formationDraft.price} onChange={(event) => setFormationDraft((current) => ({ ...current, price: event.target.value }))} required /></label>
              </div></div>
              <div className="admin-form-section" id="formation-section-contenu"><h3>Contenu</h3>
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
              <div className="admin-form-section" id="formation-section-pratique"><h3>Infos pratiques</h3><div className="form-grid">
                <label><span>Détails durée</span><textarea className="ui-field" rows={4} value={formationDraft.durationDetails} onChange={(event) => setFormationDraft((current) => ({ ...current, durationDetails: event.target.value }))} required /></label>
                <label><span>Détails tarif</span><textarea className="ui-field" rows={4} value={formationDraft.priceDetails} onChange={(event) => setFormationDraft((current) => ({ ...current, priceDetails: event.target.value }))} required /></label>
                <label><span>Taux de réussite</span><input className="ui-field" value={formationDraft.successRate} onChange={(event) => setFormationDraft((current) => ({ ...current, successRate: event.target.value }))} required /></label>
                <label><span>Accessibilité</span><textarea className="ui-field" rows={4} value={formationDraft.handicapPolicy} onChange={(event) => setFormationDraft((current) => ({ ...current, handicapPolicy: event.target.value }))} required /></label>
              </div>
                <label><span>Finalité / certification</span><textarea className="ui-field" rows={3} value={formationDraft.certification} onChange={(event) => setFormationDraft((current) => ({ ...current, certification: event.target.value }))} required /></label>
              </div>
              <Button disabled={saving} type="submit">{saving ? "Enregistrement..." : editingFormationSlug ? "Mettre à jour" : "Créer la formation"}</Button>
            </form>
          </section>
        </div>
      ) : null}

      {section === "editorial" ? (
        <div className="admin-dual-pane">
          <section className="admin-shell">
            <div className="section-heading section-heading-tight"><div><span className="eyebrow">Editorial</span><h2>Articles</h2></div><Button variant="secondary" onClick={() => { setEditingArticleSlug(""); setArticleDraft(toArticleDraft()); setArticleBodyParagraphs(toArticleBodyParagraphs()); }}>Nouvel article</Button></div>
            <label className="admin-list-search"><span>Recherche</span><input className="ui-field" value={articleSearch} onChange={(event) => setArticleSearch(event.target.value)} placeholder="Titre, catégorie..." /></label>
            <div className="admin-list admin-list-dense">
              {articles
                .filter((article) => !articleSearch.trim() || `${article.title} ${article.category}`.toLowerCase().includes(articleSearch.trim().toLowerCase()))
                .sort((a, b) => compareDateDesc(a.publishedAt, b.publishedAt)).map((article) => (
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
                <label>
                  <span>Catégorie</span>
                  {isAddingArticleCategory ? (
                    <div className="admin-bulk-grid">
                      <input
                        className="ui-field"
                        value={newArticleCategoryInput}
                        onChange={(event) => setNewArticleCategoryInput(event.target.value)}
                        placeholder="Nom de la catégorie"
                        autoFocus
                      />
                      <Button type="button" variant="secondary" onClick={handleAddCustomArticleCategory} disabled={!newArticleCategoryInput.trim()}>
                        Ajouter
                      </Button>
                    </div>
                  ) : (
                    <select
                      className="ui-field"
                      value={availableArticleCategories.includes(articleDraft.category) ? articleDraft.category : ""}
                      onChange={(event) => {
                        if (event.target.value === "__new__") {
                          setIsAddingArticleCategory(true);
                          return;
                        }
                        setArticleDraft((current) => ({ ...current, category: event.target.value }));
                      }}
                      required
                    >
                      <option value="">Choisir</option>
                      {availableArticleCategories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                      <option value="__new__">+ Ajouter une nouvelle catégorie</option>
                    </select>
                  )}
                </label>
                <label><span>Lecture</span><input className="ui-field" value={articleDraft.readingTime} onChange={(event) => setArticleDraft((current) => ({ ...current, readingTime: event.target.value }))} required /></label>
                <label><span>Publication</span><input className="ui-field" type="date" value={articleDraft.publishedAt} onChange={(event) => setArticleDraft((current) => ({ ...current, publishedAt: event.target.value }))} required /></label>
                <label><span>Formation liée</span><select className="ui-field" value={articleDraft.featuredFormationSlug} onChange={(event) => setArticleDraft((current) => ({ ...current, featuredFormationSlug: event.target.value }))}><option value="">Aucune</option>{formations.map((formation) => <option key={formation.slug} value={formation.slug}>{formation.title}</option>)}</select></label>
              </div>
              <label><span>Extrait</span><textarea className="ui-field" rows={4} value={articleDraft.excerpt} onChange={(event) => setArticleDraft((current) => ({ ...current, excerpt: event.target.value }))} required /></label>
              <div className="admin-programme-editor">
                <div className="admin-programme-editor-header">
                  <span>Corps de l&apos;article</span>
                  <Button variant="secondary" type="button" onClick={addArticleParagraph}>Ajouter un paragraphe</Button>
                </div>
                {articleBodyParagraphs.map((paragraph, index) => (
                  <div className="admin-article-paragraph" key={index}>
                    <div className="admin-programme-row">
                      <label className="admin-programme-title-field">
                        <span>Paragraphe {index + 1}</span>
                        <textarea
                          className="ui-field"
                          rows={4}
                          value={paragraph}
                          onChange={(event) => updateArticleParagraph(index, event.target.value)}
                        />
                      </label>
                      <div className="admin-article-paragraph-actions">
                        <Button variant="ghost" type="button" onClick={() => moveArticleParagraph(index, -1)} disabled={index === 0}>Monter</Button>
                        <Button variant="ghost" type="button" onClick={() => moveArticleParagraph(index, 1)} disabled={index === articleBodyParagraphs.length - 1}>Descendre</Button>
                        <Button variant="ghost" type="button" onClick={() => removeArticleParagraph(index)} disabled={articleBodyParagraphs.length <= 1}>Supprimer ce paragraphe</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button disabled={saving} type="submit">{saving ? "Enregistrement..." : editingArticleSlug ? "Mettre à jour" : "Créer l'article"}</Button>
            </form>
          </section>
        </div>
      ) : null}

      {section === "accounts" ? (
        <div className="admin-stack-grid">
          <section className="admin-shell">
            <div className="section-heading section-heading-tight">
              <div>
                <span className="eyebrow">Sécurité</span>
                <h2>Comptes administrateurs</h2>
                <p>Créez un identifiant pour chaque personne qui gère le site. Chacun se connecte avec son propre email et mot de passe.</p>
              </div>
            </div>
            <form className="contact-form" onSubmit={handleCreateAdminUser}>
              <div className="form-grid">
                <label>
                  <span>Nom</span>
                  <input className="ui-field" value={newAdminName} onChange={(event) => setNewAdminName(event.target.value)} placeholder="Prénom Nom" />
                </label>
                <label>
                  <span>Email</span>
                  <input className="ui-field" type="email" value={newAdminEmail} onChange={(event) => setNewAdminEmail(event.target.value)} required placeholder="prenom@oxideve.com" />
                </label>
                <label>
                  <span>Mot de passe</span>
                  <input className="ui-field" type="password" value={newAdminPassword} onChange={(event) => setNewAdminPassword(event.target.value)} required minLength={8} placeholder="8 caractères minimum" />
                </label>
              </div>
              <Button disabled={creatingAdmin} type="submit">{creatingAdmin ? "Création..." : "Créer le compte"}</Button>
            </form>
          </section>

          <section className="admin-shell">
            <div className="section-heading section-heading-tight">
              <div>
                <span className="eyebrow">Accès</span>
                <h2>Comptes existants</h2>
              </div>
            </div>
            <DataTable<AdminUser>
              rows={adminUsers}
              getRowKey={(user) => user.id}
              emptyLabel="Aucun compte administrateur pour le moment."
              columns={[
                { key: "name", label: "Nom", render: (user) => user.name || "—" },
                { key: "email", label: "Email", render: (user) => user.email },
                {
                  key: "lastLoginAt",
                  label: "Dernière connexion",
                  render: (user) => (user.lastLoginAt ? formatDateLabel(user.lastLoginAt) : "Jamais"),
                },
                {
                  key: "actions",
                  label: "Actions",
                  width: "120px",
                  render: (user) => (
                    <button className="ui-button ui-button-ghost" type="button" onClick={() => handleDeleteAdminUser(user.id)}>
                      Supprimer
                    </button>
                  ),
                },
              ]}
            />
          </section>
        </div>
      ) : null}

      {section === "participants" ? (
        <div className="admin-stack-grid">
          <section className="admin-shell">
            <div className="section-heading section-heading-tight">
              <div>
                <span className="eyebrow">Suivi</span>
                <h2>Inscriptions</h2>
                <p>Toutes les demandes, du premier contact à l&apos;inscription complétée — pré-inscriptions rapides et bulletins d&apos;inscription fusionnés en une seule liste par personne.</p>
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
                  {[...MANUAL_REGISTRATION_STATUSES, ...AUTOMATIC_REGISTRATION_STATUSES].map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
            </div>

            <DataTable
              columns={[
                { key: "fullName", label: "Nom", sortable: true, sortValue: (row) => row.fullName, render: (row) => row.fullName },
                { key: "company", label: "Entreprise", sortable: true, sortValue: (row) => row.company, render: (row) => row.company },
                {
                  key: "formation",
                  label: "Formation",
                  sortable: true,
                  sortValue: (row) => formations.find((item) => item.slug === row.formationSlug)?.shortTitle || row.formationSlug,
                  render: (row) => formations.find((item) => item.slug === row.formationSlug)?.shortTitle || row.formationSlug,
                },
                {
                  key: "status",
                  label: "Statut",
                  sortable: true,
                  sortValue: (row) => row.status,
                  width: "190px",
                  render: (row) =>
                    row.registrationId && !AUTOMATIC_REGISTRATION_STATUSES.includes(row.status) ? (
                      <select
                        className="ui-field admin-inline-select"
                        value={row.status}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => row.registrationId && handleRegistrationStatusChange(row.registrationId, event.target.value)}
                      >
                        {MANUAL_REGISTRATION_STATUSES.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    ) : (
                      <StatusBadge
                        label={row.status}
                        tone={AUTOMATIC_REGISTRATION_STATUSES.includes(row.status) ? "accent" : row.status === "Non intéressé" ? "soft" : "default"}
                      />
                    ),
                },
                {
                  key: "quiz",
                  label: "Auto-éval",
                  sortable: true,
                  sortValue: (row) => (row.quizAttempt ? row.quizAttempt.scoreOn20 : row.hasQuiz ? -1 : -2),
                  render: (row) => {
                    if (!row.hasQuiz) return <span className="admin-list-item-meta">Non applicable</span>;
                    if (row.quizAttempt) return `${row.quizAttempt.scoreOn20} / 20`;
                    return <span className="admin-list-item-meta">En attente</span>;
                  },
                },
                {
                  key: "actions",
                  label: "Actions",
                  width: "190px",
                  render: (row) => (
                    <div className="admin-row-actions">
                      <button
                        className="admin-copy-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          copyBulletinLink(row.registrationId || row.id, row.formationSlug);
                        }}
                        type="button"
                      >
                        {copiedKey === `registration-bulletin-${row.registrationId || row.id}` ? "Copié !" : "Copier"}
                      </button>
                      {row.bulletinInscriptionId ? (
                        <a
                          className="admin-copy-button"
                          href={`/api/admin/bulletin-inscriptions/${row.bulletinInscriptionId}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                        >
                          PDF
                        </a>
                      ) : null}
                    </div>
                  ),
                },
              ]}
              rows={filteredParticipants}
              getRowKey={(row) => row.id}
              emptyLabel="Aucune inscription ne correspond à ces filtres."
              onRowClick={(row) => selectParticipant(row.id)}
              isRowActive={(row) => selectedParticipantId === row.id}
              getRowClassName={(row) => (row.status === "Pré-inscription (à qualifier)" ? "admin-data-table-row-new" : "")}
              pageSize={15}
            />
          </section>

          <Drawer
            open={participantDrawerOpen && Boolean(selectedParticipant)}
            onClose={closeParticipantDrawer}
            title={selectedParticipant ? selectedParticipant.fullName : "Détail de l'inscrit"}
          >
            {selectedParticipant ? (
              <>
              <div className="admin-form-section">
                <p className="admin-list-item-meta">
                  {selectedParticipant.status}
                  {" · Auto-évaluation : "}
                  {!selectedParticipant.hasQuiz
                    ? "non applicable à cette formation"
                    : selectedParticipant.quizAttempt
                      ? `${selectedParticipant.quizAttempt.scoreOn20} / 20`
                      : "en attente"}
                </p>
                <h3>Coordonnées</h3>
                <div className="form-grid">
                  <DetailField label="Origine" value={selectedParticipant.origin} copyKey="p-origin" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                  <DetailField label="Nom" value={selectedParticipant.fullName} copyKey="p-name" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                  <DetailField label="Entreprise" value={selectedParticipant.company} copyKey="p-company" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                  <DetailField label="Email" value={selectedParticipant.email} copyKey="p-email" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                  <DetailField label="Téléphone" value={selectedParticipant.phone} copyKey="p-phone" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                  <DetailField label="Formation" value={formations.find((item) => item.slug === selectedParticipant.formationSlug)?.title || selectedParticipant.formationSlug} copyKey="p-formation" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                  <DetailField label="Premier contact" value={formatRegistrationDate(selectedParticipant.firstContactAt)} copyKey="p-firstcontact" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                  {selectedParticipant.message ? (
                    <DetailField label="Besoin" value={selectedParticipant.message} copyKey="p-message" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                  ) : null}
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
                      <DetailField label="Comment il nous a connu" value={selectedParticipantBulletin.source || "Non renseignée"} copyKey="b-source" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                      <DetailField label="Raison sociale" value={selectedParticipantBulletin.companyName} copyKey="b-company" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                      <DetailField label="SIRET" value={selectedParticipantBulletin.siret || "Non renseigné"} copyKey="b-siret" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                      <DetailField label="Commanditaire" value={`${selectedParticipantBulletin.sponsorFullName} (${selectedParticipantBulletin.sponsorRole || "fonction non renseignée"})`} copyKey="b-sponsor" copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                    </div>
                  </div>

                  <div className="admin-form-section">
                    <h3>{selectedParticipantBulletin.learners.length > 1 ? "Apprenants" : "Apprenant"}</h3>
                    {selectedParticipantBulletin.learners.map((learner, index) => (
                      <div className="form-grid" key={index}>
                        {selectedParticipantBulletin.learners.length > 1 ? (
                          <p className="admin-list-item-meta">Apprenant {index + 1}</p>
                        ) : null}
                        <DetailField label="Nom" value={learner.fullName} copyKey={`b-learner-name-${index}`} copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                        <DetailField label="Fonction" value={learner.role || "Non renseignée"} copyKey={`b-learner-role-${index}`} copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                        <DetailField label="Téléphone" value={learner.phone || "Non renseigné"} copyKey={`b-learner-phone-${index}`} copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                        <DetailField label="Date de naissance" value={formatShortDateFr(learner.birthDate)} copyKey={`b-learner-birth-${index}`} copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                        <DetailField label="Situation de handicap" value={learner.hasDisability ? "Oui" : "Non"} copyKey={`b-learner-disability-${index}`} copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
                      </div>
                    ))}
                  </div>

                  <div className="admin-form-section">
                    <h3>Auto-évaluation</h3>
                    {selectedParticipantBulletin.quizAttempts.length === 0 ? (
                      <p className="admin-empty-state">L&apos;apprenant n&apos;a pas encore réalisé son auto-évaluation.</p>
                    ) : (
                      <div className="admin-list admin-list-dense">
                        {selectedParticipantBulletin.quizAttempts.map((attempt) => (
                          <div className="admin-list-item" key={attempt.id}>
                            <strong>{attempt.learnerFullName || "Apprenant non renseigné"} — Score : {attempt.scoreOn20} / 20</strong>
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
              </>
            ) : null}
          </Drawer>
        </div>
      ) : null}
      </div>
    </div>
  );
}