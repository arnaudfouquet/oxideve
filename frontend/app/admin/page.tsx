import type { Metadata } from "next";
import { AdminWorkspace } from "@/components/AdminWorkspace";
import { getArticles, getBulletinInscriptions, getCompanies, getCrmInteractions, getCrmTasks, getFormations, getParticipants, getRegistrations, getSessions } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  description: "Administration du catalogue de formations et des inscriptions.",
};

export default async function AdminPage() {
  const [formations, sessions, registrations, articles, companies, crmTasks, crmInteractions, bulletinInscriptions, participants] = await Promise.all([
    getFormations(),
    getSessions(),
    getRegistrations(),
    getArticles(),
    getCompanies(),
    getCrmTasks(),
    getCrmInteractions(),
    getBulletinInscriptions(),
    getParticipants(),
  ]);
  const totalSeatsLeft = sessions.reduce((total, session) => total + session.seatsLeft, 0);

  return (
    <section className="admin-page-shell">
      <div className="admin-page-container">
        <div className="stats-strip">
          <span className="stat-pill">{formations.length} formations</span>
          <span className="stat-pill">{sessions.length} sessions</span>
          <span className="stat-pill">{companies.length} entreprises</span>
          <span className="stat-pill">{articles.length} articles</span>
          <span className="stat-pill">{totalSeatsLeft} places restantes</span>
        </div>

        <AdminWorkspace
          initialArticles={articles}
          initialCompanies={companies}
          initialCrmInteractions={crmInteractions}
          initialCrmTasks={crmTasks}
          initialFormations={formations}
          initialSessions={sessions}
          initialRegistrations={registrations}
          initialBulletinInscriptions={bulletinInscriptions}
          initialParticipants={participants}
        />
      </div>
    </section>
  );
}
