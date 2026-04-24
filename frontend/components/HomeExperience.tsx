"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Formation, Session } from "../../shared/types";

type Props = {
  formations: Formation[];
  sessions: Session[];
};

const identitySteps = [
  {
    id: "1",
    label: "Notre vision",
    title: "Former le terrain sans perdre l'exigence réglementaire",
    description:
      "Oxideve prépare les artisans, techniciens et encadrants BTP aux exigences marché avec des parcours qui collent aux réalités chantier.",
    points: ["Lecture claire des besoins terrain", "Parcours courts mais concrets", "Montée en compétence orientée résultat"],
  },
  {
    id: "2",
    label: "Notre objectif",
    title: "Faire monter vite vos équipes en autonomie",
    description:
      "Les formations sont pensées pour transmettre des repères techniques immédiatement utiles, avec manipulation, diagnostic et mise en service.",
    points: ["Formats adaptés aux plannings d'entreprise", "Exercices appliqués et plateaux techniques", "Approche utile à la vente comme à l'exécution"],
  },
  {
    id: "3",
    label: "Notre organisme",
    title: "Un centre Qualiopi construit pour plusieurs métiers du bâtiment",
    description:
      "Photovoltaïque, PAC, IRVE, sécurité et bureautique : l'offre reste lisible, financable et pilotable avec un même niveau d'exigence.",
    points: ["Catalogue multi-familles", "Sessions visibles et exploitables", "Accompagnement avant et après inscription"],
  },
];

const reviewCards = [
  {
    name: "Mickaël R.",
    role: "Gérant · Rouen",
    quote: "La session QualiPAC a été utile dès la semaine suivante sur nos mises en service. Le formateur parlait vraiment chantier.",
    highlight: "QualiPAC",
    seed: "MickaelR",
  },
  {
    name: "Sarah L.",
    role: "Chargée d'affaires solaire",
    quote: "Le parcours QualiPV et les modules administratifs nous ont aidés à structurer l'avant-vente et la relation client.",
    highlight: "QualiPV",
    seed: "SarahL",
  },
  {
    name: "Nicolas D.",
    role: "Responsable technique CVC",
    quote: "Le format court sur la climatisation était très bien calibré. Les réglages et points de vigilance étaient directement exploitables.",
    highlight: "Climatisation",
    seed: "NicolasD",
  },
  {
    name: "Inès B.",
    role: "Référente formation",
    quote: "On a pu projeter un plan de montée en compétence complet pour nos équipes avec une vision claire des sessions à venir.",
    highlight: "Plan de formation",
    seed: "InesB",
  },
];

const categoryColors: Record<string, string> = {
  Photovoltaïque: "solar",
  "Pompes à chaleur": "heat",
  "Bornes de recharge": "charge",
  "Sécurité au travail": "safety",
  Bureautique: "office",
  "Traitement d'air": "air",
};

function monthKey(value: string) {
  return value.slice(0, 7);
}

function monthLabel(key: string) {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(`${key}-01T00:00:00`));
}

function formatDateRange(startDate: string, endDate: string) {
  return `${new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${startDate}T00:00:00`))} au ${new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${endDate}T00:00:00`))}`;
}

