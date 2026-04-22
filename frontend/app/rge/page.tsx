import type { Metadata } from "next";
import { FormationCard } from "@/components/FormationCard";
import { Container, Section, Text, Title } from "@/components/ui";
import { getFormations } from "@/lib/content";

export const metadata: Metadata = {
  title: "RGE",
  description: "Vue d'ensemble Oxideve sur les parcours utilises pour structurer les pratiques liees aux qualifications RGE.",
};

export default async function RgePage() {
  const formations = await getFormations();
  const rgeFormations = formations.filter((formation) => ["Photovoltaïque", "Pompes à chaleur"].includes(formation.category));

  return (
    <>
      <Section surface="contrast">
        <Container>
          <Title as="h1" eyebrow="RGE" title="Rendre lisibles les attendus qualification, chantier et preuve d'execution" description="Cette page publique sert de sas entre les obligations terrain et les parcours qui aident les equipes a les tenir dans la duree." />
        </Container>
      </Section>
      <Section>
        <Container>
          <div className="value-grid">
            <div className="value-card">
              <h3>Avant chantier</h3>
              <Text tone="muted">Preparation des pre requis, lecture des normes et verification des conditions de pose.</Text>
            </div>
            <div className="value-card">
              <h3>Pendant execution</h3>
              <Text tone="muted">Autocontrôle, logique de mise en oeuvre et criteres de conformite a verifier par l'equipe.</Text>
            </div>
            <div className="value-card">
              <h3>Apres intervention</h3>
              <Text tone="muted">Dossier technique, preuves, remise client et traçabilite pour la suite du chantier.</Text>
            </div>
          </div>
          <div className="training-showcase-grid">
            {rgeFormations.map((formation) => (
              <FormationCard formation={formation} key={formation.slug} />
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}