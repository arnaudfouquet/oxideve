import type { Metadata } from "next";
import { AdminConsole } from "@/components/AdminConsole";
import { getFormations, getRegistrations, getSessions } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  description: "Administration du catalogue de formations et des inscriptions.",
};

export default async function AdminPage() {
  const [formations, sessions, registrations] = await Promise.all([getFormations(), getSessions(), getRegistrations()]);
  const totalSeatsLeft = sessions.reduce((total, session) => total + session.seatsLeft, 0);

  return (
    <section className="section">
      <div className="container">
        <div className="page-title">
          <span className="eyebrow">Back-office</span>
          <h1>Administration du catalogue et des inscriptions</h1>
          <p>Accès protégé pour créer une formation, mettre à jour les contenus métier et suivre les inscriptions récentes.</p>
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
            <p>Utilisez cet espace pour mettre à jour les fiches formation, compléter les sections pédagogiques et contrôler les demandes entrantes.</p>
          </section>
        </div>

        <AdminConsole initialFormations={formations} initialSessions={sessions} initialRegistrations={registrations} />
      </div>
    </section>
  );
}
