import Link from "next/link";
import type { Formation } from "../../shared/types";
import { Badge, ButtonLink, Card, Text } from "@/components/ui";

type Props = {
  formation: Formation;
  tone?: "default" | "highlight" | "dark";
};

export function FormationCard({ formation, tone = "default" }: Props) {
  return (
    <Card className="formation-card" tone={tone}>
      <div className="formation-card-head">
        <Badge tone="soft">{formation.category}</Badge>
        <Badge>{formation.duration}</Badge>
      </div>
      <h3>{formation.title}</h3>
      <Text tone={tone === "dark" ? "inverse" : "muted"}>{formation.summary}</Text>
      <div className="formation-card-tags">
        {formation.objectives.slice(0, 3).map((objective) => (
          <span key={objective}>{objective}</span>
        ))}
      </div>
      <div className="formation-card-foot">
        <strong>{formation.price}</strong>
        <ButtonLink href={`/formations/${formation.slug}`} variant={tone === "dark" ? "secondary" : "primary"}>
          Voir la formation
        </ButtonLink>
      </div>
    </Card>
  );
}