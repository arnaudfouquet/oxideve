import type { Metadata } from "next";
import { AdminConsole } from "@/components/AdminConsole";
import { getFormations, getRegistrations, getSessions } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  description: "Vue simple back-office pour suivre formations, sessions et inscriptions.",
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
          <p>Modifiez les textes clés des formations, créez de nouvelles offres et gardez un oeil sur les inscriptions récentes depuis une seule interface.</p>
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
            <p>Le back-office permet maintenant de créer une formation et d'ajuster les textes publiés. Les sessions et les inscriptions restent visibles pour arbitrer l'activité.</p>
          </section>
        </div>

        <AdminConsole initialFormations={formations} initialSessions={sessions} initialRegistrations={registrations} />
      </div>
    </section>
  );
}
