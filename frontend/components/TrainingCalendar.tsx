import Link from "next/link";
import type { Formation, Session } from "../../shared/types";
import { formatDateRange, formatShortDate } from "@/lib/content";

type Props = {
  formations: Formation[];
  sessions: Session[];
  compact?: boolean;
};

export function TrainingCalendar({ formations, sessions, compact = false }: Props) {
  return (
    <div className={compact ? "schedule-list schedule-list-compact" : "schedule-list"}>
      {sessions.map((session) => {
        const formation = formations.find((item) => item.slug === session.formationSlug);

        return (
          <article className="schedule-item" key={session.id}>
            <div className="schedule-date">
              <strong>{formatShortDate(session.startDate)}</strong>
              <span>{new Date(session.startDate).getFullYear()}</span>
            </div>
            <div className="schedule-body">
              <div className="meta-row">
                <span className="meta-pill">{session.mode}</span>
                <span className="meta-pill">{session.city}</span>
                <span className="meta-pill">{session.seatsLeft} places</span>
              </div>
              <h3>{formation?.title || session.formationSlug}</h3>
              <p>{formatDateRange(session.startDate, session.endDate)}</p>
            </div>
            <div className="schedule-action">
              <Link href={`/formations/${session.formationSlug}`} className="button button-secondary">
                Voir la formation
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}