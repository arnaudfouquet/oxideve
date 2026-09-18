import { ButtonLink, Text } from "@/components/ui";

export default function NotFoundPage() {
  return (
    <section className="section">
      <div className="container contact-card">
        <span className="eyebrow">404</span>
        <h1>Page introuvable</h1>
        <Text tone="muted">La ressource demandée n'existe pas ou a été déplacée.</Text>
        <ButtonLink href="/" variant="primary">
          Revenir à l'accueil
        </ButtonLink>
      </div>
    </section>
  );
}