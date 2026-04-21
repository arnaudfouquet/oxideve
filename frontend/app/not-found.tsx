import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="section">
      <div className="container contact-card">
        <span className="eyebrow">404</span>
        <h1>Page introuvable</h1>
        <p>La ressource demandée n'existe pas ou a été déplacée.</p>
        <Link href="/" className="button button-primary">
          Revenir à l'accueil
        </Link>
      </div>
    </section>
  );
}