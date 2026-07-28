import type { Metadata } from "next";
import { Container, Section, Title } from "@/components/ui";
import { TrainingPathQuiz } from "@/components/TrainingPathQuiz";
import { getFormations } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Diagnostic parcours",
  description: "Répondez à quelques questions pour identifier le parcours Oxideve le plus pertinent pour votre activité.",
};

export default async function DiagnosticParcoursPage() {
  const formations = await getFormations();

  return (
    <Section className="quiz-page-shell">
      <Container>
        <Title
          as="h1"
          eyebrow="Diagnostic"
          title="Quel parcours de formation est le plus utile pour votre activité ?"
          description="Ce quiz oriente un professionnel, quel que soit son métier, vers les familles de formation les plus cohérentes avec son besoin et ses objectifs."
        />
        <TrainingPathQuiz formations={formations} />
      </Container>
    </Section>
  );
}