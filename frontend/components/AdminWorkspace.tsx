"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { DataTable } from "@/components/admin/DataTable";
import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { getArticleCover } from "@/components/NewsCard";
import { Drawer } from "@/components/admin/Drawer";
import { getCategoryTheme, type CategoryVisual } from "@/lib/formation-theme";
import type { AdminUser, Article, Review, BulletinInscriptionWithAttempts, Company, CrmInteraction, CrmTask, Formation, Participant, ProgrammeDay, Registration, RegistrationNote, Session } from "../../shared/types";

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

type Section = "dashboard" | "sessions" | "participants" | "clients" | "formations" | "visuels" | "editorial" | "avis" | "accounts";

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
  levelLabel: string;
  subCategory: string;
  cpfEligible: boolean;
  bannerImage: string;
  bannerPosition: string;
  tilePosition: string;
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
  bodyHtml: string;
  readingTime: string;
  publishedAt: string;
  featuredFormationSlug: string;
  coverImageUrl: string;
  published: boolean;
  indexable: boolean;
  seoTitle: string;
  seoDescription: string;
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
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}`;
}

function formatShortDateTimeFr(value: string) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${get("day")}/${get("month")}/${get("year")} - ${get("hour")}h${get("minute")}`;
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
      levelLabel: "",
      subCategory: "",
      cpfEligible: false,
      bannerImage: "",
      bannerPosition: "",
      tilePosition: "",
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
    levelLabel: formation.levelLabel || "",
    subCategory: formation.subCategory || "",
    cpfEligible: Boolean(formation.cpfEligible),
    bannerImage: formation.bannerImage || "",
    bannerPosition: formation.bannerPosition || "",
    tilePosition: formation.tilePosition || "",
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

/**
 * Vrai si l'extrait correspond au début du contenu : c'est alors celui que le
 * serveur a généré, pas un texte écrit par l'utilisateur.
 */
function isGeneratedExcerpt(article: Article) {
  if (!article.excerpt || !article.bodyHtml) return false;

  const plain = article.bodyHtml
    .replace(/<[^>]*>/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  return plain.startsWith(article.excerpt.replace(/…$/, "").trim().slice(0, 60));
}

function toArticleDraft(article?: Article): ArticleDraft {
  return {
    slug: article?.slug || "",
    title: article?.title || "",
    category: article?.category || "",
    // L'extrait est recalculé à chaque enregistrement quand il est vide. On ne
    // le pré-remplit donc que s'il diffère de ce qui serait généré, sinon
    // l'utilisateur croit avoir écrit un texte qu'il n'a pas saisi.
    excerpt: article?.excerpt && !isGeneratedExcerpt(article) ? article.excerpt : "",
    // L'éditeur reçoit le HTML brut stocké, jamais le rendu public filtré :
    // sinon les tailles d'images et les blocs seraient perdus à chaque édition.
    bodyHtml: article?.bodyHtml || "",
    readingTime: article?.readingTime || "",
    publishedAt: article?.publishedAt || new Date().toISOString().slice(0, 10),
    featuredFormationSlug: article?.featuredFormationSlug || "",
    coverImageUrl: article?.coverImageUrl || "",
    published: article?.published !== false,
    indexable: article?.indexable !== false,
    seoTitle: article?.seoTitle || "",
    seoDescription: article?.seoDescription || "",
  };
}

type DetailFieldProps = {
  label: string;
  value: string;
  copyKey: string;
  copiedKey: string;
  copyToClipboard: (key: string, text: string) => void;
};

/** Sous-familles prévues par catégorie, proposées à la saisie. */
const SUB_CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  "Sécurité au travail": ["Électricité", "Travail en hauteur", "Sauveteur secouriste du travail", "Incendie"],
};

const NAV_ITEMS: { value: Section; label: string; icon: string }[] = [
  { value: "dashboard", label: "Dashboard", icon: "◧" },
  { value: "sessions", label: "Sessions", icon: "◷" },
  { value: "participants", label: "Inscriptions", icon: "◍" },
  { value: "clients", label: "Clients", icon: "◈" },
  { value: "formations", label: "Formations", icon: "▤" },
  { value: "visuels", label: "Visuels", icon: "◩" },
  { value: "editorial", label: "Editorial", icon: "✎" },
  { value: "avis", label: "Avis", icon: "★" },
  { value: "accounts", label: "Comptes", icon: "◉" },
];

