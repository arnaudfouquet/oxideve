import type { Formation, Session } from "../../shared/types";
import { formatDateRange } from "@/lib/dates";
import { Badge, Button, ButtonLink, Card, Text } from "@/components/ui";

type Props = {
  session: Session;
  formation?: Formation;
  compact?: boolean;
  isSelected?: boolean;
  onSelect?: (sessionId: string) => void;
};

export function SessionCard({ session, formation, compact = false, isSelected = false, onSelect }: Props) {
  const classes = ["session-card"];
  if (compact) classes.push("session-card-compact");
  if (isSelected) classes.push("session-card-selected");

  return (
    <Card className={classes.join(" ")}>
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
      {onSelect ? (
        <Button
          className="session-card-select"
          onClick={() => onSelect(session.id)}
          variant={isSelected ? "primary" : "secondary"}
        >
          {isSelected ? "Session sélectionnée" : "Choisir cette session"}
        </Button>
      ) : (
        <ButtonLink href={`/inscriptions?formationSlug=${session.formationSlug}&sessionId=${session.id}`} variant="secondary">
          Choisir cette session
        </ButtonLink>
      )}
    </Card>
  );
}
