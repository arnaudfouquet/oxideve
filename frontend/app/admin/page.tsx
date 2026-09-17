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
  return (
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
  );
}
