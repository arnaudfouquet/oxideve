import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Qui sommes-nous",
  description: "Découvrez l'approche Oxideve, son ancrage terrain et sa manière de construire des parcours utiles aux équipes techniques.",
};

export default function QuiSommesNousPage() {
  return (
    <section className="section">
      <div className="container">
        <div className="page-title">
          <span className="eyebrow">Qui sommes-nous</span>
          <h1>Oxideve forme les équipes qui doivent livrer juste, vite et conforme.</h1>
          <p>Nous concevons des parcours pour les métiers de l'énergie et du BTP avec une ligne claire: relier réglementation, geste terrain et qualité d'exécution.</p>
        </div>

        <div className="grid-2">
          <article className="card card-highlight">
            <h2>Notre manière de travailler</h2>
            <ul className="detail-list">
              <li>Des formats courts et directement actionnables sur les prochains chantiers.</li>
              <li>Des contenus rédigés pour les installateurs, conducteurs de travaux et responsables techniques.</li>
              <li>Un accompagnement qui relie compétences, qualification et exigences documentaires.</li>
            </ul>
          </article>
          <article className="card">
            <h2>Ce que nous apportons aux entreprises</h2>
            <ul className="detail-list">
              <li>Des formations inter et intra-entreprise faciles à planifier.</li>
              <li>Un catalogue cohérent sur le photovoltaïque, la PAC, l'IRVE et le traitement d'air.</li>
              <li>Une équipe capable de transformer un besoin flou en session exploitable rapidement.</li>
            </ul>
          </article>
        </div>

        <div className="section grid-3">
          <article className="card">
            <h3>Ancrage métier</h3>
            <p>Chaque programme est pensé avec les contraintes de chantier, de mise en service et de conformité documentaire.</p>
          </article>
          <article className="card">
            <h3>Souplesse de déploiement</h3>
            <p>Présentiel, distanciel tutoré ou sessions dédiées: l'organisation suit votre charge réelle.</p>
          </article>
          <article className="card">
            <h3>Pilotage simple</h3>
            <p>Le calendrier, les inscriptions et le catalogue sont centralisés pour éviter les échanges dispersés.</p>
          </article>
        </div>
      </div>
    </section>
  );
}