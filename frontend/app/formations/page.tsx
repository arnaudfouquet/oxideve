import type { Metadata } from "next";
import Link from "next/link";
import { getFormations } from "@/lib/content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Catalogue des formations",
  description: "Découvrez les formations Oxideve en photovoltaïque, pompes à chaleur, IRVE et climatisation.",
};

export default function FormationsPage() {
  const formations = getFormations();

  return (
    <section className="section">
      <div className="container">
        <div className="page-title">
          <span className="eyebrow">SEO formation</span>
          <h1>Catalogue des formations Oxideve</h1>
          <p>Chaque formation dispose de sa propre page optimisée pour la recherche organique, la qualification commerciale et l'inscription.</p>
        </div>

        <div className="grid-2">
          {formations.map((formation) => (
            <article className="card" key={formation.slug}>
              <div className="meta-row">
                <span className="meta-pill">{formation.category}</span>
                <span className="meta-pill">{formation.price}</span>
              </div>
              <h2>{formation.title}</h2>
              <p>{formation.description}</p>
              <ul className="detail-list">
                {formation.objectives.map((objective) => (
                  <li key={objective}>{objective}</li>
                ))}
              </ul>
              <div className="cta-row">
                <Link className="button button-primary" href={`/formations/${formation.slug}`}>
                  Ouvrir la page SEO
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
