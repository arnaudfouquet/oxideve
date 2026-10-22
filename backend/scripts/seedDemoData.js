/**
 * Jeu d'inscriptions et de clients pour le developpement local.
 *
 * La base locale (mysql-memory-server) vit en memoire : tout disparait des
 * qu'elle s'arrete. `npm run db:seed` restaure le catalogue et les avis, qui
 * viennent de fichiers, mais pas les inscriptions. Ce script comble ce vide
 * pour que l'administration reste exploitable apres un redemarrage.
 *
 * A n'utiliser qu'en developpement : il refuse de s'executer en production.
 */
const { loadDotEnv } = require("./loadDotEnv");

loadDotEnv();

const { getPrismaClient } = require("../services/prismaClient");

const STATUSES = {
  TO_QUALIFY: "Pré-inscription (à qualifier)",
  BULLETIN_SENT: "BI envoyé",
  AWAITING_QUIZ: "En attente auto-éval",
  COMPLETE: "Inscription complétée",
  NOT_INTERESTED: "Non intéressé",
};

/** Entreprises fictives, volontairement variees en statut et en anciennete. */
const COMPANIES = [
  { name: "THERMI CONFORT", contactName: "Sophie Nguyen", email: "contact@thermiconfort.fr", phone: "0644556677", status: "Client", priority: "Haute" },
  { name: "ELEC SUD", contactName: "Marie Fontaine", email: "m.fontaine@elecsud.fr", phone: "0698765432", status: "Client", priority: "Normale" },
  { name: "TOIT SOLAIRE 31", contactName: "Karim Benali", email: "k.benali@toitsolaire31.fr", phone: "0677889900", status: "Prospect", priority: "Haute" },
  { name: "AIR CLIMAT MIDI", contactName: "Julien Mercier", email: "j.mercier@airclimatmidi.fr", phone: "0612345678", status: "Prospect", priority: "Normale" },
  { name: "BATI RENOV 34", contactName: "Nadia Lefevre", email: "n.lefevre@batirenov34.fr", phone: "0655443322", status: "Prospect", priority: "Basse" },
  { name: "GARAGE DU LAURAGAIS", contactName: "Thomas Roux", email: "contact@garagelauragais.fr", phone: "0623456789", status: "Client", priority: "Normale" },
];

/** Demandes reparties sur plusieurs formations, statuts et anciennetes. */
const REGISTRATIONS = [
  { company: "THERMI CONFORT", slugMatch: /maintenance.*pompe|pompe.*chaleur/i, status: STATUSES.COMPLETE, daysAgo: 21, message: "Deux techniciens à former avant la saison de chauffe." },
  { company: "ELEC SUD", slugMatch: /habilitation|electri/i, status: STATUSES.BULLETIN_SENT, daysAgo: 12, message: "Recyclage habilitation pour quatre électriciens." },
  { company: "TOIT SOLAIRE 31", slugMatch: /qualipv/i, status: STATUSES.TO_QUALIFY, daysAgo: 6, message: "Nous souhaitons obtenir la qualification pour répondre aux marchés publics." },
  { company: "AIR CLIMAT MIDI", slugMatch: /fluide|frigorigene|attestation/i, status: STATUSES.AWAITING_QUIZ, daysAgo: 9, message: "Attestation d'aptitude catégorie 1 pour un nouveau salarié." },
  { company: "BATI RENOV 34", slugMatch: /irve/i, status: STATUSES.TO_QUALIFY, daysAgo: 3, message: "Quel niveau choisir pour de la borne résidentielle uniquement ?" },
  { company: "GARAGE DU LAURAGAIS", slugMatch: /irve/i, status: STATUSES.BULLETIN_SENT, daysAgo: 15, message: "Installation de bornes sur notre parking client." },
  { company: "THERMI CONFORT", slugMatch: /qualipac/i, status: STATUSES.TO_QUALIFY, daysAgo: 1, message: "Suite à notre échange téléphonique, merci de nous recontacter." },
  { company: "ELEC SUD", slugMatch: /bureautique|excel/i, status: STATUSES.NOT_INTERESTED, daysAgo: 30, message: "Finalement reporté à l'an prochain." },
  { company: "BATI RENOV 34", slugMatch: /securite|sst|secouriste/i, status: STATUSES.TO_QUALIFY, daysAgo: 8, message: "Formation SST pour trois personnes, sur site si possible." },
  { company: "AIR CLIMAT MIDI", slugMatch: /chauffage.*bois|bois/i, status: STATUSES.COMPLETE, daysAgo: 45, message: "Session suivie en octobre, très satisfaits." },
];

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function run() {
  if (process.env.NODE_ENV === "production") {
    console.error("[seedDemoData] Refus : ce script est réservé au développement.");
    process.exitCode = 1;
    return;
  }

  const prisma = getPrismaClient();
  const formations = await prisma.formation.findMany({ select: { slug: true, title: true } });

  if (!formations.length) {
    console.error("[seedDemoData] Aucune formation en base. Lancez d'abord `npm run db:seed`.");
    process.exitCode = 1;
    return;
  }

  const sessions = await prisma.session.findMany({ select: { id: true, formationSlug: true, startDate: true } });

  // Entreprises : on reutilise celles qui existent deja (cle name + email).
  const companyIds = new Map();

  for (const company of COMPANIES) {
    const saved = await prisma.company.upsert({
      where: { name_email: { name: company.name, email: company.email } },
      create: { ...company, source: "Inbound", lastContactAt: daysAgo(7) },
      update: {},
    });

    companyIds.set(company.name, saved.id);
  }

  let crees = 0;
  let ignores = 0;

  for (const demande of REGISTRATIONS) {
    const formation = formations.find((item) => demande.slugMatch.test(item.slug));

    if (!formation) {
      ignores++;
      continue;
    }

    const company = COMPANIES.find((item) => item.name === demande.company);

    // Une session de cette formation, quand il en existe une.
    const session = sessions.find((item) => item.formationSlug === formation.slug);

    const dejaLa = await prisma.inscription.findFirst({
      where: { email: company.email, formationSlug: formation.slug },
      select: { id: true },
    });

    if (dejaLa) {
      ignores++;
      continue;
    }

    await prisma.inscription.create({
      data: {
        companyId: companyIds.get(company.name),
        company: company.name,
        contactName: company.contactName,
        email: company.email,
        phone: company.phone,
        formationSlug: formation.slug,
        sessionId: session ? session.id : null,
        message: demande.message,
        status: demande.status,
        origin: "Formulaire pré-inscription site",
        createdAt: daysAgo(demande.daysAgo),
      },
    });

    crees++;
  }

  const totalInscriptions = await prisma.inscription.count();
  const totalCompanies = await prisma.company.count();

  console.log(`[seedDemoData] ${crees} inscription(s) créée(s), ${ignores} ignorée(s).`);
  console.log(`[seedDemoData] Total en base : ${totalInscriptions} inscription(s), ${totalCompanies} client(s).`);
}

run()
  .catch((error) => {
    console.error("[seedDemoData] Échec", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await getPrismaClient().$disconnect();
  });
