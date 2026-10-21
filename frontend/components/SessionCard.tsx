import type { Formation, Session } from "../../shared/types";
import { formatDateRange } from "@/lib/dates";
import { Button, ButtonLink, Card } from "@/components/ui";

type Props = {
  session: Session;
  formation?: Formation;
  compact?: boolean;
  isSelected?: boolean;
  onSelect?: (sessionId: string) => void;
  /** Sur la page d'une formation, répéter son titre dans chaque carte est inutile. */
  hideFormationTitle?: boolean;
};

export function SessionCard({
  session,
  formation,
  compact = false,
  isSelected = false,
  onSelect,
  hideFormationTitle = false,
}: Props) {
  const classes = ["session-card"];
  if (compact) classes.push("session-card-compact");
  if (isSelected) classes.push("session-card-selected");

  return (
    <Card className={classes.join(" ")}>
      {/* La date est l'information qu'on cherche en premier : elle fait le
          titre de la carte, la ville et la modalité la complètent. */}
      <strong className="session-card-date">{formatDateRange(session.startDate, session.endDate)}</strong>
      {hideFormationTitle ? null : <h3>{formation?.title || session.formationSlug}</h3>}
      <div className="session-card-meta">
        <span className="session-card-city">{session.city}</span>
        <span className="session-card-mode">&middot; {session.mode}</span>
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
        <ButtonLink href={`/formations/${session.formationSlug}#inscription`} variant="secondary">
          Choisir cette session
        </ButtonLink>
      )}
    </Card>
  );
}
