import type { Metadata } from "next";
import { AdminConsole } from "@/components/AdminConsole";
import { getArticles, getCompanies, getFormations, getRegistrations, getSessions } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  description: "Administration du catalogue de formations et des inscriptions.",
};

export default async function AdminPage() {
  const [formations, sessions, registrations, articles, companies] = await Promise.all([
    getFormations(),
    getSessions(),
    getRegistrations(),
    getArticles(),
    getCompanies(),
  ]);
  const totalSeatsLeft = sessions.reduce((total, session) => total + session.seatsLeft, 0);

  return (
    <section className="section">
      <div className="container">
        <div className="page-title">
          <span className="eyebrow">Back-office</span>
          <h1>CMS Oxideve</h1>
          <p>Catalogue, sessions, inscriptions et contenu editorial centralises dans une meme interface d'administration.</p>
        </div>

        <div className="stats-strip">
          <span className="stat-pill">{formations.length} formations</span>
          <span className="stat-pill">{sessions.length} sessions</span>
          <span className="stat-pill">{companies.length} entreprises</span>
          <span className="stat-pill">{articles.length} articles</span>
          <span className="stat-pill">{totalSeatsLeft} places restantes</span>
        </div>

        <AdminConsole
          initialArticles={articles}
          initialCompanies={companies}
          initialFormations={formations}
          initialSessions={sessions}
          initialRegistrations={registrations}
        />
      </div>
    </section>
  );
}
