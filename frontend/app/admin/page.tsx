import type { Metadata } from "next";
import { getFormations, getSessions } from "@/lib/content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Admin",
  description: "Vue simple back-office pour suivre formations, sessions et inscriptions.",
};

export default function AdminPage() {
  const formations = getFormations();
  const sessions = getSessions();
  const totalSeatsLeft = sessions.reduce((total, session) => total + session.seatsLeft, 0);

  return (
    <section className="section">
      <div className="container">
        <div className="page-title">
          <span className="eyebrow">Back-office</span>
          <h1>Dashboard opérationnel</h1>
          <p>Base simple pour piloter catalogue, sessions et flux d'inscriptions avant un enrichissement complet du back-office.</p>
        </div>

        <div className="admin-grid">
          <section className="admin-shell">
            <h2>Indicateurs</h2>
            <div className="stats-strip">
              <span className="stat-pill">{formations.length} formations actives</span>
              <span className="stat-pill">{sessions.length} sessions planifiées</span>
              <span className="stat-pill">{totalSeatsLeft} places restantes</span>
            </div>
          </section>
          <section className="admin-shell">
            <h2>Actions prioritaires</h2>
            <p>Créer une session supplémentaire sur QualiPAC, vérifier le taux de remplissage IRVE et relancer les leads entrants sur QualiPV.</p>
          </section>
        </div>

        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Formation</th>
                <th>Catégorie</th>
                <th>Durée</th>
                <th>Positionnement</th>
              </tr>
            </thead>
            <tbody>
              {formations.map((formation) => (
                <tr key={formation.slug}>
                  <td>{formation.shortTitle}</td>
                  <td>{formation.category}</td>
                  <td>{formation.duration}</td>
                  <td>{formation.audience}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
