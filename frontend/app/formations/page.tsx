import type { Metadata } from "next";
import Link from "next/link";
import { getFormations } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogue des formations",
  description: "Découvrez les formations Oxideve en photovoltaïque, pompes à chaleur, IRVE et climatisation.",
};

export default async function FormationsPage() {
  const formations = await getFormations();

  return (
    <section className="section">
      <div className="container">
        <div className="page-title">
          <span className="eyebrow">Nos formations</span>
          <h1>Des formations conçues pour des équipes qui interviennent vraiment sur le terrain.</h1>
          <p>Chaque parcours reprend le même socle de lecture: public visé, prérequis, objectifs, modalités, programme, durée, tarif et accessibilité. Vous comparez vite, sans marketing inutile.</p>
        </div>

        <div className="section-grid-3">
          <article className="card card-highlight">
            <h2>Photovoltaïque</h2>
            <p>Parcours pour électriciens et installateurs qui doivent sécuriser le raccordement, la conformité et la préparation QualiPV.</p>
          </article>
          <article className="card">
            <h2>Pompes à chaleur et CVC</h2>
            <p>Formations orientées dimensionnement, mise en service, maintenance et qualité d'exécution sur chantier.</p>
          </article>
          <article className="card">
            <h2>IRVE et équipements techniques</h2>
            <p>Montée en compétence sur les infrastructures de recharge et les systèmes qui demandent une lecture technique fiable.</p>
          </article>
        </div>

        <div className="grid-2 training-grid">
          {formations.map((formation) => (
            <article className="card formation-card" key={formation.slug}>
              <div className="meta-row">
                <span className="meta-pill">{formation.category}</span>
                <span className="meta-pill">{formation.duration}</span>
                <span className="meta-pill">{formation.price}</span>
              </div>
              <h2>{formation.title}</h2>
              <p>{formation.summary}</p>
              <ul className="detail-list">
                {formation.objectives.slice(0, 3).map((objective) => (
                  <li key={objective}>{objective}</li>
                ))}
              </ul>
              <div className="cta-row">
                <Link className="button button-primary" href={`/formations/${formation.slug}`}>
                  Voir la fiche formation
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
