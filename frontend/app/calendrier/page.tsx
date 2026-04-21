import type { Metadata } from "next";
import { formatDateRange, getFormations, getSessions } from "@/lib/content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Calendrier des sessions",
  description: "Visualisez les prochaines sessions de formation Oxideve et les places disponibles.",
};

export default function CalendrierPage() {
  const sessions = getSessions();
  const formations = getFormations();

  return (
    <section className="section">
      <div className="container">
        <div className="page-title">
          <span className="eyebrow">Planning</span>
          <h1>Calendrier des prochaines sessions</h1>
          <p>Vue claire des sessions commercialisables pour accélérer le remplissage et simplifier l'arbitrage équipe formation / équipe vente.</p>
        </div>

        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Formation</th>
                <th>Dates</th>
                <th>Ville</th>
                <th>Mode</th>
                <th>Places</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const formation = formations.find((item) => item.slug === session.formationSlug);

                return (
                  <tr key={session.id}>
                    <td>{formation?.shortTitle}</td>
                    <td>{formatDateRange(session.startDate, session.endDate)}</td>
                    <td>{session.city}</td>
                    <td>{session.mode}</td>
                    <td>{session.seatsLeft}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
