import type { Metadata } from "next";
import { Container, Section, Text, Title } from "@/components/ui";

export const metadata: Metadata = {
  title: "Campus",
  description: "Presentation du campus Oxideve, des formats de sessions et de l'organisation pedagogique.",
};

export default function CampusPage() {
  return (
    <>
      <Section>
        <Container>
          <Title as="h1" eyebrow="Campus" title="Un campus pense pour la progression d'equipe, pas pour l'effet vitrine" description="Presentiel, tutoré, intra-entreprise et sessions dediees : le campus Oxideve est decrit comme un outil d'organisation pedagogique." />
          <div className="campus-grid">
            <div className="value-card">
              <h3>Base Rouen</h3>
              <Text tone="muted">Espace de formation pour les sessions inter-entreprises, demonstrations et sequences de cadrage technique.</Text>
            </div>
            <div className="value-card">
              <h3>Formats hybrides</h3>
              <Text tone="muted">Certaines formations peuvent se preparer en amont avec du tutorat et un temps recentre sur les points a forte valeur terrain.</Text>
            </div>
            <div className="value-card">
              <h3>Intra-entreprise</h3>
              <Text tone="muted">Organisation d'un parcours adapte a vos equipements, a vos fiches d'intervention et a votre niveau de maturite technique.</Text>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}