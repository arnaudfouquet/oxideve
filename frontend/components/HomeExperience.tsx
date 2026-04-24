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
    title: "Notre vision",
    note:
      "Nos formations courtes sont conçues pour transmettre des connaissances théoriques et permettre aux participants de manipuler les équipements sur des plateaux techniques.",
    description:
      "Former et préparer les professionnels du BTP aux réglementations actuelles, à subsister face à la concurrence accrue grâce à nos formations en bâtiment.",
    image: encodeURI("/assets/accueil/Notre visio.webp"),
  },
  {
    id: "2",
    label: "Notre objectif",
    title: "Texte 2",
    note:
      "Nos parcours sont pensés pour faire gagner du temps à vos équipes avec des formats denses, pratiques et directement utiles sur le terrain.",
    description:
      "Faux texte de présentation pour illustrer la deuxième carte. L'idée est de montrer un contenu éditorial plus institutionnel, calibré pour l'activité et la montée en compétence.",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "3",
    label: "Notre organisme",
    title: "Texte 3",
    note:
      "Oxideve relie qualification, pratique chantier et lecture réglementaire dans une même expérience de formation.",
    description:
      "Faux texte de présentation pour la troisième carte. Il sert à occuper la zone éditoriale prévue et à respecter le gabarit du design cible.",
    image: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
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

export function HomeIdentitySection() {
  const [activeStep, setActiveStep] = useState(identitySteps[0].id);
  const activeIdentityStep = identitySteps.find((step) => step.id === activeStep) || identitySteps[0];

  return (
    <section className="home-identity-shell">
      <div className="home-identity-head">
        <h2>OXIDEVE C&apos;EST QUOI ?</h2>
        <div className="home-identity-note">
          <p>{activeIdentityStep.note}</p>
          <span className="home-info-badge"><img alt="" src="/assets/info-icon.svg" /></span>
        </div>
      </div>

      <div className="home-identity-tabs" role="tablist" aria-label="Présentation Oxideve">
        {identitySteps.map((step) => (
          <button
            aria-selected={activeStep === step.id}
            className={`home-identity-tab${activeStep === step.id ? " active" : ""}`}
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            role="tab"
            type="button"
          >
            {step.id}
          </button>
        ))}
      </div>

      <div className="home-identity-panel">
        <div className="home-identity-copy">
          <span className="home-identity-index">{activeIdentityStep.id}</span>
          <h3>{activeIdentityStep.title}</h3>
          <p>{activeIdentityStep.description}</p>
        </div>
        <div className="home-identity-visual">
          <img alt={activeIdentityStep.title} src={activeIdentityStep.image} />
        </div>
      </div>
    </section>
  );
}

export function HomeCalendarSection({ formations, sessions }: Props) {
  const [activeMonth, setActiveMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

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

  const visibleSessions = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return enrichedSessions
      .filter((session) => session.endDate >= today)
      .sort((left, right) => left.startDate.localeCompare(right.startDate));
  }, [enrichedSessions]);

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

  function moveMonth(direction: -1 | 1) {
    if (!months.length || !activeMonth) {
      return;
    }

    const index = months.indexOf(activeMonth);
    const nextIndex = Math.min(Math.max(index + direction, 0), months.length - 1);
    setActiveMonth(months[nextIndex]);
  }

  return (
    <section className="home-calendar-showcase">
      <div className="home-calendar-frame">
        <div className="home-calendar-heading">
          <h2>
            <span>Nos prochaines sessions</span>
            <strong>de formation BTP</strong>
          </h2>
          <p>
            Inscrivez-vous à nos formations courtes et techniques
            <br />
            pour les professionnels du bâtiment
          </p>
        </div>

        <div className="home-calendar-layout">
          <div className="home-calendar-card">
            <div className="landing-calendar-toolbar">
              <button disabled={!months.length || activeMonth === months[0]} onClick={() => moveMonth(-1)} type="button">◀</button>
              <strong>{activeMonth ? monthLabel(activeMonth) : "Aucune session"}</strong>
              <button disabled={!months.length || activeMonth === months[months.length - 1]} onClick={() => moveMonth(1)} type="button">▶</button>
            </div>

            <div className="landing-calendar-days">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => <span key={day}>{day}</span>)}
            </div>

            <div className="landing-calendar-grid-interactive home-calendar-grid">
              {calendarCells.map((cell, index) => (
                <button
                  className={`calendar-day home-calendar-day${cell.muted ? " is-muted" : ""}${selectedDate === cell.date ? " is-selected" : ""}${cell.sessions.length ? ` tone-${cell.tone}` : ""}`}
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

          <div className="home-calendar-side">
            <div className="home-calendar-session-box">
              {selectedDaySessions[0] ? (
                <>
                  <h3>{selectedDaySessions[0].formationTitle}</h3>
                  <p>{formatDateRange(selectedDaySessions[0].startDate, selectedDaySessions[0].endDate)}</p>
                  <ul>
                    <li>{selectedDaySessions[0].category}</li>
                    <li>{selectedDaySessions[0].city} · {selectedDaySessions[0].mode}</li>
                    <li>{selectedDaySessions[0].seatsLeft} places disponibles</li>
                  </ul>
                  <Link className="ui-button ui-button-card" href={`/inscriptions?formationSlug=${selectedDaySessions[0].formationSlug}&sessionId=${selectedDaySessions[0].id}`}>
                    Découvrir
                  </Link>
                </>
              ) : (
                <>
                  <h3>Aucune session</h3>
                  <p>Changez de mois ou utilisez un autre filtre pour afficher une session disponible.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}