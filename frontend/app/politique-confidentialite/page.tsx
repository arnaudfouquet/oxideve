import { Container, Section, Text, Title } from "@/components/ui";

export default function PolitiqueConfidentialitePage() {
  return (
    <Section>
      <Container>
        <Title as="h1" eyebrow="Confidentialite" title="Politique de confidentialite" />
        <div className="legal-stack">
          <Text>Les informations transmises via les formulaires servent uniquement a traiter les demandes d'inscription, de contact et de suivi associees aux parcours Oxideve.</Text>
          <Text>Les donnees utiles a la relation commerciale et administrative sont conservees selon les obligations applicables et ne sont pas exposees dans la navigation publique.</Text>
        </div>
      </Container>
    </Section>
  );
}