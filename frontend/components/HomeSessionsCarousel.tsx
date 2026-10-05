"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Formation, Session } from "../../shared/types";

type Props = {
  formations: Formation[];
  sessions: Session[];
};

type EnrichedSession = Session & { category: string; formationTitle: string; icon?: string };

// Icône par catégorie (reprend les visuels fournis dans Ressources/HOME).
const CATEGORY_ICONS: Record<string, string> = {
  Photovoltaïque: "/assets/home/icone-photovoltaique.png",
  "Pompes à chaleur": "/assets/home/icone-pompe-chaleur.png",
  "Pompe à chaleur": "/assets/home/icone-pompe-chaleur.png",
  "Bornes de recharge": "/assets/home/icone-irve.png",
  IRVE: "/assets/home/icone-irve.png",
  "Sécurité au travail": "/assets/home/icone-securite.png",
  Bureautique: "/assets/home/icone-bureautique.png",
};

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
      .map((session): EnrichedSession | null => {
        const formation = formations.find((item) => item.slug === session.formationSlug);
        return formation
          ? { ...session, category: formation.category, formationTitle: formation.title, icon: CATEGORY_ICONS[formation.category] }
          : null;
      })
      .filter((item): item is EnrichedSession => item !== null)
      .filter((session) => session.endDate >= today)
      .sort((left, right) => left.startDate.localeCompare(right.startDate));
  }, [formations, sessions]);

  if (!upcoming.length) {
    return null;
  }

  // Répartit les sessions sur 3 rangées ; la piste est dupliquée pour un défilement en boucle.
  const rows: EnrichedSession[][] = [[], [], []];
  upcoming.forEach((session, index) => {
    rows[index % 3].push(session);
  });
  const nonEmptyRows = rows.filter((row) => row.length);

  function renderCard(session: EnrichedSession, key: string) {
    return (
      <Link
        className="home-session-card"
        href={`/inscriptions?formationSlug=${session.formationSlug}&sessionId=${session.id}`}
        key={key}
      >
        {session.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="home-session-icon" alt="" src={session.icon} />
        ) : (
          <span className="home-session-icon home-session-icon-placeholder" aria-hidden="true" />
        )}
        <span className="home-session-body">
          <span className="home-session-category">
            <span className="home-session-dot" aria-hidden="true" />
            {session.category}
          </span>
          <strong className="home-session-title">{session.formationTitle}</strong>
          <span className="home-session-dates">{formatDateRange(session.startDate, session.endDate)}</span>
          <span className="home-session-meta">
            {session.city} · {session.mode}
          </span>
        </span>
      </Link>
    );
  }

  return (
    <section className="home-sessions">
      <div className="home-sessions-panel">
        <div className="home-sessions-heading">
          <h2>Nos prochaines sessions</h2>
          <p>Consultez les prochaines dates et inscrivez-vous à la formation qui correspond à vos besoins.</p>
        </div>

        <div className="home-sessions-rows">
          {nonEmptyRows.map((row, rowIndex) => {
            // Chaque rangée défile ; direction alternée pour un rendu vivant.
            const track = [...row, ...row];
            return (
              <div className="home-sessions-row" key={rowIndex}>
                <div
                  className={`home-sessions-track${rowIndex % 2 === 1 ? " is-reverse" : ""}`}
                  style={{ "--row-count": row.length } as React.CSSProperties}
                >
                  {track.map((session, index) => renderCard(session, `${rowIndex}-${session.id}-${index}`))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
