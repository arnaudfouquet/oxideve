import { Container, Section, Text, Title } from "@/components/ui";

export default function MentionsLegalesPage() {
  return (
    <Section>
      <Container>
        <Title as="h1" eyebrow="Mentions legales" title="Informations legales Oxideve" />
        <div className="legal-stack">
          <Text>Oxideve est un organisme de formation professionnelle proposant des parcours en securite, bureautique, management, habilitations et energies renouvelables.</Text>
          <Text>Pour toute demande relative au site, aux contenus ou a l'exercice de vos droits, utilisez l'adresse de contact diffusee dans le footer.</Text>
        </div>
      </Container>
    </Section>
  );
}