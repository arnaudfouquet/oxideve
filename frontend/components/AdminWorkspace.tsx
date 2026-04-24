"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import type { Article, Company, CrmInteraction, CrmTask, Formation, Registration, Session } from "../../shared/types";

type Props = {
  initialArticles: Article[];
  initialCompanies: Company[];
  initialCrmInteractions: CrmInteraction[];
  initialCrmTasks: CrmTask[];
  initialFormations: Formation[];
  initialSessions: Session[];
  initialRegistrations: Registration[];
};

type Section = "dashboard" | "companies" | "sessions" | "formations" | "editorial";

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
  programme: string;
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

type CompanyDraft = {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  priority: string;
  owner: string;
  nextFollowUpAt: string;
  lastContactAt: string;
  notes: string;
};

type TaskDraft = {
  id: string;
  companyId: string;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  owner: string;
};

type InteractionDraft = {
  companyId: string;
  type: string;
  channel: string;
  summary: string;
  owner: string;
  occurredAt: string;
};

type CompanySummary = {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  priority: string;
  owner: string;
  notes: string;
  registrations: number;
  formations: string[];
  nextSessionLabel: string;
  nextSessionDate?: string;
  lastContactLabel: string;
  followUpLabel: string;
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

function toCompanyDraft(company?: Company): CompanyDraft {
  return {
    id: company?.id || "",
    name: company?.name || "",
    contactName: company?.contactName || "",
    email: company?.email || "",
    phone: company?.phone || "",
    status: company?.status || "Prospect",
    source: company?.source || "Inbound",
    priority: company?.priority || "Normale",
    owner: company?.owner || "",
    nextFollowUpAt: company?.nextFollowUpAt?.slice(0, 10) || "",
    lastContactAt: company?.lastContactAt?.slice(0, 10) || "",
    notes: company?.notes || "",
  };
}

function toTaskDraft(task?: CrmTask, companyId = ""): TaskDraft {
  return {
    id: task?.id || "",
    companyId: task?.companyId || companyId,
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "A faire",
    dueDate: task?.dueDate?.slice(0, 10) || "",
    owner: task?.owner || "",
  };
}

function toInteractionDraft(companyId = ""): InteractionDraft {
  return {
    companyId,
    type: "Appel",
    channel: "Téléphone",
    summary: "",
    owner: "",
    occurredAt: new Date().toISOString().slice(0, 10),
  };
}

export function AdminWorkspace({
  initialArticles,
  initialCompanies,
  initialCrmInteractions,
  initialCrmTasks,
  initialFormations,
  initialSessions,
  initialRegistrations,
}: Props) {
  const [section, setSection] = useState<Section>("dashboard");
  const [articles, setArticles] = useState(initialArticles);
  const [companies, setCompanies] = useState(initialCompanies);
  const [crmInteractions, setCrmInteractions] = useState(initialCrmInteractions);
  const [crmTasks, setCrmTasks] = useState(initialCrmTasks);
  const [formations, setFormations] = useState(initialFormations);
  const [sessions, setSessions] = useState(initialSessions);
  const [registrations] = useState(initialRegistrations);

  const [editingFormationSlug, setEditingFormationSlug] = useState(initialFormations[0]?.slug || "");
  const [editingSessionId, setEditingSessionId] = useState(initialSessions[0]?.id || "");
  const [editingArticleSlug, setEditingArticleSlug] = useState(initialArticles[0]?.slug || "");
  const [editingCompanyId, setEditingCompanyId] = useState(initialCompanies[0]?.id || "");

  const [formationDraft, setFormationDraft] = useState(toFormationDraft(initialFormations[0]));
  const [sessionDraft, setSessionDraft] = useState(toSessionDraft(initialSessions[0]));
  const [articleDraft, setArticleDraft] = useState(toArticleDraft(initialArticles[0]));
  const [companyDraft, setCompanyDraft] = useState(toCompanyDraft(initialCompanies[0]));
  const [taskDraft, setTaskDraft] = useState(toTaskDraft(undefined, initialCompanies[0]?.id || ""));
  const [interactionDraft, setInteractionDraft] = useState(toInteractionDraft(initialCompanies[0]?.id || ""));

  const [companySearch, setCompanySearch] = useState("");
  const [companyStatusFilter, setCompanyStatusFilter] = useState("Tous");
  const [companyOwnerFilter, setCompanyOwnerFilter] = useState("Tous");
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [bulkCompanyStatus, setBulkCompanyStatus] = useState("");
  const [bulkCompanyOwner, setBulkCompanyOwner] = useState("");
  const [bulkCompanyPriority, setBulkCompanyPriority] = useState("");
  const [bulkCompanyFollowUp, setBulkCompanyFollowUp] = useState("");

  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionStateFilter, setSessionStateFilter] = useState("Tous");
  const [sessionCategoryFilter, setSessionCategoryFilter] = useState("Toutes");
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [bulkSessionMode, setBulkSessionMode] = useState("");
  const [bulkSessionCity, setBulkSessionCity] = useState("");
  const [bulkSessionSeats, setBulkSessionSeats] = useState("");

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">("success");

  const owners = useMemo(() => {
    const values = new Set<string>();
    for (const company of companies) {
      if (company.owner) values.add(company.owner);
    }
    for (const task of crmTasks) {
      if (task.owner) values.add(task.owner);
    }
    for (const interaction of crmInteractions) {
      if (interaction.owner) values.add(interaction.owner);
    }
    return [...values].sort((left, right) => left.localeCompare(right, "fr"));
  }, [companies, crmInteractions, crmTasks]);

  const registrationDetails = useMemo<RegistrationDetail[]>(() => {
    return registrations.map((registration) => ({
      registration,
      formation: formations.find((formation) => formation.slug === registration.formationSlug),
      session: sessions.find((session) => session.id === registration.sessionId),
    }));
  }, [formations, registrations, sessions]);

  const registrationsBySession = useMemo(() => {
    return registrations.reduce<Record<string, number>>((accumulator, registration) => {
      accumulator[registration.sessionId] = (accumulator[registration.sessionId] || 0) + 1;
      return accumulator;
    }, {});
  }, [registrations]);

  const registrationsByFormation = useMemo(() => {
    return registrations.reduce<Record<string, number>>((accumulator, registration) => {
      accumulator[registration.formationSlug] = (accumulator[registration.formationSlug] || 0) + 1;
      return accumulator;
    }, {});
  }, [registrations]);

  const companySummaries = useMemo<CompanySummary[]>(() => {
    return companies
      .map((company) => {
        const details = registrationDetails.filter((detail) => detail.registration.companyId === company.id);
        const formationsForCompany = Array.from(new Set(details.map((detail) => detail.formation?.shortTitle || detail.registration.formationSlug)));
        const nextSession = details
          .filter((detail) => isUpcoming(detail.session))
          .map((detail) => detail.session)
          .filter(Boolean)
          .sort((left, right) => compareDate(left?.startDate, right?.startDate))[0];

        return {
          id: company.id,
          name: company.name,
          contactName: company.contactName,
          email: company.email,
          phone: company.phone,
          status: company.status,
          source: company.source,
          priority: company.priority,
          owner: company.owner || "Non affecté",
          notes: company.notes,
          registrations: details.length,
          formations: formationsForCompany,
          nextSessionDate: nextSession?.startDate,
          nextSessionLabel: nextSession ? formatDateLabel(nextSession.startDate) : "Aucune session future",
          lastContactLabel: formatDateLabel(company.lastContactAt),
          followUpLabel: formatDateLabel(company.nextFollowUpAt),
        };
      })
      .sort((left, right) => compareDateDesc(left.nextSessionDate || left.lastContactLabel, right.nextSessionDate || right.lastContactLabel));
  }, [companies, registrationDetails]);

  const currentCompany = companies.find((company) => company.id === editingCompanyId) || companies[0];
  const currentCompanyTasks = crmTasks.filter((task) => task.companyId === editingCompanyId).sort((left, right) => compareDate(left.dueDate, right.dueDate));
  const currentCompanyInteractions = crmInteractions
    .filter((interaction) => interaction.companyId === editingCompanyId)
    .sort((left, right) => compareDateDesc(left.occurredAt, right.occurredAt));

  const filteredCompanies = companySummaries.filter((company) => {
    const matchesSearch = !companySearch.trim() || `${company.name} ${company.contactName} ${company.email} ${company.formations.join(" ")}`.toLowerCase().includes(companySearch.trim().toLowerCase());
    const matchesStatus = companyStatusFilter === "Tous" || company.status === companyStatusFilter;
    const matchesOwner = companyOwnerFilter === "Tous" || (company.owner || "") === companyOwnerFilter;
    return matchesSearch && matchesStatus && matchesOwner;
  });

  const filteredSessions = sessions.filter((session) => {
    const formation = formations.find((item) => item.slug === session.formationSlug);
    const state = getSessionState(session);
    const matchesSearch = !sessionSearch.trim() || `${formation?.title || ""} ${session.city} ${session.mode}`.toLowerCase().includes(sessionSearch.trim().toLowerCase());
    const matchesState = sessionStateFilter === "Tous" || state === sessionStateFilter;
    const matchesCategory = sessionCategoryFilter === "Toutes" || formation?.category === sessionCategoryFilter;
    return matchesSearch && matchesState && matchesCategory;
  });

  const pipeline = useMemo(() => {
    const counters = new Map<string, number>();
    for (const company of companies) {
      counters.set(company.status, (counters.get(company.status) || 0) + 1);
    }
    return [...counters.entries()].map(([status, count]) => ({ status, count }));
  }, [companies]);

  const dueTodayTasks = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return crmTasks.filter((task) => task.dueDate?.slice(0, 10) === today && task.status !== "Terminé");
  }, [crmTasks]);

  const dueFollowUpsToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return companies.filter((company) => company.nextFollowUpAt?.slice(0, 10) === today);
  }, [companies]);

  const ownerLoads = useMemo(() => {
    return owners.map((owner) => ({
      owner,
      companies: companies.filter((company) => company.owner === owner).length,
      tasks: crmTasks.filter((task) => task.owner === owner && task.status !== "Terminé").length,
    }));
  }, [companies, crmTasks, owners]);

  const totalSeatsLeft = sessions.reduce((total, session) => total + session.seatsLeft, 0);

  function setSuccess(message: string) {
    setFeedbackTone("success");
    setFeedback(message);
  }

  function setError(message: string) {
    setFeedbackTone("error");
    setFeedback(message);
  }

  function selectCompany(companyId: string) {
    const company = companies.find((item) => item.id === companyId);
    setEditingCompanyId(companyId);
    setCompanyDraft(toCompanyDraft(company));
    setTaskDraft(toTaskDraft(undefined, companyId));
    setInteractionDraft(toInteractionDraft(companyId));
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

  function selectArticle(slug: string) {
    const article = articles.find((item) => item.slug === slug);
    setEditingArticleSlug(slug);
    setArticleDraft(toArticleDraft(article));
    setFeedback("");
  }

  async function handleCompanySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFeedback("");

    const payload = {
      name: companyDraft.name.trim(),
      contactName: companyDraft.contactName.trim(),
      email: companyDraft.email.trim(),
      phone: companyDraft.phone.trim(),
      status: companyDraft.status.trim(),
      source: companyDraft.source.trim(),
      priority: companyDraft.priority.trim(),
      owner: companyDraft.owner.trim(),
      notes: companyDraft.notes.trim(),
      nextFollowUpAt: companyDraft.nextFollowUpAt,
      lastContactAt: companyDraft.lastContactAt,
    };

    const isEditing = Boolean(editingCompanyId);
    const response = await fetch(isEditing ? `/api/admin/companies/${editingCompanyId}` : "/api/admin/companies", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = (await response.json().catch(() => null)) as { data?: Company; error?: string; message?: string } | null;
    if (!response.ok || !result?.data) {
      setSaving(false);
      setError(result?.error || "La fiche entreprise n'a pas pu être enregistrée.");
      return;
    }

    const saved = result.data;
    setCompanies((current) => [...current.filter((item) => item.id !== saved.id), saved]);
    selectCompany(saved.id);
    setSaving(false);
    setSuccess(result.message || "Fiche entreprise enregistrée.");
  }

  async function handleTaskSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCompanyId) return;
    setSaving(true);
    setFeedback("");

    const payload = {
      companyId: editingCompanyId,
      title: taskDraft.title.trim(),
      description: taskDraft.description.trim(),
      status: taskDraft.status.trim(),
      dueDate: taskDraft.dueDate,
      owner: taskDraft.owner.trim(),
    };

    const isEditing = Boolean(taskDraft.id);
    const response = await fetch(isEditing ? `/api/admin/crm/tasks/${taskDraft.id}` : "/api/admin/crm/tasks", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json().catch(() => null)) as { data?: CrmTask; error?: string; message?: string } | null;

    if (!response.ok || !result?.data) {
      setSaving(false);
      setError(result?.error || "La tâche n'a pas pu être enregistrée.");
      return;
    }

    const saved = result.data;
    setCrmTasks((current) => [...current.filter((item) => item.id !== saved.id), saved]);
    setTaskDraft(toTaskDraft(undefined, editingCompanyId));
    setSaving(false);
    setSuccess(result.message || "Tâche CRM enregistrée.");
  }

  async function handleInteractionSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCompanyId) return;
    setSaving(true);
    setFeedback("");

    const payload = {
      companyId: editingCompanyId,
      type: interactionDraft.type.trim(),
      channel: interactionDraft.channel.trim(),
      summary: interactionDraft.summary.trim(),
      owner: interactionDraft.owner.trim(),
      occurredAt: interactionDraft.occurredAt,
    };

    const response = await fetch("/api/admin/crm/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json().catch(() => null)) as { data?: CrmInteraction; error?: string; message?: string } | null;

    if (!response.ok || !result?.data) {
      setSaving(false);
      setError(result?.error || "L'échange n'a pas pu être enregistré.");
      return;
    }

    setCrmInteractions((current) => [result.data as CrmInteraction, ...current]);
    setInteractionDraft(toInteractionDraft(editingCompanyId));
    setSaving(false);
    setSuccess(result.message || "Échange enregistré.");
  }

  async function handleBulkCompanyApply() {
    if (!selectedCompanyIds.length) return;
    setSaving(true);
    setFeedback("");

    try {
      await Promise.all(
        selectedCompanyIds.map(async (companyId) => {
          const company = companies.find((item) => item.id === companyId);
          if (!company) return;

          const payload = {
            name: company.name,
            contactName: company.contactName,
            email: company.email,
            phone: company.phone,
            status: bulkCompanyStatus || company.status,
            source: company.source,
            priority: bulkCompanyPriority || company.priority,
            owner: bulkCompanyOwner || company.owner || "",
            notes: company.notes,
            nextFollowUpAt: bulkCompanyFollowUp || company.nextFollowUpAt?.slice(0, 10) || "",
            lastContactAt: company.lastContactAt?.slice(0, 10) || "",
          };

          const response = await fetch(`/api/admin/companies/${companyId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error("Bulk company update failed");
          }

          const result = (await response.json()) as { data: Company };
          setCompanies((current) => [...current.filter((item) => item.id !== companyId), result.data]);
        }),
      );

      setSelectedCompanyIds([]);
      setSuccess("Actions de masse entreprises appliquées.");
    } catch {
      setError("Impossible d'appliquer les actions de masse entreprises.");
    } finally {
      setSaving(false);
    }
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
      programme: splitLines(formationDraft.programme),
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
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <span className="eyebrow">Pilotage</span>
          <h2>Mini CMS Oxideve</h2>
          <p>Dashboard, CRM, sessions, catalogue et éditorial regroupés dans une navigation fixe à gauche.</p>
        </div>
        <div className="admin-sidebar-nav">
          {[
            ["dashboard", "Dashboard"],
            ["companies", "CRM"],
            ["sessions", "Sessions"],
            ["formations", "Catalogue"],
            ["editorial", "Editorial"],
          ].map(([value, label]) => (
            <button className={`admin-sidebar-link${section === value ? " active" : ""}`} key={value} onClick={() => setSection(value as Section)} type="button">
              {label}
            </button>
          ))}
        </div>
      </aside>

      <div className="admin-workspace-content">
        {feedback ? <p className={`form-status ${feedbackTone}`}>{feedback}</p> : null}

      {section === "dashboard" ? (
        <div className="admin-stack-grid">
          <section className="admin-shell admin-shell-hero">
            <div className="section-heading section-heading-tight">
              <div>
                <span className="eyebrow">Commercial</span>
                <h2>Vue commerciale</h2>
                <p>Pipeline, relances du jour, charge par propriétaire et pression sur les prochaines sessions.</p>
              </div>
            </div>
            <div className="admin-metric-grid">
              <article className="admin-metric-card"><span>Catalogue</span><strong>{formations.length}</strong><small>formations</small></article>
              <article className="admin-metric-card"><span>Sessions</span><strong>{sessions.filter((session) => isUpcoming(session)).length}</strong><small>à venir</small></article>
              <article className="admin-metric-card"><span>Entreprises</span><strong>{companies.length}</strong><small>en portefeuille</small></article>
              <article className="admin-metric-card"><span>Tâches</span><strong>{crmTasks.filter((task) => task.status !== "Terminé").length}</strong><small>ouvertes</small></article>
              <article className="admin-metric-card"><span>Places</span><strong>{totalSeatsLeft}</strong><small>encore disponibles</small></article>
            </div>
          </section>

          <div className="admin-grid admin-grid-wide">
            <section className="admin-shell">
              <div className="section-heading section-heading-tight"><div><span className="eyebrow">Pipeline</span><h2>Statuts du pipeline</h2></div></div>
              <div className="admin-pipeline-grid">
                {pipeline.map((item) => (
                  <article className="admin-pipeline-card" key={item.status}>
                    <strong>{item.count}</strong>
                    <span>{item.status}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="admin-shell">
              <div className="section-heading section-heading-tight"><div><span className="eyebrow">Relances</span><h2>À traiter aujourd'hui</h2></div></div>
              <div className="admin-timeline-list">
                {dueFollowUpsToday.length === 0 ? <div className="admin-empty-state">Aucune relance planifiée aujourd'hui.</div> : null}
                {dueFollowUpsToday.map((company) => (
                  <button className="admin-timeline-card" key={company.id} onClick={() => { setSection("companies"); selectCompany(company.id); }} type="button">
                    <strong>{company.name}</strong>
                    <span>{company.contactName}</span>
                    <span>{company.owner || "Non affecté"}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="admin-grid admin-grid-wide">
            <section className="admin-shell">
              <div className="section-heading section-heading-tight"><div><span className="eyebrow">Tâches</span><h2>Tâches du jour</h2></div></div>
              <div className="admin-task-list">
                {dueTodayTasks.length === 0 ? <div className="admin-empty-state">Aucune tâche à échéance aujourd'hui.</div> : null}
                {dueTodayTasks.map((task) => (
                  <article className="admin-task-card" key={task.id}>
                    <strong>{task.title}</strong>
                    <span>{companies.find((company) => company.id === task.companyId)?.name || "Entreprise"}</span>
                    <span>{task.owner || "Non affecté"} · {task.status}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="admin-shell">
              <div className="section-heading section-heading-tight"><div><span className="eyebrow">Owners</span><h2>Charge par propriétaire</h2></div></div>
              <div className="admin-owner-grid">
                {ownerLoads.length === 0 ? <div className="admin-empty-state">Aucun propriétaire commercial défini.</div> : null}
                {ownerLoads.map((item) => (
                  <article className="admin-owner-card" key={item.owner}>
                    <strong>{item.owner}</strong>
                    <span>{item.companies} entreprises</span>
                    <span>{item.tasks} tâches ouvertes</span>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {section === "companies" ? (
        <div className="admin-stack-grid">
          <section className="admin-shell">
            <div className="section-heading section-heading-tight">
              <div>
                <span className="eyebrow">CRM</span>
                <h2>Portefeuille entreprises</h2>
                <p>Filtrez, sélectionnez en masse, affectez un owner et suivez tâches et échanges au même endroit.</p>
              </div>
              <Button variant="secondary" onClick={() => {
                setEditingCompanyId("");
                setCompanyDraft(toCompanyDraft());
                setTaskDraft(toTaskDraft());
                setInteractionDraft(toInteractionDraft());
              }}>Nouvelle fiche</Button>
            </div>

            <div className="admin-filter-grid">
              <label><span>Recherche</span><input className="ui-field" value={companySearch} onChange={(event) => setCompanySearch(event.target.value)} placeholder="Entreprise, contact, parcours..." /></label>
              <label><span>Statut</span><select className="ui-field" value={companyStatusFilter} onChange={(event) => setCompanyStatusFilter(event.target.value)}><option>Tous</option><option>Prospect</option><option>Qualifié</option><option>Client</option><option>Perdu</option></select></label>
              <label><span>Owner</span><select className="ui-field" value={companyOwnerFilter} onChange={(event) => setCompanyOwnerFilter(event.target.value)}><option>Tous</option>{owners.map((owner) => <option key={owner}>{owner}</option>)}</select></label>
            </div>

            <div className="admin-bulk-grid">
              <label><span>Statut masse</span><select className="ui-field" value={bulkCompanyStatus} onChange={(event) => setBulkCompanyStatus(event.target.value)}><option value="">Conserver</option><option>Prospect</option><option>Qualifié</option><option>Client</option><option>Perdu</option></select></label>
              <label><span>Owner masse</span><input className="ui-field" value={bulkCompanyOwner} onChange={(event) => setBulkCompanyOwner(event.target.value)} placeholder="Camille, Arnaud..." /></label>
              <label><span>Priorité masse</span><select className="ui-field" value={bulkCompanyPriority} onChange={(event) => setBulkCompanyPriority(event.target.value)}><option value="">Conserver</option><option>Basse</option><option>Normale</option><option>Haute</option></select></label>
              <label><span>Relance masse</span><input className="ui-field" type="date" value={bulkCompanyFollowUp} onChange={(event) => setBulkCompanyFollowUp(event.target.value)} /></label>
              <Button onClick={handleBulkCompanyApply} disabled={saving || !selectedCompanyIds.length}>Appliquer à {selectedCompanyIds.length || 0} entreprise(s)</Button>
            </div>
          </section>

          <div className="admin-dual-pane">
            <section className="admin-shell">
              <div className="admin-list admin-list-dense">
                {filteredCompanies.map((company) => (
                  <button className={`admin-list-item admin-selectable-item${editingCompanyId === company.id ? " active" : ""}`} key={company.id} onClick={() => selectCompany(company.id)} type="button">
                    <span className="admin-check-line" onClick={(event) => event.stopPropagation()}>
                      <input checked={selectedCompanyIds.includes(company.id)} onChange={(event) => {
                        setSelectedCompanyIds((current) => event.target.checked ? [...current, company.id] : current.filter((item) => item !== company.id));
                      }} type="checkbox" />
                    </span>
                    <strong>{company.name}</strong>
                    <span>{company.contactName} · {company.status} · {company.priority}</span>
                    <span>{company.formations.join(", ") || "Aucun parcours"}</span>
                    <span>{company.owner} · Relance {company.followUpLabel}</span>
                  </button>
                ))}
              </div>
            </section>

            <div className="admin-detail-stack">
              <section className="admin-shell">
                <div className="section-heading section-heading-tight"><div><span className="eyebrow">Fiche</span><h2>{editingCompanyId ? "Modifier l'entreprise" : "Créer une entreprise"}</h2></div></div>
                <form className="contact-form" onSubmit={handleCompanySubmit}>
                  <div className="form-grid">
                    <label><span>Entreprise</span><input className="ui-field" value={companyDraft.name} onChange={(event) => setCompanyDraft((current) => ({ ...current, name: event.target.value }))} required /></label>
                    <label><span>Contact</span><input className="ui-field" value={companyDraft.contactName} onChange={(event) => setCompanyDraft((current) => ({ ...current, contactName: event.target.value }))} required /></label>
                    <label><span>Email</span><input className="ui-field" type="email" value={companyDraft.email} onChange={(event) => setCompanyDraft((current) => ({ ...current, email: event.target.value }))} required /></label>
                    <label><span>Téléphone</span><input className="ui-field" value={companyDraft.phone} onChange={(event) => setCompanyDraft((current) => ({ ...current, phone: event.target.value }))} required /></label>
                    <label><span>Statut</span><select className="ui-field" value={companyDraft.status} onChange={(event) => setCompanyDraft((current) => ({ ...current, status: event.target.value }))}><option>Prospect</option><option>Qualifié</option><option>Client</option><option>Perdu</option></select></label>
                    <label><span>Source</span><select className="ui-field" value={companyDraft.source} onChange={(event) => setCompanyDraft((current) => ({ ...current, source: event.target.value }))}><option>Inbound</option><option>Relance</option><option>Partenaire</option><option>Réseau</option><option>Manuel</option></select></label>
                    <label><span>Priorité</span><select className="ui-field" value={companyDraft.priority} onChange={(event) => setCompanyDraft((current) => ({ ...current, priority: event.target.value }))}><option>Basse</option><option>Normale</option><option>Haute</option></select></label>
                    <label><span>Owner commercial</span><input className="ui-field" value={companyDraft.owner} onChange={(event) => setCompanyDraft((current) => ({ ...current, owner: event.target.value }))} placeholder="Camille, Arnaud..." /></label>
                    <label><span>Dernier contact</span><input className="ui-field" type="date" value={companyDraft.lastContactAt} onChange={(event) => setCompanyDraft((current) => ({ ...current, lastContactAt: event.target.value }))} /></label>
                    <label><span>Prochaine relance</span><input className="ui-field" type="date" value={companyDraft.nextFollowUpAt} onChange={(event) => setCompanyDraft((current) => ({ ...current, nextFollowUpAt: event.target.value }))} /></label>
                  </div>
                  <label><span>Notes</span><textarea className="ui-field" rows={5} value={companyDraft.notes} onChange={(event) => setCompanyDraft((current) => ({ ...current, notes: event.target.value }))} /></label>
                  <Button disabled={saving} type="submit">{saving ? "Enregistrement..." : editingCompanyId ? "Mettre à jour la fiche" : "Créer la fiche"}</Button>
                </form>
              </section>

              <div className="admin-grid admin-grid-wide">
                <section className="admin-shell">
                  <div className="section-heading section-heading-tight"><div><span className="eyebrow">Tâches</span><h2>Tâches CRM</h2></div></div>
                  <form className="contact-form" onSubmit={handleTaskSubmit}>
                    <label><span>Tâche</span><input className="ui-field" value={taskDraft.title} onChange={(event) => setTaskDraft((current) => ({ ...current, title: event.target.value }))} required /></label>
                    <div className="form-grid">
                      <label><span>Statut</span><select className="ui-field" value={taskDraft.status} onChange={(event) => setTaskDraft((current) => ({ ...current, status: event.target.value }))}><option>A faire</option><option>En cours</option><option>Bloqué</option><option>Terminé</option></select></label>
                      <label><span>Owner</span><input className="ui-field" value={taskDraft.owner} onChange={(event) => setTaskDraft((current) => ({ ...current, owner: event.target.value }))} /></label>
                      <label><span>Échéance</span><input className="ui-field" type="date" value={taskDraft.dueDate} onChange={(event) => setTaskDraft((current) => ({ ...current, dueDate: event.target.value }))} /></label>
                    </div>
                    <label><span>Description</span><textarea className="ui-field" rows={4} value={taskDraft.description} onChange={(event) => setTaskDraft((current) => ({ ...current, description: event.target.value }))} /></label>
                    <Button disabled={saving || !editingCompanyId} type="submit">Ajouter la tâche</Button>
                  </form>
                  <div className="admin-task-list">
                    {currentCompanyTasks.map((task) => (
                      <article className="admin-task-card" key={task.id}>
                        <strong>{task.title}</strong>
                        <span>{task.status} · {task.owner || "Non affecté"}</span>
                        <span>{formatDateLabel(task.dueDate)}</span>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="admin-shell">
                  <div className="section-heading section-heading-tight"><div><span className="eyebrow">Historique</span><h2>Échanges</h2></div></div>
                  <form className="contact-form" onSubmit={handleInteractionSubmit}>
                    <div className="form-grid">
                      <label><span>Type</span><select className="ui-field" value={interactionDraft.type} onChange={(event) => setInteractionDraft((current) => ({ ...current, type: event.target.value }))}><option>Appel</option><option>Email</option><option>Rendez-vous</option><option>Relance</option><option>Note interne</option></select></label>
                      <label><span>Canal</span><input className="ui-field" value={interactionDraft.channel} onChange={(event) => setInteractionDraft((current) => ({ ...current, channel: event.target.value }))} /></label>
                      <label><span>Owner</span><input className="ui-field" value={interactionDraft.owner} onChange={(event) => setInteractionDraft((current) => ({ ...current, owner: event.target.value }))} /></label>
                      <label><span>Date</span><input className="ui-field" type="date" value={interactionDraft.occurredAt} onChange={(event) => setInteractionDraft((current) => ({ ...current, occurredAt: event.target.value }))} /></label>
                    </div>
                    <label><span>Résumé</span><textarea className="ui-field" rows={4} value={interactionDraft.summary} onChange={(event) => setInteractionDraft((current) => ({ ...current, summary: event.target.value }))} required /></label>
                    <Button disabled={saving || !editingCompanyId} type="submit">Ajouter l'échange</Button>
                  </form>
                  <div className="admin-timeline-list">
                    {currentCompanyInteractions.map((interaction) => (
                      <article className="admin-timeline-card" key={interaction.id}>
                        <strong>{interaction.type}</strong>
                        <span>{interaction.channel || "Canal non renseigné"}</span>
                        <span>{interaction.summary}</span>
                        <span>{formatDateLabel(interaction.occurredAt)} · {interaction.owner || "Non affecté"}</span>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>

          <section className="admin-shell">
            <div className="section-heading section-heading-tight"><div><span className="eyebrow">Demandes</span><h2>Dernières inscriptions</h2></div></div>
            <div className="data-table admin-table-shell admin-table-shell-solid">
              <table>
                <thead>
                  <tr><th>Date</th><th>Entreprise</th><th>Contact</th><th>Formation</th><th>Session</th></tr>
                </thead>
                <tbody>
                  {registrationDetails.map((detail) => (
                    <tr key={detail.registration.id}>
                      <td>{formatRegistrationDate(detail.registration.createdAt)}</td>
                      <td>{detail.registration.company}</td>
                      <td>{detail.registration.contactName}<br />{detail.registration.email}</td>
                      <td>{detail.formation?.shortTitle || detail.registration.formationSlug}</td>
                      <td>{detail.session ? formatSessionRange(detail.session.startDate, detail.session.endDate) : detail.registration.sessionId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}

      {section === "sessions" ? (
        <div className="admin-stack-grid">
          <section className="admin-shell">
            <div className="section-heading section-heading-tight"><div><span className="eyebrow">Planning</span><h2>Filtres et actions de masse</h2><p>Filtrez le planning puis appliquez une modification à une sélection de sessions.</p></div></div>
            <div className="admin-filter-grid">
              <label><span>Recherche</span><input className="ui-field" value={sessionSearch} onChange={(event) => setSessionSearch(event.target.value)} placeholder="Formation, ville, mode..." /></label>
              <label><span>État</span><select className="ui-field" value={sessionStateFilter} onChange={(event) => setSessionStateFilter(event.target.value)}><option>Tous</option><option>À venir</option><option>Dernières places</option><option>Complet</option><option>Passée</option></select></label>
              <label><span>Catégorie</span><select className="ui-field" value={sessionCategoryFilter} onChange={(event) => setSessionCategoryFilter(event.target.value)}><option>Toutes</option>{Array.from(new Set(formations.map((formation) => formation.category))).sort((a, b) => a.localeCompare(b, "fr")).map((category) => <option key={category}>{category}</option>)}</select></label>
            </div>
            <div className="admin-bulk-grid">
              <label><span>Mode masse</span><input className="ui-field" value={bulkSessionMode} onChange={(event) => setBulkSessionMode(event.target.value)} placeholder="Présentiel, Distanciel..." /></label>
              <label><span>Ville masse</span><input className="ui-field" value={bulkSessionCity} onChange={(event) => setBulkSessionCity(event.target.value)} placeholder="Rouen, Paris..." /></label>
              <label><span>Places restantes</span><input className="ui-field" type="number" min="0" value={bulkSessionSeats} onChange={(event) => setBulkSessionSeats(event.target.value)} placeholder="10" /></label>
              <Button onClick={handleBulkSessionApply} disabled={saving || !selectedSessionIds.length}>Appliquer à {selectedSessionIds.length || 0} session(s)</Button>
            </div>
          </section>

          <div className="admin-dual-pane">
            <section className="admin-shell">
              <div className="admin-list admin-list-dense">
                {filteredSessions.map((session) => {
                  const formation = formations.find((item) => item.slug === session.formationSlug);
                  return (
                    <button className={`admin-list-item admin-selectable-item${editingSessionId === session.id ? " active" : ""}`} key={session.id} onClick={() => selectSession(session.id)} type="button">
                      <span className="admin-check-line" onClick={(event) => event.stopPropagation()}>
                        <input checked={selectedSessionIds.includes(session.id)} onChange={(event) => {
                          setSelectedSessionIds((current) => event.target.checked ? [...current, session.id] : current.filter((item) => item !== session.id));
                        }} type="checkbox" />
                      </span>
                      <strong>{formation?.shortTitle || session.formationSlug}</strong>
                      <span>{formatSessionRange(session.startDate, session.endDate)}</span>
                      <span>{formation?.category || "Catégorie"} · {session.city} · {getSessionState(session)}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="admin-shell">
              <div className="section-heading section-heading-tight"><div><span className="eyebrow">Edition</span><h2>{editingSessionId ? "Modifier la session" : "Créer une session"}</h2></div></div>
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
                <Button disabled={saving} type="submit">{saving ? "Enregistrement..." : editingSessionId ? "Mettre à jour" : "Créer la session"}</Button>
              </form>
            </section>
          </div>
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
                <label><span>Programme</span><textarea className="ui-field" rows={8} value={formationDraft.programme} onChange={(event) => setFormationDraft((current) => ({ ...current, programme: event.target.value }))} required /></label>
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
      </div>
    </div>
  );
}