function buildCalendarCells(month: string, sessions: Array<Session & { category: string; formationTitle: string }>) {
  const [year, monthIndex] = month.split("-").map(Number);
  const firstDay = new Date(year, monthIndex - 1, 1);
  const lastDay = new Date(year, monthIndex, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const sessionMap = new Map<string, Array<Session & { category: string; formationTitle: string }>>();

  for (const session of sessions) {
    const start = new Date(`${session.startDate}T00:00:00`);
    const end = new Date(`${session.endDate}T00:00:00`);
    const cursor = new Date(start);

    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      const items = sessionMap.get(key) || [];
      items.push(session);
      sessionMap.set(key, items);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const cells: Array<{ date?: string; label: string; muted?: boolean; sessions: Array<Session & { category: string; formationTitle: string }>; tone?: string }> = [];
  const previousMonthLastDay = new Date(year, monthIndex - 1, 0).getDate();

  for (let index = startOffset; index > 0; index -= 1) {
    cells.push({ label: String(previousMonthLastDay - index + 1), muted: true, sessions: [] });
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const date = `${month}-${String(day).padStart(2, "0")}`;
    const daySessions = sessionMap.get(date) || [];
    cells.push({
      date,
      label: String(day),
      sessions: daySessions,
      tone: daySessions[0] ? categoryColors[daySessions[0].category] || "default" : undefined,
    });
  }

  while (cells.length % 7 !== 0 || cells.length < 35) {
    cells.push({ label: String(cells.length - lastDay.getDate() - startOffset + 1), muted: true, sessions: [] });
  }

  return cells;
}

export function HomeExperience({ formations, sessions }: Props) {
  const [activeStep, setActiveStep] = useState(identitySteps[0].id);
  const [categoryFilter, setCategoryFilter] = useState("Toutes");
  const [activeMonth, setActiveMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [reviewIndex, setReviewIndex] = useState(0);

  const enrichedSessions = useMemo(() => {
    return sessions
      .map((session) => {
        const formation = formations.find((item) => item.slug === session.formationSlug);
        return formation
          ? {
              ...session,
              category: formation.category,
              formationTitle: formation.title,
            }
          : null;
      })
      .filter(Boolean) as Array<Session & { category: string; formationTitle: string }>;
  }, [formations, sessions]);

  const categories = useMemo(() => ["Toutes", ...Array.from(new Set(enrichedSessions.map((session) => session.category))).sort((a, b) => a.localeCompare(b, "fr"))], [enrichedSessions]);

  const visibleSessions = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return enrichedSessions
      .filter((session) => session.endDate >= today)
      .filter((session) => categoryFilter === "Toutes" || session.category === categoryFilter)
      .sort((left, right) => left.startDate.localeCompare(right.startDate));
  }, [categoryFilter, enrichedSessions]);

  const months = useMemo(() => Array.from(new Set(visibleSessions.map((session) => monthKey(session.startDate)))), [visibleSessions]);

  useEffect(() => {
    if (!months.length) {
      setActiveMonth("");
      return;
    }

    if (!activeMonth || !months.includes(activeMonth)) {
      setActiveMonth(months[0]);
    }
  }, [activeMonth, months]);

  const monthSessions = useMemo(() => visibleSessions.filter((session) => monthKey(session.startDate) === activeMonth), [activeMonth, visibleSessions]);

  const calendarCells = useMemo(() => (activeMonth ? buildCalendarCells(activeMonth, monthSessions) : []), [activeMonth, monthSessions]);

  useEffect(() => {
    const firstDate = calendarCells.find((cell) => cell.date && cell.sessions.length)?.date || "";
    if (!selectedDate || !calendarCells.some((cell) => cell.date === selectedDate)) {
      setSelectedDate(firstDate);
    }
  }, [calendarCells, selectedDate]);

  const selectedDaySessions = useMemo(() => {
    const day = calendarCells.find((cell) => cell.date === selectedDate);
    if (day?.sessions.length) {
      return day.sessions;
    }

    return monthSessions.slice(0, 4);
  }, [calendarCells, monthSessions, selectedDate]);

  const activeIdentityStep = identitySteps.find((step) => step.id === activeStep) || identitySteps[0];
  const visibleReviews = [reviewCards[reviewIndex], reviewCards[(reviewIndex + 1) % reviewCards.length]];

  function moveMonth(direction: -1 | 1) {
    if (!months.length || !activeMonth) {
      return;
    }

    const index = months.indexOf(activeMonth);
    const nextIndex = Math.min(Math.max(index + direction, 0), months.length - 1);
    setActiveMonth(months[nextIndex]);
  }

  function moveReview(direction: -1 | 1) {
    setReviewIndex((current) => (current + direction + reviewCards.length) % reviewCards.length);
  }

  return (
    <>
      <div className="identity-panel identity-panel-interactive">
        <div className="identity-main-copy">
          <h2>OXIDEVE C&apos;EST QUOI ?</h2>
          <div className="identity-tab-strip" role="tablist" aria-label="Présentation d'Oxideve">
            {identitySteps.map((step) => (
              <button
                aria-selected={activeStep === step.id}
                className={`identity-tab-button${activeStep === step.id ? " active" : ""}`}
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                role="tab"
                type="button"
              >
                <span>{step.id}</span>
                <strong>{step.label}</strong>
              </button>
            ))}
          </div>

          <div className="identity-copy-card">
            <span className="identity-index">{activeIdentityStep.id}</span>
            <h3>{activeIdentityStep.title}</h3>
            <p>{activeIdentityStep.description}</p>
            <ul className="identity-point-list">
              {activeIdentityStep.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="identity-note identity-note-elevated">
          <strong>Pourquoi les entreprises reviennent</strong>
          <p>Une même lecture catalogue, sessions et inscription, avec des parcours directement utilisables sur le terrain.</p>
          <div className="identity-stat-grid">
            <article><span>Formats</span><strong>courts</strong></article>
            <article><span>Approche</span><strong>terrain</strong></article>
            <article><span>Parcours</span><strong>finançables</strong></article>
          </div>
          <div className="identity-quote-card">
            <p>"Un centre de formation qui parle autant exécution chantier que qualification et mise en service."</p>
          </div>
        </div>
      </div>

      <div className="landing-session-card landing-session-card-interactive">
        <div className="landing-calendar-shell landing-calendar-shell-advanced">
          <div className="landing-calendar-toolbar">
            <div>
              <span className="section-kicker">Calendrier réel</span>
              <strong>{activeMonth ? monthLabel(activeMonth) : "Aucune session"}</strong>
            </div>
            <div className="landing-calendar-nav">
              <button disabled={!months.length || activeMonth === months[0]} onClick={() => moveMonth(-1)} type="button">◀</button>
              <button disabled={!months.length || activeMonth === months[months.length - 1]} onClick={() => moveMonth(1)} type="button">▶</button>
            </div>
          </div>

          <div className="landing-filter-pills">
            {categories.map((category) => (
              <button className={`landing-filter-pill${categoryFilter === category ? " active" : ""}`} key={category} onClick={() => setCategoryFilter(category)} type="button">
                {category}
              </button>
            ))}
          </div>

          <div className="landing-month-pills">
            {months.map((month) => (
              <button className={`landing-month-pill${activeMonth === month ? " active" : ""}`} key={month} onClick={() => setActiveMonth(month)} type="button">
                {monthLabel(month)}
              </button>
            ))}
          </div>

          <div className="landing-calendar-days">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="landing-calendar-grid landing-calendar-grid-interactive">
            {calendarCells.map((cell, index) => (
              <button
                className={`calendar-day${cell.muted ? " is-muted" : ""}${selectedDate === cell.date ? " is-selected" : ""}${cell.sessions.length ? ` tone-${cell.tone}` : ""}`}
                disabled={!cell.date}
                key={`${cell.label}-${index}`}
                onClick={() => cell.date && setSelectedDate(cell.date)}
                type="button"
              >
                <span>{cell.label}</span>
                {cell.sessions.length ? <small>{cell.sessions.length}</small> : null}
              </button>
            ))}
          </div>
        </div>

        <div className="landing-featured-session landing-featured-session-interactive">
          <div className="featured-session-main featured-session-main-green">
            <h3>Sessions visibles et filtrables</h3>
            <p>Changez de mois, filtrez par famille et cliquez sur un jour pour voir les ouvertures réellement disponibles.</p>
            <div className="calendar-legend-grid">
              {Object.entries(categoryColors).map(([category, tone]) => (
                <span className={`calendar-legend-item tone-${tone}`} key={category}>{category}</span>
              ))}
            </div>
          </div>

          <div className="landing-session-list landing-session-list-advanced">
            {selectedDaySessions.map((session) => (
              <article className="landing-session-item landing-session-item-advanced" key={session.id}>
                <div className="landing-session-item-head">
                  <strong>{session.formationTitle}</strong>
                  <span className={`calendar-legend-item tone-${categoryColors[session.category] || "default"}`}>{session.category}</span>
                </div>
                <p>{formatDateRange(session.startDate, session.endDate)}</p>
                <div className="landing-session-item-meta">
                  <span>{session.city} · {session.mode}</span>
                  <span>{session.seatsLeft} places</span>
                </div>
                <Link className="ui-button ui-button-secondary" href={`/inscriptions?formationSlug=${session.formationSlug}&sessionId=${session.id}`}>
                  Choisir cette session
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="testimonials-showcase">
        <div className="section-heading section-heading-tight">
          <div>
            <span className="section-kicker">Avis</span>
            <h2>Ils nous font confiance</h2>
          </div>
          <div className="testimonial-nav">
            <button onClick={() => moveReview(-1)} type="button">◀</button>
            <button onClick={() => moveReview(1)} type="button">▶</button>
          </div>
        </div>
        <div className="testimonial-grid">
          {visibleReviews.map((review) => (
            <article className="testimonial-card" key={review.name}>
              <div className="testimonial-head">
                <img alt={review.name} src={`https://api.dicebear.com/9.x/personas/svg?seed=${review.seed}`} />
                <div>
                  <strong>{review.name}</strong>
                  <span>{review.role}</span>
                </div>
              </div>
              <p>{review.quote}</p>
              <span className="testimonial-highlight">{review.highlight}</span>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}