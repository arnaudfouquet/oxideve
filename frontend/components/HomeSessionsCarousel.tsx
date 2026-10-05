"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Formation, Session } from "../../shared/types";

type Props = {
  formations: Formation[];
  sessions: Session[];
};

type EnrichedSession = Session & { category: string; formationTitle: string };

function formatDateRange(startDate: string, endDate: string) {
  const fmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const start = fmt.format(new Date(`${startDate}T00:00:00`));
  const end = fmt.format(new Date(`${endDate}T00:00:00`));
  return start === end ? start : `${start} au ${end}`;
}

export function HomeSessionsCarousel({ formations, sessions }: Props) {
  const upcoming = useMemo<EnrichedSession[]>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return sessions
      .map((session) => {
        const formation = formations.find((item) => item.slug === session.formationSlug);
        return formation ? { ...session, category: formation.category, formationTitle: formation.title } : null;
      })
      .filter((item): item is EnrichedSession => Boolean(item))
      .filter((session) => session.endDate >= today)
      .sort((left, right) => left.startDate.localeCompare(right.startDate));
  }, [formations, sessions]);

  if (!upcoming.length) {
    return null;
  }

  // Duplique la liste pour un défilement en boucle continue ; si peu de sessions,
  // on répète assez de fois pour que la piste soit plus large que le viewport.
  const repeats = Math.max(2, Math.ceil(8 / upcoming.length));
  const track = Array.from({ length: repeats }, () => upcoming).flat();

  return (
    <section className="home-sessions">
      <div className="home-sessions-heading">
        <h2>Nos prochaines sessions</h2>
        <p>Consultez les prochaines dates et inscrivez-vous à la formation qui correspond à vos besoins.</p>
      </div>

      <div className="home-sessions-viewport">
        <div className="home-sessions-track" style={{ "--session-count": track.length } as React.CSSProperties}>
          {track.map((session, index) => (
            <Link
              className="home-session-card"
              href={`/inscriptions?formationSlug=${session.formationSlug}&sessionId=${session.id}`}
              key={`${session.id}-${index}`}
            >
              <span className="home-session-category">
                <span className="home-session-dot" aria-hidden="true" />
                {session.category}
              </span>
              <strong className="home-session-title">{session.formationTitle}</strong>
              <span className="home-session-dates">{formatDateRange(session.startDate, session.endDate)}</span>
              <span className="home-session-meta">
                {session.city} · {session.mode}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
