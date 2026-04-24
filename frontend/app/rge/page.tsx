import type { Metadata } from "next";
import { Container, Section } from "@/components/ui";
import { RgeExperience } from "@/components/RgeExperience";

export const metadata: Metadata = {
  title: "RGE",
  description: "Comprendre les objectifs, les labels et le parcours de certification RGE avec Oxideve.",
};

export default function RgePage() {
  return (
    <Section className="rge-page-section">
      <Container>
        <RgeExperience />
      </Container>
    </Section>
  );
}