function StatusBadge({ label, tone = "default" }: { label: string; tone?: "default" | "accent" | "soft" | "negative" }) {
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
  const [companies, setCompanies] = useState(initialCompanies);
  const [refreshing, setRefreshing] = useState(false);

  async function refreshAdminData() {
    setRefreshing(true);
    setFeedback("");

    try {
      const [registrationsResponse, bulletinsResponse, participantsResponse, companiesResponse] = await Promise.all([
        fetch("/api/admin/registrations"),
        fetch("/api/admin/bulletin-inscriptions"),
        fetch("/api/admin/participants"),
        fetch("/api/admin/companies"),
      ]);

      const [registrationsResult, bulletinsResult, participantsResult, companiesResult] = await Promise.all([
        registrationsResponse.json().catch(() => null),
        bulletinsResponse.json().catch(() => null),
        participantsResponse.json().catch(() => null),
        companiesResponse.json().catch(() => null),
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

      if (companiesResponse.ok && companiesResult?.data) {
        setCompanies(companiesResult.data);
      } else {
        failures.push("clients");
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
  const [formationDrawerOpen, setFormationDrawerOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(initialSessions[0]?.id || "");
  const [customCities, setCustomCities] = useState<string[]>([]);
  const [newCityInput, setNewCityInput] = useState("");
  const [editingArticleSlug, setEditingArticleSlug] = useState(initialArticles[0]?.slug || "");
  const [selectedParticipantId, setSelectedParticipantId] = useState("");

  const [participantSearch, setParticipantSearch] = useState("");
  const [participantFormationFilter, setParticipantFormationFilter] = useState("Toutes");
  const [participantStatusFilter, setParticipantStatusFilter] = useState("Tous");

  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientKey, setSelectedClientKey] = useState("");
  const [clientDrawerOpen, setClientDrawerOpen] = useState(false);

  const [formationDraft, setFormationDraft] = useState(toFormationDraft(initialFormations[0]));
  const [sessionDraft, setSessionDraft] = useState(toSessionDraft(initialSessions[0]));
  const [articleDraft, setArticleDraft] = useState(toArticleDraft(initialArticles[0]));
  const [articleSearch, setArticleSearch] = useState("");
  const [articleImageUploading, setArticleImageUploading] = useState(false);

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
  const [formationCategoryFilter, setFormationCategoryFilter] = useState("Toutes");

  const [participantDrawerOpen, setParticipantDrawerOpen] = useState(false);
  const [participantNotes, setParticipantNotes] = useState<RegistrationNote[]>([]);
  const [newParticipantNote, setNewParticipantNote] = useState("");
  const [savingParticipantNotes, setSavingParticipantNotes] = useState(false);

  const [manualRegistrationDrawerOpen, setManualRegistrationDrawerOpen] = useState(false);
  const [manualRegistrationDraft, setManualRegistrationDraft] = useState({
    company: "",
    contactName: "",
    email: "",
    phone: "",
    formationSlug: "",
    sessionId: "",
    message: "",
  });

  function openManualRegistrationDrawer() {
    setManualRegistrationDraft({ company: "", contactName: "", email: "", phone: "", formationSlug: "", sessionId: "", message: "" });
    setManualRegistrationDrawerOpen(true);
  }

  function closeManualRegistrationDrawer() {
    setManualRegistrationDrawerOpen(false);
  }

  async function handleManualRegistrationSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFeedback("");

    const response = await fetch("/api/admin/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: manualRegistrationDraft.company.trim(),
        contactName: manualRegistrationDraft.contactName.trim(),
        email: manualRegistrationDraft.email.trim(),
        phone: manualRegistrationDraft.phone.trim(),
        formationSlug: manualRegistrationDraft.formationSlug,
        sessionId: manualRegistrationDraft.sessionId || undefined,
        message: manualRegistrationDraft.message.trim(),
      }),
    });

    const result = (await response.json().catch(() => null)) as { data?: Registration; error?: string } | null;
    setSaving(false);

    if (!response.ok || !result?.data) {
      setError(result?.error || "Impossible d'ajouter cette inscription.");
      return;
    }

    setRegistrations((current) => [result.data as Registration, ...current]);
    setSuccess("Inscription ajoutée.");
    closeManualRegistrationDrawer();
    refreshAdminData();
  }


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetSection = params.get("section");
    const targetRegistrationId = params.get("registrationId");

    if (targetSection === "participants") {
      setSection("participants");
    }

    if (targetRegistrationId) {
      const participant = initialParticipants.find((item) => item.registrationId === targetRegistrationId);
      if (participant) {
        setSelectedParticipantId(participant.id);
        setParticipantDrawerOpen(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  async function handleDeleteAdminUser(id: string, label: string) {
    if (!window.confirm(`Supprimer définitivement le compte "${label}" ? Cette action est irréversible.`)) {
      return;
    }

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
    () =>
      registrations.filter(
        (registration) => registration.sessionId === editingSessionId && registration.status === "Inscription complétée",
      ),
    [registrations, editingSessionId],
  );

  const registrationsByFormation = useMemo(() => {
    return registrations.reduce<Record<string, number>>((accumulator, registration) => {
      accumulator[registration.formationSlug] = (accumulator[registration.formationSlug] || 0) + 1;
      return accumulator;
    }, {});
  }, [registrations]);

  function clientKeyForParticipant(participant: Participant) {
    return participant.companyId || `name::${participant.company.trim().toLowerCase()}`;
  }

  type ClientGroup = {
    key: string;
    name: string;
    company?: Company;
    participants: Participant[];
  };

  const clientGroups = useMemo<ClientGroup[]>(() => {
    const companiesById = new Map(companies.map((company) => [company.id, company]));
    const groups = new Map<string, ClientGroup>();

    for (const participant of participants) {
      if (!participant.company.trim()) continue;
      const key = clientKeyForParticipant(participant);
      const existing = groups.get(key);

      if (existing) {
        existing.participants.push(participant);
      } else {
        groups.set(key, {
          key,
          name: participant.company,
          company: participant.companyId ? companiesById.get(participant.companyId) : undefined,
          participants: [participant],
        });
      }
    }

    return Array.from(groups.values()).sort((left, right) =>
      compareDateDesc(
        left.participants[0]?.firstContactAt || "",
        right.participants[0]?.firstContactAt || "",
      ),
    );
  }, [companies, participants]);

  const filteredClientGroups = useMemo(() => {
    const search = clientSearch.trim().toLowerCase();
    if (!search) return clientGroups;

    return clientGroups.filter((group) => {
      const haystack = [group.name, group.company?.contactName, group.company?.email, ...group.participants.map((item) => item.email)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [clientGroups, clientSearch]);

  const selectedClientGroup = clientGroups.find((group) => group.key === selectedClientKey);

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

  /**
   * Sous-catégories proposées : les valeurs de référence prévues pour la
   * catégorie sélectionnée, complétées par celles déjà saisies ailleurs.
   */
  const availableSubCategories = useMemo(() => {
    const reference = SUB_CATEGORY_SUGGESTIONS[formationDraft.category] || [];
    const used = formations.map((formation) => formation.subCategory || "").filter(Boolean);
    return Array.from(new Set([...reference, ...used])).sort((a, b) => a.localeCompare(b, "fr"));
  }, [formationDraft.category, formations]);

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
    const previousRegistrations = registrations;
    const previousParticipants = participants;
    setRegistrations((current) => current.map((item) => (item.id === registrationId ? { ...item, status } : item)));
    setParticipants((current) => current.map((item) => (item.registrationId === registrationId ? { ...item, status } : item)));

    const response = await fetch(`/api/admin/registrations/${registrationId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      setRegistrations(previousRegistrations);
      setParticipants(previousParticipants);
      setError("Impossible de mettre à jour le statut de cette pré-inscription.");
      return;
    }

    setSuccess("Statut mis à jour.");
  }

  async function handleDeleteRegistration(participantId: string, registrationId: string | null, label: string) {
    if (!registrationId) {
      setError("Cette ligne n'a pas d'inscription associée à supprimer.");
      return;
    }

    if (!window.confirm(`Supprimer définitivement l'inscription de "${label}" ? Cette action est irréversible.`)) {
      return;
    }

    const previousRegistrations = registrations;
    const previousParticipants = participants;
    setRegistrations((current) => current.filter((item) => item.id !== registrationId));
    setParticipants((current) => current.filter((item) => item.id !== participantId));

    const response = await fetch(`/api/admin/registrations/${registrationId}`, { method: "DELETE" });

    if (!response.ok && response.status !== 204) {
      setRegistrations(previousRegistrations);
      setParticipants(previousParticipants);
      setError("Impossible de supprimer cette inscription.");
      return;
    }

    setSuccess("Inscription supprimée.");
  }

  function copyBulletinLink(
    registrationId: string,
    formationSlug: string,
    prefill?: { company?: string; fullName?: string; email?: string; phone?: string },
  ) {
    const params = new URLSearchParams({ formationSlug });
    if (prefill?.company) params.set("companyName", prefill.company);
    if (prefill?.fullName) params.set("sponsorFullName", prefill.fullName);
    if (prefill?.email) params.set("sponsorEmail", prefill.email);
    if (prefill?.phone) params.set("sponsorPhone", prefill.phone);

    const url = `${window.location.origin}/bulletin-inscription?${params.toString()}`;
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
    setNewParticipantNote("");
    setParticipantNotes([]);

    const participant = participants.find((item) => item.id === participantId);
    if (!participant?.registrationId) return;

    const registrationId = participant.registrationId;
    fetch(`/api/admin/registrations/${registrationId}/notes`)
      .then((response) => response.json())
      .then((result: { data?: RegistrationNote[] }) => {
        if (result?.data) setParticipantNotes(result.data);
      })
      .catch(() => undefined);
  }

  async function addParticipantNote() {
    if (!selectedParticipant?.registrationId || !newParticipantNote.trim()) return;

    setSavingParticipantNotes(true);
    const registrationId = selectedParticipant.registrationId;

    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newParticipantNote.trim() }),
      });

      const result = (await response.json().catch(() => null)) as { data?: RegistrationNote; error?: string } | null;

      if (!response.ok || !result?.data) {
        setError(result?.error || "Impossible d'enregistrer la note.");
        return;
      }

      setParticipantNotes((current) => [result.data as RegistrationNote, ...current]);
      setNewParticipantNote("");
      setSuccess("Note ajoutée.");
    } finally {
      setSavingParticipantNotes(false);
    }
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

  function openFormationDrawer(slug: string) {
    selectFormation(slug);
    setFormationDrawerOpen(true);
  }

  function openNewFormationDrawer() {
    setEditingFormationSlug("");
    setFormationDraft(toFormationDraft());
    setFeedback("");
    setFormationDrawerOpen(true);
  }

  function closeFormationDrawer() {
    setFormationDrawerOpen(false);
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

  async function handleDeleteSession(sessionId: string, registrationsCount: number) {
    const warning =
      registrationsCount > 0
        ? `${registrationsCount} inscription(s) référencent cette session et perdront leur date/ville associée. `
        : "";

    if (!window.confirm(`${warning}Supprimer définitivement cette session ?`)) {
      return;
    }

    const previous = sessions;
    setSessions((current) => current.filter((item) => item.id !== sessionId));

    const response = await fetch(`/api/admin/sessions/${sessionId}`, { method: "DELETE" });
    if (!response.ok) {
      setSessions(previous);
      setError("Impossible de supprimer cette session.");
      return;
    }

    setSuccess("Session supprimée.");
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
      levelLabel: formationDraft.levelLabel.trim(),
      subCategory: formationDraft.subCategory.trim(),
      cpfEligible: formationDraft.cpfEligible,
      bannerImage: formationDraft.bannerImage.trim(),
      bannerPosition: formationDraft.bannerPosition.trim(),
      tilePosition: formationDraft.tilePosition.trim(),
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
    setFormationDrawerOpen(false);
    setSuccess(result.message || "Formation enregistrée.");
  }

  /** Image de couverture de l'article. */
  async function handleArticleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setArticleImageUploading(true);
    setFeedback("");

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/admin/uploads/article-image", { method: "POST", body: formData });
    const result = (await response.json().catch(() => null)) as { data?: { url: string }; error?: string } | null;

    setArticleImageUploading(false);

    if (!response.ok || !result?.data?.url) {
      setError(result?.error || "L'image n'a pas pu être envoyée. Vérifiez le format et la taille (5 Mo).");
      return;
    }

    setArticleDraft((current) => ({ ...current, coverImageUrl: result.data!.url }));
  }

  async function handleArticleSubmit(event: React.FormEvent<HTMLFormElement>, openPreview = false) {
    event.preventDefault();

    // Le champ de contenu est masqué derrière l'éditeur : `required` bloquerait
    // l'envoi sans message visible. On vérifie donc nous-mêmes.
    if (!articleDraft.bodyHtml.replace(/<[^>]*>/g, "").trim()) {
      setError("Le contenu de l'article est vide.");
      return;
    }

    setSaving(true);
    setFeedback("");

    const payload = {
      slug: articleDraft.slug.trim(),
      title: articleDraft.title.trim(),
      category: articleDraft.category.trim(),
      excerpt: articleDraft.excerpt.trim(),
      bodyHtml: articleDraft.bodyHtml,
      readingTime: articleDraft.readingTime.trim(),
      publishedAt: articleDraft.publishedAt.trim(),
      featuredFormationSlug: articleDraft.featuredFormationSlug.trim(),
      coverImageUrl: articleDraft.coverImageUrl.trim(),
      published: articleDraft.published,
      indexable: articleDraft.indexable,
      seoTitle: articleDraft.seoTitle.trim(),
      seoDescription: articleDraft.seoDescription.trim(),
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

    const saved = result.data as Article;

    setArticles((current) => [...current.filter((item) => item.slug !== saved.slug && item.slug !== editingArticleSlug), saved]);
    selectArticle(saved.slug);
    setSaving(false);
    setSuccess(result.message || "Article enregistré.");

    if (openPreview) {
      // Un brouillon n'est visible qu'avec ?apercu=1 et une session admin.
      window.open(`/actualites/${saved.slug}?apercu=1`, "_blank", "noopener");
    }
  }

  async function handleDeleteArticle(slug: string, title: string) {
    if (!window.confirm(`Supprimer définitivement l'article "${title}" ?`)) {
      return;
    }

    const previous = articles;
    setArticles((current) => current.filter((item) => item.slug !== slug));
    if (editingArticleSlug === slug) {
      const fallback = previous.find((item) => item.slug !== slug);
      if (fallback) selectArticle(fallback.slug);
    }

    const response = await fetch(`/api/admin/articles/${slug}`, { method: "DELETE" });
    if (!response.ok) {
      setArticles(previous);
      setError("Impossible de supprimer cet article.");
      return;
    }

    setSuccess("Article supprimé.");
  }

  return (
    <div className="admin-shell-v2">
      <nav className="admin-shell-v2-sidebar">
        <div className="admin-shell-v2-brand">Oxideve</div>
        <div className="admin-shell-v2-nav">
          {NAV_ITEMS.map((item) => {
            const newRegistrationsCount =
              item.value === "participants"
                ? registrations.filter((registration) => registration.status === "Pré-inscription (à qualifier)").length
                : 0;
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
        {feedback ? <p className={`form-status admin-shell-v2-sidebar-feedback ${feedbackTone}`}>{feedback}</p> : null}
        <Button variant="secondary" onClick={refreshAdminData} disabled={refreshing}>
          {refreshing ? "Actualisation..." : "Rafraîchir"}
        </Button>
      </nav>

      <div className="admin-shell-v2-main">
        {databaseConnected === false ? (
          <p className="form-status admin-shell-v2-feedback error">
            Attention : la base de données n&apos;est pas connectée. Les données créées maintenant ne seront pas conservées après le prochain redémarrage du serveur.
          </p>
        ) : null}

      {section === "dashboard" ? (
        <div className="admin-stack-grid">
          <section className="admin-shell">
            <div className="section-heading section-heading-tight">
              <div>
                <span className="eyebrow">Vue d&apos;ensemble</span>
                <h2>Dashboard</h2>
                <p>Catalogue, sessions et suivi des leads. Pour la liste détaillée, voir l&apos;onglet Inscriptions.</p>
              </div>
            </div>
            <div className="admin-metric-grid">
              <article className="admin-metric-card"><span>Formations</span><strong>{formations.length}</strong><small>formations</small></article>
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
                  width: "80px",
                  render: (row) => (
                    <div className="admin-row-actions">
                      <button className="admin-icon-button" onClick={(event) => { event.stopPropagation(); openSessionDrawer(row.id); }} title="Modifier la session" type="button">
                        ✎
                      </button>
                      <button
                        className="admin-icon-button admin-icon-button-danger"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteSession(row.id, registrationsBySession[row.id] || 0);
                        }}
                        title="Supprimer la session"
                        type="button"
                      >
                        ✕
                      </button>
                    </div>
                  ),
                },
              ]}
              rows={filteredSessions}
              getRowKey={(row) => row.id}
              emptyLabel="Aucune session ne correspond à ces filtres."
              onRowClick={(row) => openSessionDrawer(row.id)}
              isRowActive={(row) => editingSessionId === row.id && sessionDrawerOpen}
              pageSize={15}
              className="admin-data-table-compact"
            />
          </section>


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
                <div><span>Leads (tous statuts)</span><strong>{registrationsBySession[editingSessionId] || 0}</strong></div>
              </div>
              <div className="admin-form-actions">
                <Button disabled={saving} type="submit">{saving ? "Enregistrement..." : editingSessionId ? "Mettre à jour" : "Créer la session"}</Button>
              </div>
            </form>

            {editingSessionId ? (
              <div className="admin-form-section">
                <div className="section-heading section-heading-tight">
                  <h3>Inscriptions complétées pour cette session</h3>
                  <div className="admin-row-actions">
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
                    <a className="ui-button ui-button-secondary" href={`/api/admin/sessions/${editingSessionId}/documents.zip`}>
                      Télécharger les docs
                    </a>
                  </div>
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
        <section className="admin-shell">
          <div className="section-heading section-heading-tight"><div><span className="eyebrow">Oxideve</span><h2>Formations</h2></div><Button onClick={openNewFormationDrawer}>Nouvelle formation</Button></div>
          <div className="admin-filter-grid admin-filter-grid-compact">
            <label><span>Recherche</span><input className="ui-field" value={formationSearch} onChange={(event) => setFormationSearch(event.target.value)} placeholder="Nom, catégorie..." /></label>
            <label>
              <span>Catégorie</span>
              <select className="ui-field" value={formationCategoryFilter} onChange={(event) => setFormationCategoryFilter(event.target.value)}>
                <option>Toutes</option>
                {availableCategories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
          </div>
          <DataTable
            columns={[
              {
                key: "title",
                label: "Formation",
                sortable: true,
                sortValue: (row) => row.title,
                render: (row) => (
                  <div className="admin-formation-title-cell">
                    <strong>{row.title}</strong>
                    {/* Le titre court n'est affiché que s'il apporte une
                        information : souvent il répète le titre. */}
                    {row.shortTitle && row.shortTitle.trim() !== row.title.trim() ? (
                      <span>{row.shortTitle}</span>
                    ) : null}
                  </div>
                ),
              },
              {
                key: "category",
                label: "Catégorie",
                sortable: true,
                sortValue: (row) => row.category,
                render: (row) => <StatusBadge label={row.category} tone="soft" />,
              },
              { key: "duration", label: "Durée", sortable: true, sortValue: (row) => row.duration, render: (row) => row.duration },
              {
                key: "registrations",
                label: "Inscriptions",
                sortable: true,
                sortValue: (row) => registrationsByFormation[row.slug] || 0,
                render: (row) => registrationsByFormation[row.slug] || 0,
              },
              {
                key: "actions",
                label: "Actions",
                width: "50px",
                render: (row) => (
                  <button className="admin-icon-button" onClick={(event) => { event.stopPropagation(); openFormationDrawer(row.slug); }} title="Modifier la formation" type="button">
                    ✎
                  </button>
                ),
              },
            ]}
            rows={formations.filter(
              (formation) =>
                (!formationSearch.trim() || `${formation.title} ${formation.category}`.toLowerCase().includes(formationSearch.trim().toLowerCase())) &&
                (formationCategoryFilter === "Toutes" || formation.category === formationCategoryFilter),
            )}
            getRowKey={(row) => row.slug}
            emptyLabel="Aucune formation ne correspond à cette recherche."
            onRowClick={(row) => openFormationDrawer(row.slug)}
            isRowActive={(row) => editingFormationSlug === row.slug && formationDrawerOpen}
            pageSize={15}
            className="admin-data-table-compact"
          />

          <Drawer
            open={formationDrawerOpen}
            onClose={closeFormationDrawer}
            title={editingFormationSlug ? "Modifier la formation" : "Créer une formation"}
          >
            <nav className="admin-form-toc">
              <a href="#formation-section-identite">Identité</a>
              <a href="#formation-section-contenu">Contenu</a>
              <a href="#formation-section-pratique">Infos pratiques</a>
              {editingFormationSlug ? (
                <a
                  className="admin-form-toc-pdf"
                  href={`/api/admin/formations/${editingFormationSlug}/programme.pdf`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Télécharger en PDF
                </a>
              ) : null}
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
                <label>
                  <span>Niveau (optionnel)</span>
                  <input className="ui-field" value={formationDraft.levelLabel} onChange={(event) => setFormationDraft((current) => ({ ...current, levelLabel: event.target.value }))} placeholder="Niveau 1" />
                  <small className="admin-field-hint">Affiché en italique après le titre, sur la carte et la page formation.</small>
                </label>
                <label>
                  <span>Sous-catégorie (optionnel)</span>
                  <select
                    className="ui-field"
                    value={availableSubCategories.includes(formationDraft.subCategory) ? formationDraft.subCategory : ""}
                    onChange={(event) => setFormationDraft((current) => ({ ...current, subCategory: event.target.value }))}
                  >
                    <option value="">Aucune</option>
                    {availableSubCategories.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                  <small className="admin-field-hint">Permet de filtrer plus finement dans le catalogue (ex. Électricité, Travail en hauteur).</small>
                </label>
                <label className="contact-form-full admin-checkbox-item admin-checkbox-boxed">
                  <input type="checkbox" checked={formationDraft.cpfEligible} onChange={(event) => setFormationDraft((current) => ({ ...current, cpfEligible: event.target.checked }))} />
                  <span>
                    Finançable CPF
                    <small className="admin-field-hint">Affiche l&apos;étiquette CPF sur la tuile et la fiche.</small>
                  </span>
                </label>
                <div className="contact-form-full">
                  <FormationBannerField draft={formationDraft} onChange={setFormationDraft} onError={setError} />
                </div>
              </div></div>
              <div className="admin-form-section" id="formation-section-contenu"><h3>Contenu</h3>
                <label>
                  <span>Résumé</span>
                  <textarea className="ui-field admin-textarea-long" rows={4} value={formationDraft.summary} onChange={(event) => setFormationDraft((current) => ({ ...current, summary: event.target.value }))} required />
                  <p className="admin-field-hint">{formationDraft.summary.length} caractères</p>
                </label>
                <label>
                  <span>Description</span>
                  <textarea className="ui-field admin-textarea-long" rows={7} value={formationDraft.description} onChange={(event) => setFormationDraft((current) => ({ ...current, description: event.target.value }))} required />
                  <p className="admin-field-hint">{formationDraft.description.length} caractères</p>
                </label>
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
                <label>
                  <span>Accessibilité</span>
                  <textarea className="ui-field admin-textarea-long" rows={4} value={formationDraft.handicapPolicy} onChange={(event) => setFormationDraft((current) => ({ ...current, handicapPolicy: event.target.value }))} required />
                  <p className="admin-field-hint">{formationDraft.handicapPolicy.length} caractères</p>
                </label>
              </div>
                <label>
                  <span>Finalité / certification</span>
                  <textarea className="ui-field admin-textarea-long" rows={4} value={formationDraft.certification} onChange={(event) => setFormationDraft((current) => ({ ...current, certification: event.target.value }))} required />
                  <p className="admin-field-hint">{formationDraft.certification.length} caractères</p>
                </label>
              </div>
              <Button disabled={saving} type="submit">{saving ? "Enregistrement..." : editingFormationSlug ? "Mettre à jour" : "Créer la formation"}</Button>
            </form>
          </Drawer>
        </section>
      ) : null}

      {section === "avis" ? <ReviewsPanel onError={setError} onFeedback={setFeedback} /> : null}

      {section === "visuels" ? (
        <CategoryVisualsPanel formations={formations} onError={setError} onFeedback={setFeedback} />
      ) : null}

      {section === "editorial" ? (
        <div className="admin-editorial">
          <div className="admin-editorial-head">
            <div>
              <h2>Blog</h2>
              <span>{articles.length} article{articles.length > 1 ? "s" : ""}</span>
            </div>
            <div className="admin-editorial-head-actions">
              {editingArticleSlug ? (
                <Button
                  onClick={() => {
                    setEditingArticleSlug("");
                    setArticleDraft(toArticleDraft());
                  }}
                  variant="secondary"
                >
                  Nouvel article
                </Button>
              ) : null}
              <a className="admin-editorial-link" href="/actualites" rel="noopener" target="_blank">
                Voir le blog
              </a>
            </div>
          </div>

          <section className="admin-shell">
            <span className="admin-editorial-form-title">
              {editingArticleSlug ? "Modifier l'article" : "Nouvel article"}
            </span>
            <form className="contact-form" onSubmit={handleArticleSubmit}>
              <label className="admin-article-title-field">
                <span>Titre de l&apos;article</span>
                <input
                  className="ui-field"
                  onChange={(event) => setArticleDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Pourquoi se former au photovoltaïque en 2026"
                  required
                  value={articleDraft.title}
                />
                {/* Le slug est calculé puis figé : on l'affiche, on ne le saisit pas. */}
                {editingArticleSlug ? (
                  <small className="admin-field-hint">
                    Adresse de la page : <code>/actualites/{articleDraft.slug}</code> — figée pour ne pas casser les
                    liens déjà partagés.
                  </small>
                ) : (
                  <small className="admin-field-hint">L&apos;adresse de la page sera déduite du titre.</small>
                )}
              </label>

              <div className="form-grid">
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
                <label><span>Publication</span><input className="ui-field" type="date" value={articleDraft.publishedAt} onChange={(event) => setArticleDraft((current) => ({ ...current, publishedAt: event.target.value }))} required /></label>
                <label><span>Formation liée</span><select className="ui-field" value={articleDraft.featuredFormationSlug} onChange={(event) => setArticleDraft((current) => ({ ...current, featuredFormationSlug: event.target.value }))}><option value="">Aucune</option>{formations.map((formation) => <option key={formation.slug} value={formation.slug}>{formation.title}</option>)}</select></label>
              </div>
              <div className="admin-article-cover">
                <span className="admin-article-editor-label">Image de couverture</span>
                {articleDraft.coverImageUrl ? (
                  <div className="admin-article-image-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={articleDraft.coverImageUrl} alt="Aperçu de l'image de couverture" />
                    <button
                      className="admin-banner-reset"
                      type="button"
                      onClick={() => setArticleDraft((current) => ({ ...current, coverImageUrl: "" }))}
                    >
                      Retirer l&apos;image
                    </button>
                  </div>
                ) : null}
                <label className="admin-upload-button">
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    disabled={articleImageUploading}
                    onChange={handleArticleImageChange}
                    type="file"
                  />
                  <span>
                    {articleImageUploading
                      ? "Envoi en cours..."
                      : articleDraft.coverImageUrl
                        ? "Remplacer l'image"
                        : "Choisir une image"}
                  </span>
                </label>
                <small className="admin-field-hint">JPG, PNG ou WEBP, 5 Mo maximum.</small>
              </div>

              <label>
                <span>
                  Accroche
                  <em className="admin-field-optional">
                    {articleDraft.excerpt.trim() ? "personnalisée" : "générée automatiquement"}
                  </em>
                </span>
                <textarea
                  className="ui-field"
                  rows={3}
                  value={articleDraft.excerpt}
                  onChange={(event) => setArticleDraft((current) => ({ ...current, excerpt: event.target.value }))}
                  placeholder="Laissez vide : les premières phrases de l'article seront reprises."
                />
              </label>

              <div className="admin-article-editor-field">
                <span className="admin-article-editor-label">Contenu de l&apos;article</span>
                <ArticleEditor
                  key={editingArticleSlug || "nouvel-article"}
                  onChange={(html) => setArticleDraft((current) => ({ ...current, bodyHtml: html }))}
                  onError={setError}
                  value={articleDraft.bodyHtml}
                />
                <small className="admin-field-hint">
                  Mise en forme disponible dans la barre d&apos;outils : titres, gras, italique, listes, liens et
                  citations. Les blocs ci-dessus insèrent galeries, image + texte et bouton d&apos;action.
                </small>
              </div>

              <div className="admin-article-flags">
                <label className="contact-form-full admin-checkbox-item admin-checkbox-boxed">
                  <input
                    checked={articleDraft.published}
                    onChange={(event) => setArticleDraft((current) => ({ ...current, published: event.target.checked }))}
                    type="checkbox"
                  />
                  <span>
                    Publier sur le site
                    <small className="admin-field-hint">
                      Décoché : brouillon, invisible des visiteurs. Vous pouvez le relire avec « Enregistrer et voir
                      l&apos;aperçu ».
                    </small>
                  </span>
                </label>
                <label className="contact-form-full admin-checkbox-item admin-checkbox-boxed">
                  <input
                    checked={articleDraft.indexable}
                    onChange={(event) => setArticleDraft((current) => ({ ...current, indexable: event.target.checked }))}
                    type="checkbox"
                  />
                  <span>
                    Référencer sur Google
                    <small className="admin-field-hint">
                      Coché : l&apos;article est ajouté au plan du site. Décoché : il reste accessible par son lien mais
                      demande aux moteurs de ne pas le référencer.
                    </small>
                  </span>
                </label>
              </div>

              <ArticleSeoPanel draft={articleDraft} onChange={setArticleDraft} />

              <div className="admin-article-actions">
                <Button disabled={saving} type="submit">
                  {saving ? "Enregistrement..." : editingArticleSlug ? "Mettre à jour" : "Créer l'article"}
                </Button>
                <Button
                  disabled={saving}
                  onClick={(event) => handleArticleSubmit(event as unknown as React.FormEvent<HTMLFormElement>, true)}
                  type="button"
                  variant="secondary"
                >
                  Enregistrer et voir l&apos;aperçu
                </Button>
              </div>
            </form>
          </section>

          <section className="admin-shell">
            <div className="admin-editorial-list-head">
              <h3>Articles</h3>
              <input
                className="ui-field"
                onChange={(event) => setArticleSearch(event.target.value)}
                placeholder="Rechercher un titre, une catégorie..."
                value={articleSearch}
              />
            </div>

            <table className="admin-editorial-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Titre</th>
                  <th>Catégorie</th>
                  <th>Publié</th>
                  <th>Date</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {articles
                  .filter(
                    (article) =>
                      !articleSearch.trim() ||
                      `${article.title} ${article.category}`.toLowerCase().includes(articleSearch.trim().toLowerCase()),
                  )
                  .sort((a, b) => compareDateDesc(a.publishedAt, b.publishedAt))
                  .map((article) => (
                    <tr className={editingArticleSlug === article.slug ? "is-active" : ""} key={article.slug}>
                      <td>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt="" className="admin-editorial-thumb" src={getArticleCover(article)} />
                      </td>
                      <td>
                        <strong>{article.title}</strong>
                        <span className="admin-editorial-slug">/actualites/{article.slug}</span>
                      </td>
                      <td>
                        <span className="admin-editorial-category">{article.category}</span>
                      </td>
                      <td>
                        <span className={article.published === false ? "admin-editorial-draft" : ""}>
                          {article.published === false ? "Brouillon" : "Oui"}
                        </span>
                        <span className="admin-editorial-slug">
                          {article.indexable === false ? "Non référencé" : "Référencé"}
                        </span>
                      </td>
                      <td>{formatDateLabel(article.publishedAt)}</td>
                      <td>
                        <div className="admin-editorial-row-actions">
                          <a
                            className="admin-copy-button"
                            href={`/actualites/${article.slug}${article.published === false ? "?apercu=1" : ""}`}
                            rel="noopener"
                            target="_blank"
                          >
                            Aperçu
                          </a>
                          <button className="admin-copy-button" onClick={() => selectArticle(article.slug)} type="button">
                            Modifier
                          </button>
                          <button
                            className="admin-copy-button admin-copy-button-danger"
                            onClick={() => handleDeleteArticle(article.slug, article.title)}
                            type="button"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
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
                    <button className="ui-button ui-button-ghost" type="button" onClick={() => handleDeleteAdminUser(user.id, user.name || user.email)}>
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
              <Button onClick={openManualRegistrationDrawer}>Ajouter une inscription</Button>
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
                {
                  key: "firstContactAt",
                  label: "Date",
                  sortable: true,
                  width: "118px",
                  sortValue: (row) => row.firstContactAt,
                  render: (row) => formatShortDateTimeFr(row.firstContactAt),
                },
                { key: "fullName", label: "Nom", sortable: true, sortValue: (row) => row.fullName, render: (row) => row.fullName },
                { key: "company", label: "Entreprise", sortable: true, sortValue: (row) => row.company, render: (row) => row.company },
                { key: "phone", label: "Téléphone", render: (row) => row.phone },
                { key: "email", label: "Email", render: (row) => row.email },
                {
                  key: "formation",
                  label: "Formation",
                  sortable: true,
                  width: "150px",
                  sortValue: (row) => formations.find((item) => item.slug === row.formationSlug)?.shortTitle || row.formationSlug,
                  render: (row) => formations.find((item) => item.slug === row.formationSlug)?.shortTitle || row.formationSlug,
                },
                {
                  key: "sessionDates",
                  label: "Session",
                  sortable: true,
                  sortValue: (row) => sessions.find((item) => item.id === row.sessionId)?.startDate || "",
                  render: (row) => {
                    const session = sessions.find((item) => item.id === row.sessionId);
                    return session ? formatSessionRange(session.startDate, session.endDate) : "—";
                  },
                },
                {
                  key: "sessionCity",
                  label: "Ville",
                  sortable: true,
                  sortValue: (row) => sessions.find((item) => item.id === row.sessionId)?.city || "",
                  render: (row) => sessions.find((item) => item.id === row.sessionId)?.city || "—",
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
                        tone={AUTOMATIC_REGISTRATION_STATUSES.includes(row.status) ? "accent" : row.status === "Non intéressé" ? "negative" : "default"}
                      />
                    ),
                },
                {
                  key: "actions",
                  label: "Actions",
                  width: "110px",
                  render: (row) => (
                    <div className="admin-row-actions">
                      {row.status !== "Non intéressé" && row.status !== "Inscription complétée" ? (
                        <button
                          className="admin-icon-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            copyBulletinLink(row.registrationId || row.id, row.formationSlug, {
                              company: row.company,
                              fullName: row.fullName,
                              email: row.email,
                              phone: row.phone,
                            });
                          }}
                          title={copiedKey === `registration-bulletin-${row.registrationId || row.id}` ? "Copié !" : "Copier le lien du bulletin"}
                          type="button"
                        >
                          {copiedKey === `registration-bulletin-${row.registrationId || row.id}` ? "✓" : "⧉"}
                        </button>
                      ) : null}
                      {row.bulletinInscriptionId ? (
                        <a
                          className="admin-icon-button"
                          href={`/api/admin/bulletin-inscriptions/${row.bulletinInscriptionId}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          title="Voir le PDF"
                        >
                          ⬇
                        </a>
                      ) : null}
                      {row.registrationId ? (
                        <button
                          className="admin-icon-button admin-icon-button-danger"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteRegistration(row.id, row.registrationId, row.fullName);
                          }}
                          title="Supprimer l'inscription"
                          type="button"
                        >
                          ✕
                        </button>
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
              className="admin-data-table-compact"
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

                {selectedParticipant.registrationId ? (
                  <div className="admin-notes-block">
                    <span>Notes</span>
                    {participantNotes.length ? (
                      <div className="admin-notes-history">
                        {participantNotes.map((note) => (
                          <div className="admin-notes-history-item" key={note.id}>
                            <p>{note.text}</p>
                            <span className="admin-list-item-meta">
                              {note.authorName} · {formatShortDateTimeFr(note.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="admin-empty-state">Aucune note pour le moment.</p>
                    )}
                    <textarea
                      className="ui-field"
                      rows={2}
                      value={newParticipantNote}
                      onChange={(event) => setNewParticipantNote(event.target.value)}
                      placeholder="Ex. : relancé le 12/09, en attente de retour du client..."
                    />
                    <Button variant="secondary" onClick={addParticipantNote} disabled={savingParticipantNotes || !newParticipantNote.trim()}>
                      {savingParticipantNotes ? "Enregistrement..." : "Ajouter la note"}
                    </Button>
                  </div>
                ) : null}

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
                        <DetailField label="Email" value={learner.email || "Non renseigné"} copyKey={`b-learner-email-${index}`} copyToClipboard={copyToClipboard} copiedKey={copiedKey} />
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
                            <a
                              className="admin-copy-button"
                              href={`/api/admin/quiz-attempts/${attempt.id}/pdf`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Voir le PDF
                            </a>
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

          <Drawer
            open={manualRegistrationDrawerOpen}
            onClose={closeManualRegistrationDrawer}
            title="Ajouter une inscription"
          >
            <form className="contact-form" onSubmit={handleManualRegistrationSubmit}>
              <p className="admin-field-hint">
                Utile pour saisir une demande reçue par téléphone ou email, hors formulaire du site.
              </p>
              <div className="form-grid">
                <label><span>Entreprise</span><input className="ui-field" value={manualRegistrationDraft.company} onChange={(event) => setManualRegistrationDraft((current) => ({ ...current, company: event.target.value }))} required /></label>
                <label><span>Contact</span><input className="ui-field" value={manualRegistrationDraft.contactName} onChange={(event) => setManualRegistrationDraft((current) => ({ ...current, contactName: event.target.value }))} required /></label>
                <label><span>Email</span><input className="ui-field" type="email" value={manualRegistrationDraft.email} onChange={(event) => setManualRegistrationDraft((current) => ({ ...current, email: event.target.value }))} required /></label>
                <label><span>Téléphone</span><input className="ui-field" type="tel" value={manualRegistrationDraft.phone} onChange={(event) => setManualRegistrationDraft((current) => ({ ...current, phone: event.target.value }))} required /></label>
                <label>
                  <span>Formation</span>
                  <select
                    className="ui-field"
                    value={manualRegistrationDraft.formationSlug}
                    onChange={(event) => setManualRegistrationDraft((current) => ({ ...current, formationSlug: event.target.value, sessionId: "" }))}
                    required
                  >
                    <option value="">Choisir</option>
                    {formations.map((formation) => <option key={formation.slug} value={formation.slug}>{formation.title}</option>)}
                  </select>
                </label>
                <label>
                  <span>Session (optionnel)</span>
                  <select
                    className="ui-field"
                    value={manualRegistrationDraft.sessionId}
                    onChange={(event) => setManualRegistrationDraft((current) => ({ ...current, sessionId: event.target.value }))}
                    disabled={!manualRegistrationDraft.formationSlug}
                  >
                    <option value="">Pas de session précise</option>
                    {sessions
                      .filter((session) => session.formationSlug === manualRegistrationDraft.formationSlug)
                      .map((session) => (
                        <option key={session.id} value={session.id}>
                          {formatSessionRange(session.startDate, session.endDate)} · {session.city}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
              <label><span>Besoin / notes</span><textarea className="ui-field" rows={3} value={manualRegistrationDraft.message} onChange={(event) => setManualRegistrationDraft((current) => ({ ...current, message: event.target.value }))} /></label>
              <Button disabled={saving} type="submit">{saving ? "Enregistrement..." : "Ajouter l'inscription"}</Button>
            </form>
          </Drawer>
        </div>
      ) : null}

      {section === "clients" ? (
        <section className="admin-shell">
          <div className="section-heading section-heading-tight">
            <div><span className="eyebrow">CRM</span><h2>Clients</h2></div>
          </div>

          <div className="admin-filter-grid admin-filter-grid-compact">
            <label><span>Recherche</span><input className="ui-field" value={clientSearch} onChange={(event) => setClientSearch(event.target.value)} placeholder="Société, contact, email..." /></label>
          </div>

          <DataTable
            columns={[
              { key: "name", label: "Société", sortable: true, sortValue: (row) => row.name, render: (row) => row.name },
              {
                key: "contact",
                label: "Contact",
                render: (row) => row.company?.contactName || row.participants[0]?.fullName || "—",
              },
              {
                key: "email",
                label: "Email",
                render: (row) => row.company?.email || row.participants[0]?.email || "—",
              },
              {
                key: "sessionsCount",
                label: "Sessions suivies",
                sortable: true,
                sortValue: (row) => row.participants.filter((item) => item.status === "Inscription complétée").length,
                render: (row) => row.participants.filter((item) => item.status === "Inscription complétée").length,
              },
              {
                key: "lastContactAt",
                label: "Dernier contact",
                sortable: true,
                sortValue: (row) => row.participants[0]?.firstContactAt || "",
                render: (row) => (row.participants[0] ? formatShortDateTimeFr(row.participants[0].firstContactAt) : "—"),
              },
            ]}
            rows={filteredClientGroups}
            getRowKey={(row) => row.key}
            emptyLabel="Aucun client ne correspond à cette recherche."
            onRowClick={(row) => {
              setSelectedClientKey(row.key);
              setClientDrawerOpen(true);
            }}
            isRowActive={(row) => selectedClientKey === row.key}
            pageSize={15}
            className="admin-data-table-compact"
          />

          <Drawer
            open={clientDrawerOpen && Boolean(selectedClientGroup)}
            onClose={() => setClientDrawerOpen(false)}
            title={selectedClientGroup?.name || "Détail du client"}
          >
            {selectedClientGroup ? (
              <div className="admin-form-section">
                <p className="admin-list-item-meta">
                  {selectedClientGroup.company?.contactName || selectedClientGroup.participants[0]?.fullName}
                  {" · "}
                  {selectedClientGroup.company?.email || selectedClientGroup.participants[0]?.email}
                  {selectedClientGroup.company?.phone ? ` · ${selectedClientGroup.company.phone}` : ""}
                </p>

                <div className="admin-notes-block">
                  <span>Historique des sessions</span>
                  <div className="admin-notes-history">
                    {[...selectedClientGroup.participants]
                      .sort((left, right) => compareDateDesc(left.firstContactAt, right.firstContactAt))
                      .map((participant) => {
                        const formation = formations.find((item) => item.slug === participant.formationSlug);
                        const relatedSession = sessions.find((item) => item.id === participant.sessionId);
                        return (
                          <div className="admin-notes-history-item" key={participant.id}>
                            <p className="admin-list-item-meta">
                              {formatShortDateTimeFr(participant.firstContactAt)}
                              {" · "}
                              {formation?.shortTitle || participant.formationSlug}
                            </p>
                            <p>
                              {relatedSession ? `${formatSessionRange(relatedSession.startDate, relatedSession.endDate)} · ${relatedSession.city}` : "Session non précisée"}
                            </p>
                            <StatusBadge
                              label={participant.status}
                              tone={
                                AUTOMATIC_REGISTRATION_STATUSES.includes(participant.status)
                                  ? "accent"
                                  : participant.status === "Non intéressé"
                                    ? "negative"
                                    : "default"
                              }
                            />
                            {participant.quizAttempt ? (
                              <p className="admin-list-item-meta">Auto-évaluation : {participant.quizAttempt.scoreOn20} / 20</p>
                            ) : null}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ) : null}
          </Drawer>
        </section>
      ) : null}
      </div>
    </div>
  );
}

/** "50% 30%" -> [50, 30], avec repli sur le centre si la valeur est vide. */
function parsePosition(value: string | undefined): [number, number] {
  const parts = (value || "50% 50%").split(/\s+/);
  const x = Number.parseInt(parts[0], 10);
  const y = Number.parseInt(parts[1] ?? parts[0], 10);

  return [Number.isFinite(x) ? x : 50, Number.isFinite(y) ? y : 50];
}

/**
 * Aperçu d'un format (bannière ou tuile) avec ses deux curseurs de cadrage.
 * `shape` ne change que les proportions de l'aperçu, pour coller au rendu réel.
 */
function BannerCropPreview({
  image,
  label,
  hint,
  shape,
  value,
  onChange,
  onReset,
}: {
  image: string;
  label: string;
  hint: string;
  shape: "banner" | "tile";
  value: string;
  onChange: (next: string) => void;
  onReset: () => void;
}) {
  const [x, y] = parsePosition(value);

  return (
    <div className="admin-crop">
      <div className="admin-crop-head">
        <strong>{label}</strong>
        {value ? (
          <button className="admin-banner-reset" type="button" onClick={onReset}>
            Cadrage par défaut
          </button>
        ) : null}
      </div>
      <p className="admin-field-hint">{hint}</p>

      <div className={`admin-crop-preview admin-crop-preview-${shape}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={`Aperçu : ${label}`} src={image} style={{ objectPosition: `${x}% ${y}%` }} />
      </div>

      <div className="admin-banner-sliders">
        <label>
          <span>Horizontal : {x}%</span>
          <input type="range" min={0} max={100} value={x} onChange={(event) => onChange(`${event.target.value}% ${y}%`)} />
        </label>
        <label>
          <span>Vertical : {y}%</span>
          <input type="range" min={0} max={100} value={y} onChange={(event) => onChange(`${x}% ${event.target.value}%`)} />
        </label>
      </div>
    </div>
  );
}

/**
 * Photo de la formation : envoi direct d'un fichier ou saisie d'un chemin, puis
 * réglage séparé du cadrage pour la bannière de la page formation et pour la
 * tuile du catalogue, les deux formats n'ayant pas les mêmes proportions.
 */
function FormationBannerField({
  draft,
  onChange,
  onError,
}: {
  draft: FormationDraft;
  onChange: (updater: (current: FormationDraft) => FormationDraft) => void;
  onError: (message: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [visuals, setVisuals] = useState<Record<string, CategoryVisual>>({});

  // Les visuels de catégorie sont réglés dans l'onglet Visuels : on les relit
  // ici pour que l'aperçu de la fiche montre exactement ce que verra le public.
  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/category-visuals")
      .then((response) => response.json())
      .then((result) => {
        if (cancelled) return;
        const index: Record<string, CategoryVisual> = {};
        ((result?.data || []) as CategoryVisual[]).forEach((visual) => {
          index[`${visual.scope}:${visual.name}`] = visual;
        });
        setVisuals(index);
      })
      .catch(() => {
        /* on retombe sur les visuels par défaut */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const theme = getCategoryTheme(
    draft.category,
    draft.subCategory,
    {
      bannerImage: draft.bannerImage,
      bannerPosition: draft.bannerPosition,
      tilePosition: draft.tilePosition,
    },
    visuals,
  );

  // Vrai tant qu'aucune photo propre n'est définie : on affiche alors celle
  // héritée de la sous-catégorie ou de la catégorie.
  const isInherited = !draft.bannerImage.trim();

  async function handleUpload(file: File | undefined) {
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/admin/uploads/formation-image", { method: "POST", body: formData });
    const result = (await response.json().catch(() => null)) as { data?: { url: string }; error?: string } | null;

    setUploading(false);

    if (!response.ok || !result?.data?.url) {
      onError(result?.error || "L'image n'a pas pu être envoyée.");
      return;
    }

    onChange((current) => ({ ...current, bannerImage: result.data!.url }));
  }

  // Par défaut on montre simplement les deux visuels hérités : le réglage par
  // catégorie se fait dans l'onglet Visuels. L'utilisateur n'ouvre les réglages
  // que s'il veut vraiment une photo propre à cette formation.
  if (isInherited) {
    return (
      <div className="admin-banner-field">
        <div className="admin-banner-head">
          <strong>Photo de la formation</strong>
          <span className="admin-banner-tag">Reprise de la catégorie</span>
        </div>

        <div className="admin-crop-grid">
          <figure className="admin-crop">
            <figcaption className="admin-crop-head">
              <strong>Bannière de la fiche</strong>
            </figcaption>
            <div className="admin-crop-preview admin-crop-preview-banner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Bannière héritée" src={theme.banner} style={{ objectPosition: theme.bannerPosition }} />
            </div>
          </figure>
          <figure className="admin-crop">
            <figcaption className="admin-crop-head">
              <strong>Tuile du catalogue</strong>
            </figcaption>
            <div className="admin-crop-preview admin-crop-preview-tile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Tuile héritée" src={theme.banner} style={{ objectPosition: theme.tilePosition }} />
            </div>
          </figure>
        </div>

        <p className="admin-field-hint">
          Ces visuels viennent de la catégorie et se modifient dans l&apos;onglet <strong>Visuels</strong>, pour toutes
          les formations concernées à la fois.
        </p>

        <label className="admin-upload-button">
          <input
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={(event) => {
              handleUpload(event.target.files?.[0]);
              event.target.value = "";
            }}
            type="file"
          />
          <span>{uploading ? "Envoi en cours..." : "Vous souhaitez une image spécifique pour cette formation ?"}</span>
        </label>
      </div>
    );
  }

  return (
    <div className="admin-banner-field">
      <div className="admin-banner-head">
        <strong>Photo propre à cette formation</strong>
      </div>

      <div className="admin-banner-actions">
        <label className="admin-upload-button">
          <input
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={(event) => {
              handleUpload(event.target.files?.[0]);
              event.target.value = "";
            }}
            type="file"
          />
          <span>{uploading ? "Envoi en cours..." : "Remplacer l'image"}</span>
        </label>

        <button
          className="admin-banner-reset"
          type="button"
          onClick={() =>
            onChange((current) => ({ ...current, bannerImage: "", bannerPosition: "", tilePosition: "" }))
          }
        >
          Revenir à la photo de la catégorie
        </button>
      </div>

      <p className="admin-field-hint">JPG, PNG ou WEBP, 5 Mo maximum. Réglez ensuite le cadrage pour chaque format.</p>

      <div className="admin-crop-grid">
        <BannerCropPreview
          image={theme.banner}
          label="Bannière de la fiche"
          hint="Bandeau large en haut de la page formation."
          shape="banner"
          value={theme.bannerPosition || ""}
          onChange={(next) => onChange((current) => ({ ...current, bannerPosition: next }))}
          onReset={() => onChange((current) => ({ ...current, bannerPosition: "" }))}
        />
        <BannerCropPreview
          image={theme.banner}
          label="Tuile du catalogue"
          hint="Vignette à droite de chaque résultat."
          shape="tile"
          value={theme.tilePosition || ""}
          onChange={(next) => onChange((current) => ({ ...current, tilePosition: next }))}
          onReset={() => onChange((current) => ({ ...current, tilePosition: "" }))}
        />
      </div>
    </div>
  );
}


/**
 * Écran « Visuels » : photo et cadrages par catégorie et par sous-catégorie.
 * Une formation peut toujours surcharger ces valeurs dans sa propre fiche.
 */
function CategoryVisualsPanel({
  formations,
  onError,
  onFeedback,
}: {
  formations: Formation[];
  onError: (message: string) => void;
  onFeedback: (message: string) => void;
}) {
  const [visuals, setVisuals] = useState<Record<string, CategoryVisual>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");

  // Les entrées à afficher sont déduites du catalogue : pas de liste figée.
  const entries = useMemo(() => {
    const categories = new Set<string>();
    const subCategories = new Map<string, string>();

    formations.forEach((formation) => {
      if (formation.category) categories.add(formation.category);
      if (formation.subCategory) subCategories.set(formation.subCategory, formation.category);
    });

    const rows: { scope: "category" | "subCategory"; name: string; parent?: string; count: number }[] = [];

    Array.from(categories)
      .sort((left, right) => left.localeCompare(right, "fr"))
      .forEach((category) => {
        rows.push({
          scope: "category",
          name: category,
          count: formations.filter((f) => f.category === category).length,
        });

        Array.from(subCategories.entries())
          .filter(([, parent]) => parent === category)
          .sort((left, right) => left[0].localeCompare(right[0], "fr"))
          .forEach(([subCategory]) => {
            rows.push({
              scope: "subCategory",
              name: subCategory,
              parent: category,
              count: formations.filter((f) => f.subCategory === subCategory).length,
            });
          });
      });

    return rows;
  }, [formations]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/category-visuals")
      .then((response) => response.json())
      .then((result) => {
        if (cancelled) return;
        const list = (result?.data || []) as CategoryVisual[];
        const index: Record<string, CategoryVisual> = {};
        list.forEach((visual) => {
          index[`${visual.scope}:${visual.name}`] = visual;
        });
        setVisuals(index);
      })
      .catch(() => {
        if (!cancelled) onError("Les visuels n'ont pas pu être chargés.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(key: string, patch: Partial<CategoryVisual>) {
    setVisuals((current) => ({ ...current, [key]: { ...current[key], ...patch } as CategoryVisual }));
  }

  async function save(scope: "category" | "subCategory", name: string) {
    const key = `${scope}:${name}`;
    const visual = visuals[key] || {};

    setSavingKey(key);
    onFeedback("");

    const response = await fetch("/api/admin/category-visuals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope,
        name,
        image: visual.image || "",
        bannerPosition: visual.bannerPosition || "",
        tilePosition: visual.tilePosition || "",
      }),
    });

    setSavingKey("");

    if (!response.ok) {
      onError("Le visuel n'a pas pu être enregistré.");
      return;
    }

    onFeedback(`Visuel enregistré pour « ${name} ».`);
  }

  if (loading) {
    return (
      <section className="admin-shell">
        <p>Chargement des visuels...</p>
      </section>
    );
  }

  return (
    <section className="admin-shell">
      <div className="section-heading section-heading-tight">
        <div>
          <span className="eyebrow">Oxideve</span>
          <h2>Visuels</h2>
        </div>
      </div>
      <p className="admin-field-hint">
        Photo et cadrages appliqués à toutes les formations d&apos;une catégorie ou d&apos;une sous-catégorie. Une
        formation peut toujours définir sa propre photo depuis sa fiche.
      </p>

      <div className="admin-visual-list">
        {entries.map((entry) => {
          const key = `${entry.scope}:${entry.name}`;
          const visual = visuals[key] || { scope: entry.scope, name: entry.name };

          return (
            <CategoryVisualRow
              busy={savingKey === key}
              entry={entry}
              key={key}
              onChange={(patch) => update(key, patch)}
              onError={onError}
              onSave={() => save(entry.scope, entry.name)}
              visual={visual}
            />
          );
        })}
      </div>
    </section>
  );
}

/** Une ligne de l'écran Visuels : envoi d'image + deux cadrages. */
function CategoryVisualRow({
  entry,
  visual,
  busy,
  onChange,
  onSave,
  onError,
}: {
  entry: { scope: "category" | "subCategory"; name: string; parent?: string; count: number };
  visual: CategoryVisual;
  busy: boolean;
  onChange: (patch: Partial<CategoryVisual>) => void;
  onSave: () => void;
  onError: (message: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  // Aperçu : la photo saisie ici, sinon celle héritée du thème.
  const theme = getCategoryTheme(
    entry.scope === "category" ? entry.name : entry.parent || "",
    entry.scope === "subCategory" ? entry.name : null,
  );
  const image = visual.image || theme.banner;

  async function handleUpload(file: File | undefined) {
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/admin/uploads/formation-image", { method: "POST", body: formData });
    const result = (await response.json().catch(() => null)) as { data?: { url: string }; error?: string } | null;

    setUploading(false);

    if (!response.ok || !result?.data?.url) {
      onError(result?.error || "L'image n'a pas pu être envoyée.");
      return;
    }

    onChange({ image: result.data.url });
  }

  return (
    <article className={`admin-visual-row admin-visual-row-${entry.scope}`}>
      <div className="admin-visual-identity">
        <strong>{entry.name}</strong>
        <span className="admin-visual-meta">
          {entry.scope === "category" ? "Catégorie" : `Sous-catégorie de ${entry.parent}`} · {entry.count} formation
          {entry.count > 1 ? "s" : ""}
        </span>

        <label className="admin-upload-button">
          <input
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={(event) => {
              handleUpload(event.target.files?.[0]);
              event.target.value = "";
            }}
            type="file"
          />
          <span>{uploading ? "Envoi..." : "Changer la photo"}</span>
        </label>

        {visual.image ? (
          <button className="admin-banner-reset" type="button" onClick={() => onChange({ image: "" })}>
            Photo par défaut
          </button>
        ) : null}
      </div>

      <div className="admin-crop-grid">
        <BannerCropPreview
          hint="Bandeau large en haut de la fiche."
          image={image}
          label="Bannière"
          onChange={(next) => onChange({ bannerPosition: next })}
          onReset={() => onChange({ bannerPosition: "" })}
          shape="banner"
          value={visual.bannerPosition || theme.bannerPosition || ""}
        />
        <BannerCropPreview
          hint="Vignette du catalogue."
          image={image}
          label="Tuile"
          onChange={(next) => onChange({ tilePosition: next })}
          onReset={() => onChange({ tilePosition: "" })}
          shape="tile"
          value={visual.tilePosition || theme.tilePosition || ""}
        />
      </div>

      <div className="admin-visual-actions">
        <Button disabled={busy} onClick={onSave} type="button">
          {busy ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </article>
  );
}


/**
 * Panneau « Référencement Google » : titre et description, avec compteurs et
 * aperçu du résultat de recherche mis à jour pendant la frappe. Laissés vides,
 * le titre et l'accroche de l'article sont utilisés.
 */
function ArticleSeoPanel({
  draft,
  onChange,
}: {
  draft: ArticleDraft;
  onChange: (updater: (current: ArticleDraft) => ArticleDraft) => void;
}) {
  const TITLE_LIMIT = 60;
  const DESCRIPTION_LIMIT = 160;

  // Ce que Google affichera réellement : la valeur saisie, ou le repli.
  const effectiveTitle = draft.seoTitle.trim() || draft.title.trim() || "Titre de l'article";
  const effectiveDescription =
    draft.seoDescription.trim() ||
    draft.excerpt.trim() ||
    draft.bodyHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, DESCRIPTION_LIMIT) ||
    "Description de l'article.";

  const custom = Boolean(draft.seoTitle.trim() || draft.seoDescription.trim());

  return (
    <details className="admin-seo-panel">
      <summary>
        Référencement Google
        <span className={`admin-seo-tag${custom ? " is-custom" : ""}`}>
          {custom ? "personnalisé" : "valeurs automatiques"}
        </span>
      </summary>

      <div className="admin-seo-body">
        <label>
          <span>
            Titre pour Google
            <em className={draft.seoTitle.length > TITLE_LIMIT ? "is-over" : ""}>
              {draft.seoTitle.length} / {TITLE_LIMIT}
            </em>
          </span>
          <input
            className="ui-field"
            onChange={(event) => onChange((current) => ({ ...current, seoTitle: event.target.value }))}
            placeholder={draft.title || "Repris du titre de l'article"}
            value={draft.seoTitle}
          />
        </label>

        <label>
          <span>
            Description pour Google
            <em className={draft.seoDescription.length > DESCRIPTION_LIMIT ? "is-over" : ""}>
              {draft.seoDescription.length} / {DESCRIPTION_LIMIT}
            </em>
          </span>
          <textarea
            className="ui-field"
            onChange={(event) => onChange((current) => ({ ...current, seoDescription: event.target.value }))}
            placeholder="Reprise de l'accroche de l'article"
            rows={3}
            value={draft.seoDescription}
          />
        </label>

        <div className="admin-seo-preview">
          <span className="admin-seo-preview-label">Aperçu du résultat de recherche</span>
          <div className="admin-seo-preview-card">
            <span className="admin-seo-preview-url">oxideve.com › actualites › {draft.slug || "nouvel-article"}</span>
            <strong className="admin-seo-preview-title">{effectiveTitle}</strong>
            <span className="admin-seo-preview-description">{effectiveDescription}</span>
          </div>
        </div>
      </div>
    </details>
  );
}


/** Formulaire vierge, ou pré-rempli avec l'avis en cours d'édition. */
function toReviewDraft(review?: Review) {
  return {
    id: review?.id || "",
    author: review?.author || "",
    rating: review?.rating ?? 5,
    quote: review?.quote || "",
    source: review?.source || "Google",
    city: review?.city || "",
    period: review?.period || "",
    published: review?.published !== false,
    position: review?.position ?? 0,
  };
}

/**
 * Écran « Avis » : ajouter, modifier, supprimer les témoignages affichés dans
 * le carrousel de la page d'accueil.
 */
function ReviewsPanel({
  onError,
  onFeedback,
}: {
  onError: (message: string) => void;
  onFeedback: (message: string) => void;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [draft, setDraft] = useState(toReviewDraft());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function reload() {
    const response = await fetch("/api/admin/reviews");
    const result = (await response.json().catch(() => null)) as { data?: Review[] } | null;
    if (result?.data) setReviews(result.data);
  }

  useEffect(() => {
    reload()
      .catch(() => onError("Les avis n'ont pas pu être chargés."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    onFeedback("");

    const editing = Boolean(draft.id);
    const response = await fetch(editing ? `/api/admin/reviews/${draft.id}` : "/api/admin/reviews", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: draft.author.trim(),
        rating: draft.rating,
        quote: draft.quote.trim(),
        source: draft.source.trim(),
        city: draft.city.trim(),
        period: draft.period.trim(),
        published: draft.published,
        position: draft.position,
      }),
    });

    setSaving(false);

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      onError(result?.error || "L'avis n'a pas pu être enregistré.");
      return;
    }

    await reload();
    setDraft(toReviewDraft());
    onFeedback(editing ? "Avis mis à jour." : "Avis ajouté.");
  }

  async function handleDelete(review: Review) {
    if (!window.confirm(`Supprimer définitivement l'avis de ${review.author} ?`)) return;

    const response = await fetch(`/api/admin/reviews/${review.id}`, { method: "DELETE" });

    if (!response.ok) {
      onError("L'avis n'a pas pu être supprimé.");
      return;
    }

    await reload();
    if (draft.id === review.id) setDraft(toReviewDraft());
    onFeedback("Avis supprimé.");
  }

  if (loading) {
    return (
      <section className="admin-shell">
        <p>Chargement des avis...</p>
      </section>
    );
  }

  return (
    <div className="admin-editorial">
      <div className="admin-editorial-head">
        <div>
          <h2>Avis clients</h2>
          <span>
            {reviews.length} avis · {reviews.filter((review) => review.published !== false).length} affiché
            {reviews.filter((review) => review.published !== false).length > 1 ? "s" : ""} sur le site
          </span>
        </div>
        {draft.id ? (
          <div className="admin-editorial-head-actions">
            <Button onClick={() => setDraft(toReviewDraft())} variant="secondary">
              Nouvel avis
            </Button>
          </div>
        ) : null}
      </div>

      <section className="admin-shell">
        <span className="admin-editorial-form-title">{draft.id ? "Modifier l'avis" : "Nouvel avis"}</span>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              <span>Auteur</span>
              <input
                className="ui-field"
                onChange={(event) => setDraft((current) => ({ ...current, author: event.target.value }))}
                placeholder="Prénom Nom"
                required
                value={draft.author}
              />
            </label>
            <label>
              <span>Note</span>
              <select
                className="ui-field"
                onChange={(event) => setDraft((current) => ({ ...current, rating: Number(event.target.value) }))}
                value={draft.rating}
              >
                {[5, 4, 3, 2, 1].map((note) => (
                  <option key={note} value={note}>
                    {note} étoile{note > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Agence</span>
              <select
                className="ui-field"
                onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))}
                value={draft.city}
              >
                <option value="">Non précisée</option>
                <option value="Montpellier">Montpellier</option>
                <option value="Toulouse">Toulouse</option>
              </select>
            </label>
            <label>
              <span>Période</span>
              <input
                className="ui-field"
                onChange={(event) => setDraft((current) => ({ ...current, period: event.target.value }))}
                placeholder="septembre 2026"
                value={draft.period}
              />
            </label>
          </div>

          <label>
            <span>Avis</span>
            <textarea
              className="ui-field"
              onChange={(event) => setDraft((current) => ({ ...current, quote: event.target.value }))}
              required
              rows={4}
              value={draft.quote}
            />
          </label>

          <label className="contact-form-full admin-checkbox-item admin-checkbox-boxed">
            <input
              checked={draft.published}
              onChange={(event) => setDraft((current) => ({ ...current, published: event.target.checked }))}
              type="checkbox"
            />
            <span>
              Afficher sur le site
              <small className="admin-field-hint">Décoché, l&apos;avis est conservé mais retiré du carrousel.</small>
            </span>
          </label>

          <div className="admin-article-actions">
            <Button disabled={saving} type="submit">
              {saving ? "Enregistrement..." : draft.id ? "Mettre à jour" : "Ajouter l'avis"}
            </Button>
            {draft.id ? (
              <Button onClick={() => setDraft(toReviewDraft())} type="button" variant="secondary">
                Annuler
              </Button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="admin-shell">
        <div className="admin-editorial-list-head">
          <h3>Tous les avis</h3>
        </div>

        <table className="admin-editorial-table">
          <thead>
            <tr>
              <th>Auteur</th>
              <th>Note</th>
              <th>Avis</th>
              <th>Agence</th>
              <th>Affiché</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr className={draft.id === review.id ? "is-active" : ""} key={review.id}>
                <td>
                  <strong>{review.author}</strong>
                  <span className="admin-editorial-slug">{review.period || "—"}</span>
                </td>
                <td>
                  <span className="admin-review-stars">{"★".repeat(review.rating)}</span>
                </td>
                <td className="admin-review-quote">{review.quote}</td>
                <td>{review.city || "—"}</td>
                <td>
                  <span className={review.published === false ? "admin-editorial-draft" : ""}>
                    {review.published === false ? "Masqué" : "Oui"}
                  </span>
                </td>
                <td>
                  <div className="admin-editorial-row-actions">
                    <button className="admin-copy-button" onClick={() => setDraft(toReviewDraft(review))} type="button">
                      Modifier
                    </button>
                    <button
                      className="admin-copy-button admin-copy-button-danger"
                      onClick={() => handleDelete(review)}
                      type="button"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
