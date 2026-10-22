import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { FeedbackForm } from "@/components/FeedbackForm";
import { FEEDBACK_KINDS, FEEDBACK_PAGES } from "@/lib/feedback-options";

export const metadata: Metadata = {
  title: "Vos retours sur le site",
  // Page de recette interne : elle n'a rien à faire dans les résultats Google.
  robots: { index: false, follow: false },
};

export default function RetoursPage() {
  return (
    <main className="ct-page">
      <section className="ct-hero">
        <Container className="ct-hero-inner">
          <h1 className="ct-hero-title">
            Vos <em>retours</em>
          </h1>
          <p className="ct-hero-lead">
            Merci de tester le site. Signalez ici tout ce qui vous semble flou, cassé ou perfectible.
            <br />
            Un retour par remarque, c&apos;est plus simple à traiter ensuite.
          </p>
        </Container>
      </section>

      <Container className="feedback-layout">
        <div className="ct-form-card">
          <h2 className="ct-card-title">
            Décrivez <em>ce que vous avez vu</em>
          </h2>
          <FeedbackForm kinds={FEEDBACK_KINDS} pages={FEEDBACK_PAGES} />
        </div>
      </Container>
    </main>
  );
}
