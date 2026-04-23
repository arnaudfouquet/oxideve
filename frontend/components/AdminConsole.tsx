"use client";

import { useMemo, useState } from "react";
import type { Article, Company, Formation, Registration, Session } from "../../shared/types";

type Props = {
  initialArticles: Article[];
  initialCompanies: Company[];
  initialFormations: Formation[];
  initialSessions: Session[];
  initialRegistrations: Registration[];
};

type Panel = "dashboard" | "formations" | "sessions" | "contacts" | "blog";

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
  nextFollowUpAt: string;
  lastContactAt: string;
  notes: string;
};

type RegistrationDetail = {
  registration: Registration;
  formation?: Formation;
  session?: Session;
};

type CompanySummary = {
  id: string;
  key: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  registrations: number;
  upcomingRegistrations: number;
  completedRegistrations: number;
  formations: string[];
  lastContact: string;
  nextSessionDate?: string;
  nextSessionLabel: string;
  nextFollowUpLabel: string;
  status: string;
  source: string;
  priority: string;
  notes: string;
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
    nextFollowUpAt: company?.nextFollowUpAt?.slice(0, 10) || "",
    lastContactAt: company?.lastContactAt?.slice(0, 10) || "",
    notes: company?.notes || "",
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

function sortCompanies(list: Company[]) {
  return [...list].sort((left, right) => compareDateDesc(left.lastContactAt || left.updatedAt, right.lastContactAt || right.updatedAt));
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

export function AdminConsole({ initialArticles, initialCompanies, initialFormations, initialSessions, initialRegistrations }: Props) {
  const [panel, setPanel] = useState<Panel>("dashboard");
  const [articles, setArticles] = useState(initialArticles);
  const [companies, setCompanies] = useState(sortCompanies(initialCompanies));
  const [formations, setFormations] = useState(initialFormations);
  const [sessions, setSessions] = useState(initialSessions);
  const [draft, setDraft] = useState<Draft>(toDraft(initialFormations[0]));
  const [sessionDraft, setSessionDraft] = useState<SessionDraft>(toSessionDraft(initialSessions[0]));
  const [articleDraft, setArticleDraft] = useState<ArticleDraft>(toArticleDraft(initialArticles[0]));
  const [companyDraft, setCompanyDraft] = useState<CompanyDraft>(toCompanyDraft(initialCompanies[0]));
  const [editingSlug, setEditingSlug] = useState(initialFormations[0]?.slug || "");
  const [editingSessionId, setEditingSessionId] = useState(initialSessions[0]?.id || "");
  const [editingArticleSlug, setEditingArticleSlug] = useState(initialArticles[0]?.slug || "");
  const [editingCompanyId, setEditingCompanyId] = useState(initialCompanies[0]?.id || "");
  const [status, setStatus] = useState<string>("");
  const [statusTone, setStatusTone] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);

  const registrationsByFormation = useMemo(() => {
    return initialRegistrations.reduce<Record<string, number>>((accumulator, registration) => {
      accumulator[registration.formationSlug] = (accumulator[registration.formationSlug] || 0) + 1;
      return accumulator;
    }, {});
  }, [initialRegistrations]);

  const registrationsBySession = useMemo(() => {
    return initialRegistrations.reduce<Record<string, number>>((accumulator, registration) => {
      accumulator[registration.sessionId] = (accumulator[registration.sessionId] || 0) + 1;
      return accumulator;
    }, {});
  }, [initialRegistrations]);

  const registrationDetails = useMemo<RegistrationDetail[]>(() => {
    return initialRegistrations.map((registration) => ({
      registration,
      formation: formations.find((formation) => formation.slug === registration.formationSlug),
      session: sessions.find((session) => session.id === registration.sessionId),
    }));
  }, [formations, initialRegistrations, sessions]);

  const upcomingSessions = useMemo(() => {
    return sessions
      .filter((session) => isUpcoming(session))
      .sort((left, right) => compareDate(left.startDate, right.startDate));
  }, [sessions]);

  const operationalAlerts = useMemo(() => {
    const lowSeats = upcomingSessions.filter((session) => session.seatsLeft <= 2);
    const noRegistrations = upcomingSessions.filter((session) => !registrationsBySession[session.id]);
    const categoriesWithoutUpcoming = Array.from(new Set(formations.map((formation) => formation.category))).filter((category) => {
      const categorySlugs = formations.filter((formation) => formation.category === category).map((formation) => formation.slug);
      return !upcomingSessions.some((session) => categorySlugs.includes(session.formationSlug));
    });

    return { lowSeats, noRegistrations, categoriesWithoutUpcoming };
  }, [formations, registrationsBySession, upcomingSessions]);

  const companySummaries = useMemo<CompanySummary[]>(() => {
    const companyMap = new Map<string, CompanySummary>();

    for (const company of companies) {
      companyMap.set(company.id, {
        id: company.id,
        key: company.id,
        company: company.name,
        contactName: company.contactName,
        email: company.email,
        phone: company.phone,
        registrations: 0,
        upcomingRegistrations: 0,
        completedRegistrations: 0,
        formations: [],
        lastContact: company.lastContactAt || company.updatedAt,
        nextSessionDate: undefined,
        nextSessionLabel: "Aucune session future",
        nextFollowUpLabel: company.nextFollowUpAt ? formatDateLabel(company.nextFollowUpAt) : "Non planifiée",
        status: company.status,
        source: company.source,
        priority: company.priority,
        notes: company.notes,
      });
    }

    for (const detail of registrationDetails) {
      const { registration, formation, session } = detail;
      const key = registration.companyId || `${registration.company.toLowerCase()}::${registration.email.toLowerCase()}`;
      const current = companyMap.get(key);
      const upcoming = isUpcoming(session);
      const nextSessionDate = upcoming ? session?.startDate : undefined;
      const formationLabel = formation?.shortTitle || registration.formationSlug;

      if (!current) {
        companyMap.set(key, {
          id: registration.companyId || key,
          key,
          company: registration.company,
          contactName: registration.contactName,
          email: registration.email,
          phone: registration.phone,
          registrations: 1,
          upcomingRegistrations: upcoming ? 1 : 0,
          completedRegistrations: upcoming ? 0 : 1,
          formations: [formationLabel],
          lastContact: registration.createdAt,
          nextSessionDate,
          nextSessionLabel: nextSessionDate ? formatDateLabel(nextSessionDate) : "Aucune session future",
          nextFollowUpLabel: "Non planifiée",
          status: upcoming ? "Prospect" : "Client",
          source: registration.source || "Inbound",
          priority: "Normale",
          notes: "",
        });
        continue;
      }

      current.registrations += 1;
      current.upcomingRegistrations += upcoming ? 1 : 0;
      current.completedRegistrations += upcoming ? 0 : 1;
      current.lastContact = current.lastContact > registration.createdAt ? current.lastContact : registration.createdAt;
      current.formations = Array.from(new Set([...current.formations, formationLabel]));

      if (nextSessionDate && (!current.nextSessionDate || nextSessionDate < current.nextSessionDate)) {
        current.nextSessionDate = nextSessionDate;
        current.nextSessionLabel = formatDateLabel(nextSessionDate);
      }

    }

    return [...companyMap.values()].sort((left, right) => compareDateDesc(left.lastContact, right.lastContact));
  }, [companies, registrationDetails]);

  const prospects = useMemo(() => companySummaries.filter((company) => ["Prospect", "Qualifié"].includes(company.status)), [companySummaries]);
  const clients = useMemo(() => companySummaries.filter((company) => company.status === "Client"), [companySummaries]);

  const categorySnapshots = useMemo(() => {
    return Array.from(new Set(formations.map((formation) => formation.category)))
      .sort((left, right) => left.localeCompare(right, "fr"))
      .map((category) => {
        const categoryFormations = formations.filter((formation) => formation.category === category);
        const categorySlugs = categoryFormations.map((formation) => formation.slug);
        const categorySessions = upcomingSessions.filter((session) => categorySlugs.includes(session.formationSlug));
        const categoryRegistrations = initialRegistrations.filter((registration) => categorySlugs.includes(registration.formationSlug));

        return {
          category,
          formations: categoryFormations.length,
          sessions: categorySessions.length,
          registrations: categoryRegistrations.length,
        };
      });
  }, [formations, initialRegistrations, upcomingSessions]);

  const totalSeatsLeft = sessions.reduce((total, session) => total + session.seatsLeft, 0);

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

  function selectCompany(id: string) {
    const company = companies.find((item) => item.id === id);
    setEditingCompanyId(id);
    setCompanyDraft(toCompanyDraft(company));
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

  function handleCompanyChange(field: keyof CompanyDraft, value: string) {
    setCompanyDraft((current) => ({ ...current, [field]: value }));
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

  async function handleCompanySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    const payload = {
      name: companyDraft.name.trim(),
      contactName: companyDraft.contactName.trim(),
      email: companyDraft.email.trim(),
      phone: companyDraft.phone.trim(),
      status: companyDraft.status.trim(),
      source: companyDraft.source.trim(),
      priority: companyDraft.priority.trim(),
      notes: companyDraft.notes.trim(),
      nextFollowUpAt: companyDraft.nextFollowUpAt,
      lastContactAt: companyDraft.lastContactAt,
    };

    const isEditing = Boolean(editingCompanyId);
    const response = await fetch(isEditing ? `/api/admin/companies/${editingCompanyId}` : "/api/admin/companies", {
      method: isEditing ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json().catch(() => null)) as { data?: Company; error?: string; message?: string } | null;

    if (!response.ok || !result?.data) {
      setSaving(false);
      setStatusTone("error");
      setStatus(result?.error || "La fiche entreprise n'a pas pu être enregistrée.");
      return;
    }

    const savedCompany = result.data;
    setCompanies((current) => sortCompanies([...current.filter((company) => company.id !== savedCompany.id), savedCompany]));
    setEditingCompanyId(savedCompany.id);
    setCompanyDraft(toCompanyDraft(savedCompany));
    setSaving(false);
    setStatusTone("success");
    setStatus(result.message || "Fiche entreprise enregistrée.");
  }

  return (
    <div className="cms-shell cms-shell-enhanced">
      <aside className="cms-sidebar cms-sidebar-enhanced">
        <div className="cms-brand-card">
          <span className="eyebrow">Pilotage</span>
          <h2>Admin Oxideve</h2>
          <p>Un dashboard de pilotage pour le catalogue, les sessions, le suivi commercial et l'éditorial.</p>
        </div>

        <button className={`cms-nav-item${panel === "dashboard" ? " active" : ""}`} onClick={() => setPanel("dashboard")} type="button">
          <strong>Dashboard</strong>
          <span>Vue globale</span>
        </button>
        <button className={`cms-nav-item${panel === "formations" ? " active" : ""}`} onClick={() => setPanel("formations")} type="button">
          <strong>Catalogue</strong>
          <span>{formations.length} formations</span>
        </button>
        <button className={`cms-nav-item${panel === "sessions" ? " active" : ""}`} onClick={() => setPanel("sessions")} type="button">
          <strong>Sessions</strong>
          <span>{upcomingSessions.length} à venir</span>
        </button>
        <button className={`cms-nav-item${panel === "contacts" ? " active" : ""}`} onClick={() => setPanel("contacts")} type="button">
          <strong>Contacts & CRM</strong>
          <span>{companies.length} entreprises</span>
        </button>
        <button className={`cms-nav-item${panel === "blog" ? " active" : ""}`} onClick={() => setPanel("blog")} type="button">
          <strong>Editorial</strong>
          <span>{articles.length} contenus</span>
        </button>
      </aside>

      <div className="cms-content">
        {panel === "dashboard" ? (
          <div className="cms-content-stack">
            <section className="admin-shell admin-shell-hero">
              <div className="section-heading section-heading-tight">
                <div>
                  <span className="eyebrow">Vue d'ensemble</span>
                  <h2>Tableau de bord opérationnel</h2>
                  <p>Vue synthétique du catalogue, du planning, des inscriptions et du portefeuille entreprises.</p>
                </div>
              </div>

              <div className="admin-metric-grid">
                <article className="admin-metric-card">
                  <span>Catalogue</span>
                  <strong>{formations.length}</strong>
                  <small>formations actives</small>
                </article>
                <article className="admin-metric-card">
                  <span>Sessions</span>
                  <strong>{upcomingSessions.length}</strong>
                  <small>à venir</small>
                </article>
                <article className="admin-metric-card">
                  <span>Pipeline</span>
                  <strong>{prospects.length}</strong>
                  <small>prospects suivis</small>
                </article>
                <article className="admin-metric-card">
                  <span>Clients</span>
                  <strong>{clients.length}</strong>
                  <small>entreprises déjà formées</small>
                </article>
                <article className="admin-metric-card">
                  <span>Places</span>
                  <strong>{totalSeatsLeft}</strong>
                  <small>encore disponibles</small>
                </article>
              </div>
            </section>

            <div className="admin-grid admin-grid-wide">
              <section className="admin-shell">
                <div className="section-heading section-heading-tight">
                  <div>
                    <span className="eyebrow">Planning</span>
                    <h2>Prochaines sessions</h2>
                  </div>
                </div>
                <div className="admin-agenda-list">
                  {upcomingSessions.slice(0, 6).map((session) => {
                    const formation = formations.find((item) => item.slug === session.formationSlug);
                    return (
                      <button className="admin-agenda-item" key={session.id} onClick={() => {
                        setPanel("sessions");
                        selectSession(session.id);
                      }} type="button">
                        <div>
                          <strong>{formation?.title || session.formationSlug}</strong>
                          <span>{formatSessionRange(session.startDate, session.endDate)}</span>
                        </div>
                        <div className="admin-agenda-meta">
                          <span>{session.city}</span>
                          <span>{registrationsBySession[session.id] || 0} inscrits</span>
                          <strong>{getSessionState(session)}</strong>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="admin-shell">
                <div className="section-heading section-heading-tight">
                  <div>
                    <span className="eyebrow">CRM</span>
                    <h2>Prospects et clients</h2>
                    <p>Fiches entreprises persistées, relances à planifier et suivi du portefeuille commercial.</p>
                  </div>
                </div>

                <div className="admin-mini-stats">
                  <div>
                    <strong>{prospects.length}</strong>
                    <span>Prospects</span>
                  </div>
                  <div>
                    <strong>{clients.length}</strong>
                    <span>Clients</span>
                  </div>
                  <div>
                    <strong>{companies.length}</strong>
                    <span>Entreprises</span>
                  </div>
                </div>

                <div className="admin-contact-stack">
                  {companySummaries.slice(0, 5).map((company) => (
                    <button className="admin-contact-card" key={company.key} onClick={() => {
                      setPanel("contacts");
                      selectCompany(company.id);
                    }} type="button">
                      <div>
                        <strong>{company.company}</strong>
                        <span>{company.contactName}</span>
                      </div>
                      <div className="admin-contact-meta">
                        <span className={`admin-status-pill admin-status-${company.status === "Client" ? "client" : "prospect"}`}>{company.status}</span>
                        <span>{company.nextFollowUpLabel}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="admin-grid admin-grid-wide">
              <section className="admin-shell">
                <div className="section-heading section-heading-tight">
                  <div>
                    <span className="eyebrow">Alertes</span>
                    <h2>Points de vigilance</h2>
                  </div>
                </div>
                <div className="admin-alert-grid">
                  <article className="admin-alert-card">
                    <strong>{operationalAlerts.lowSeats.length}</strong>
                    <h3>Sessions presque complètes</h3>
                    <p>Priorité aux relances et à la création de sessions complémentaires.</p>
                  </article>
                  <article className="admin-alert-card">
                    <strong>{operationalAlerts.noRegistrations.length}</strong>
                    <h3>Sessions sans inscrit</h3>
                    <p>À relancer commercialement ou à regrouper avec d'autres dates.</p>
                  </article>
                  <article className="admin-alert-card">
                    <strong>{operationalAlerts.categoriesWithoutUpcoming.length}</strong>
                    <h3>Catégories sans date planifiée</h3>
                    <p>Le catalogue est visible mais sans session future sur ces familles.</p>
                  </article>
                </div>
              </section>

              <section className="admin-shell">
                <div className="section-heading section-heading-tight">
                  <div>
                    <span className="eyebrow">Répartition</span>
                    <h2>Activité par famille</h2>
                  </div>
                </div>
                <div className="admin-category-grid">
                  {categorySnapshots.map((snapshot) => (
                    <article className="admin-category-card" key={snapshot.category}>
                      <strong>{snapshot.category}</strong>
                      <span>{snapshot.formations} formations</span>
                      <span>{snapshot.sessions} sessions à venir</span>
                      <span>{snapshot.registrations} inscriptions</span>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>
        ) : null}

        {panel === "formations" ? (
          <div className="cms-panel-grid cms-panel-grid-wide">
            <section className="admin-shell">
              <div className="section-heading section-heading-tight">
                <div>
                  <span className="eyebrow">Catalogue</span>
                  <h2>Formations</h2>
                  <p>Modifiez le contenu, les objectifs et les informations pratiques de chaque parcours.</p>
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

              <div className="admin-list admin-list-dense">
                {formations.map((formation) => (
                  <button
                    key={formation.slug}
                    type="button"
                    className={`admin-list-item${editingSlug === formation.slug ? " active" : ""}`}
                    onClick={() => selectFormation(formation.slug)}
                  >
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

                <button className="ui-button ui-button-primary" type="submit" disabled={saving}>
                  {saving ? "Enregistrement..." : editingSlug ? "Mettre à jour" : "Créer la formation"}
                </button>
                {status ? <p className={`form-status ${statusTone}`}>{status}</p> : null}
              </form>
            </section>
          </div>
        ) : null}

        {panel === "sessions" ? (
          <div className="cms-panel-grid cms-panel-grid-wide">
            <section className="admin-shell">
              <div className="section-heading section-heading-tight">
                <div>
                  <span className="eyebrow">Planning</span>
                  <h2>Gestion des sessions</h2>
                  <p>Suivez les dates, les lieux, la tension commerciale et les remplissages.</p>
                </div>
                <button className="ui-button ui-button-secondary" onClick={() => {
                  setEditingSessionId("");
                  setSessionDraft(toSessionDraft());
                  setStatus("");
                }} type="button">Nouvelle session</button>
              </div>

              <div className="admin-mini-stats admin-mini-stats-wide">
                <div>
                  <strong>{upcomingSessions.length}</strong>
                  <span>À venir</span>
                </div>
                <div>
                  <strong>{operationalAlerts.lowSeats.length}</strong>
                  <span>Dernières places</span>
                </div>
                <div>
                  <strong>{operationalAlerts.noRegistrations.length}</strong>
                  <span>Sans inscrits</span>
                </div>
              </div>

              <div className="admin-list admin-list-dense">
                {sessions.map((session) => {
                  const formation = formations.find((item) => item.slug === session.formationSlug);
                  return (
                    <button className={`admin-list-item${editingSessionId === session.id ? " active" : ""}`} key={session.id} onClick={() => selectSession(session.id)} type="button">
                      <strong>{formation?.shortTitle || session.formationSlug}</strong>
                      <span>{formatSessionRange(session.startDate, session.endDate)}</span>
                      <span>{session.city} · {session.seatsLeft} places · {registrationsBySession[session.id] || 0} inscrits</span>
                    </button>
                  );
                })}
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

              <div className="admin-session-overview">
                {editingSessionId ? (
                  <>
                    <div>
                      <span>État</span>
                      <strong>{getSessionState(sessions.find((item) => item.id === editingSessionId) || sessions[0])}</strong>
                    </div>
                    <div>
                      <span>Inscrits</span>
                      <strong>{registrationsBySession[editingSessionId] || 0}</strong>
                    </div>
                    <div>
                      <span>Places restantes</span>
                      <strong>{sessionDraft.seatsLeft || "0"}</strong>
                    </div>
                  </>
                ) : (
                  <div>
                    <span>Nouvelle session</span>
                    <strong>Préparez une nouvelle date</strong>
                  </div>
                )}
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

        {panel === "contacts" ? (
          <div className="cms-content-stack">
            <section className="admin-shell">
              <div className="section-heading section-heading-tight">
                <div>
                  <span className="eyebrow">CRM</span>
                  <h2>Entreprises, clients et prospects</h2>
                  <p>Fiches entreprises persistées, pilotage commercial et historique des demandes reliés au catalogue.</p>
                </div>
                <button className="ui-button ui-button-secondary" onClick={() => {
                  setEditingCompanyId("");
                  setCompanyDraft(toCompanyDraft());
                  setStatus("");
                }} type="button">Nouvelle fiche</button>
              </div>

              <div className="admin-metric-grid admin-metric-grid-compact">
                <article className="admin-metric-card">
                  <span>Entreprises</span>
                  <strong>{companies.length}</strong>
                  <small>suivies</small>
                </article>
                <article className="admin-metric-card">
                  <span>Prospects</span>
                  <strong>{prospects.length}</strong>
                  <small>à activer ou qualifier</small>
                </article>
                <article className="admin-metric-card">
                  <span>Clients</span>
                  <strong>{clients.length}</strong>
                  <small>déjà formés</small>
                </article>
                <article className="admin-metric-card">
                  <span>Contacts</span>
                  <strong>{initialRegistrations.length}</strong>
                  <small>entrées CRM</small>
                </article>
              </div>
            </section>

            <div className="cms-panel-grid cms-panel-grid-wide">
              <section className="admin-shell">
                <div className="section-heading section-heading-tight">
                  <div>
                    <span className="eyebrow">Portefeuille</span>
                    <h2>Entreprises suivies</h2>
                  </div>
                </div>
                <div className="admin-list admin-list-dense">
                  {companySummaries.map((company) => (
                    <button className={`admin-list-item${editingCompanyId === company.id ? " active" : ""}`} key={company.key} onClick={() => selectCompany(company.id)} type="button">
                      <strong>{company.company}</strong>
                      <span>{company.contactName} · {company.status} · {company.priority}</span>
                      <span>{company.registrations} demande(s) · {company.formations.join(", ") || "Aucun parcours rattaché"}</span>
                      <span>Prochaine session : {company.nextSessionLabel} · Relance : {company.nextFollowUpLabel}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="admin-shell">
                <div className="section-heading section-heading-tight">
                  <div>
                    <span className="eyebrow">Edition</span>
                    <h2>{editingCompanyId ? "Modifier une fiche entreprise" : "Créer une fiche entreprise"}</h2>
                  </div>
                </div>

                <form className="contact-form" onSubmit={handleCompanySubmit}>
                  <div className="admin-form-section">
                    <h3>Coordonnées</h3>
                    <div className="form-grid">
                      <label>
                        Entreprise
                        <input className="ui-field" onChange={(event) => handleCompanyChange("name", event.target.value)} required value={companyDraft.name} />
                      </label>
                      <label>
                        Contact principal
                        <input className="ui-field" onChange={(event) => handleCompanyChange("contactName", event.target.value)} required value={companyDraft.contactName} />
                      </label>
                      <label>
                        Email
                        <input className="ui-field" onChange={(event) => handleCompanyChange("email", event.target.value)} required type="email" value={companyDraft.email} />
                      </label>
                      <label>
                        Téléphone
                        <input className="ui-field" onChange={(event) => handleCompanyChange("phone", event.target.value)} required value={companyDraft.phone} />
                      </label>
                    </div>
                  </div>

                  <div className="admin-form-section">
                    <h3>Pilotage commercial</h3>
                    <div className="form-grid">
                      <label>
                        Statut
                        <select className="ui-field" onChange={(event) => handleCompanyChange("status", event.target.value)} value={companyDraft.status}>
                          <option value="Prospect">Prospect</option>
                          <option value="Qualifié">Qualifié</option>
                          <option value="Client">Client</option>
                          <option value="Perdu">Perdu</option>
                        </select>
                      </label>
                      <label>
                        Source
                        <select className="ui-field" onChange={(event) => handleCompanyChange("source", event.target.value)} value={companyDraft.source}>
                          <option value="Inbound">Inbound</option>
                          <option value="Relance">Relance</option>
                          <option value="Partenaire">Partenaire</option>
                          <option value="Réseau">Réseau</option>
                          <option value="Manuel">Manuel</option>
                        </select>
                      </label>
                      <label>
                        Priorité
                        <select className="ui-field" onChange={(event) => handleCompanyChange("priority", event.target.value)} value={companyDraft.priority}>
                          <option value="Basse">Basse</option>
                          <option value="Normale">Normale</option>
                          <option value="Haute">Haute</option>
                        </select>
                      </label>
                      <label>
                        Dernier contact
                        <input className="ui-field" onChange={(event) => handleCompanyChange("lastContactAt", event.target.value)} type="date" value={companyDraft.lastContactAt} />
                      </label>
                      <label>
                        Prochaine relance
                        <input className="ui-field" onChange={(event) => handleCompanyChange("nextFollowUpAt", event.target.value)} type="date" value={companyDraft.nextFollowUpAt} />
                      </label>
                    </div>
                    <label>
                      Notes CRM
                      <textarea className="ui-field contact-form-textarea" onChange={(event) => handleCompanyChange("notes", event.target.value)} rows={8} value={companyDraft.notes} />
                    </label>
                  </div>

                  {editingCompanyId ? (
                    <div className="admin-session-overview">
                      {(() => {
                        const summary = companySummaries.find((company) => company.id === editingCompanyId);

                        if (!summary) {
                          return null;
                        }

                        return (
                          <>
                            <div>
                              <span>Demandes</span>
                              <strong>{summary.registrations}</strong>
                            </div>
                            <div>
                              <span>Parcours</span>
                              <strong>{summary.formations.length}</strong>
                            </div>
                            <div>
                              <span>Prochaine session</span>
                              <strong>{summary.nextSessionLabel}</strong>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : null}

                  <button className="ui-button ui-button-primary" disabled={saving} type="submit">
                    {saving ? "Enregistrement..." : editingCompanyId ? "Mettre à jour la fiche" : "Créer la fiche"}
                  </button>
                  {status ? <p className={`form-status ${statusTone}`}>{status}</p> : null}
                </form>
              </section>
            </div>

            <section className="admin-shell">
              <div className="section-heading section-heading-tight">
                <div>
                  <span className="eyebrow">Entrées</span>
                  <h2>Dernières demandes</h2>
                </div>
              </div>
              <div className="data-table admin-table-shell admin-table-shell-solid">
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
                      {registrationDetails.map((detail) => (
                        <tr key={detail.registration.id}>
                          <td>{formatRegistrationDate(detail.registration.createdAt)}</td>
                          <td>{detail.registration.company}</td>
                          <td>
                            {detail.registration.contactName}
                            <br />
                            {detail.registration.email}
                          </td>
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

        {panel === "blog" ? (
          <div className="cms-panel-grid cms-panel-grid-wide">
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
              <div className="admin-list admin-list-dense">
                {articles.map((article) => (
                  <button className={`admin-list-item${editingArticleSlug === article.slug ? " active" : ""}`} key={article.slug} onClick={() => selectArticle(article.slug)} type="button">
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
      </div>
    </div>
  );
}