import Link from "next/link";
import type { Formation, Session } from "../../shared/types";
import { formatDateRange } from "@/lib/content";
import { Badge, ButtonLink, Card, Text } from "@/components/ui";

type Props = {
  session: Session;
  formation?: Formation;
  compact?: boolean;
};

export function SessionCard({ session, formation, compact = false }: Props) {
  return (
    <Card className={`session-card${compact ? " session-card-compact" : ""}`}>
      <div className="session-card-head">
        <Badge>{session.city}</Badge>
        <Badge tone="accent">{formatDateRange(session.startDate, session.endDate)}</Badge>
      </div>
      <h3>{formation?.title || session.formationSlug}</h3>
      <Text tone="muted">Session organisée à {session.city}</Text>
      <div className="session-card-meta">
        <span>{session.seatsLeft} places disponibles</span>
        <span>{session.mode}</span>
      </div>
      <ButtonLink href={`/inscriptions?formationSlug=${session.formationSlug}&sessionId=${session.id}`} variant="secondary">
        Choisir cette session
      </ButtonLink>
    </Card>
  );
}