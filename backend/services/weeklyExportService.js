const ExcelJS = require("exceljs");

const { listRegistrations } = require("./registrationService");
const { listFormations, listSessions } = require("./catalogService");

// Charte Oxideve, reprise de frontend/app/globals.css.
const NAVY = "FF004D6D";
const GREEN = "FF09CF65";
const LIGHT = "FFF2F6F8";

/** Les dates sont stockees en ISO : on les presente au format francais. */
function formatDateFr(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTimeFr(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Depuis combien de jours la demande attend-elle ? C'est l'information que les
 * agents regardent en premier, elle est donc reprise telle quelle de l'admin.
 */
function waitingDays(createdAt) {
  const reception = new Date(createdAt);

  if (Number.isNaN(reception.getTime())) {
    return "";
  }

  const jour = 24 * 60 * 60 * 1000;

  return Math.max(0, Math.floor((Date.now() - reception.getTime()) / jour));
}

function styleHeader(sheet, color) {
  const header = sheet.getRow(1);

  header.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
  header.alignment = { vertical: "middle", horizontal: "left" };
  header.height = 22;
}

/** Une ligne sur deux est grisee : un tableau long reste lisible a l'impression. */
function stripeRows(sheet) {
  sheet.eachRow((row, index) => {
    if (index === 1 || index % 2 !== 0) {
      return;
    }

    row.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } };
    });
  });
}

function autoFilterAndFreeze(sheet) {
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: "A1", to: { row: 1, column: sheet.columnCount } };
}

function buildRegistrationsSheet(workbook, registrations, formationsBySlug, sessionsById) {
  const sheet = workbook.addWorksheet("Inscrits");

  sheet.columns = [
    { header: "Reçue le", key: "createdAt", width: 18 },
    { header: "Attente (j)", key: "waiting", width: 12 },
    { header: "Statut", key: "status", width: 26 },
    { header: "Société", key: "company", width: 28 },
    { header: "Contact", key: "contactName", width: 24 },
    { header: "Email", key: "email", width: 30 },
    { header: "Téléphone", key: "phone", width: 16 },
    { header: "Formation", key: "formation", width: 42 },
    { header: "Session", key: "session", width: 30 },
    { header: "Origine", key: "origin", width: 18 },
    { header: "Message", key: "message", width: 50 },
  ];

  registrations.forEach((registration) => {
    const formation = formationsBySlug.get(registration.formationSlug);
    const session = registration.sessionId ? sessionsById.get(registration.sessionId) : null;

    sheet.addRow({
      createdAt: formatDateTimeFr(registration.createdAt),
      waiting: waitingDays(registration.createdAt),
      status: registration.status,
      company: registration.company || "",
      contactName: registration.contactName || "",
      email: registration.email || "",
      phone: registration.phone || "",
      formation: formation ? formation.title : registration.formationSlug,
      session: session ? `${session.city} - ${formatDateFr(session.startDate)}` : "Sans date",
      origin: registration.origin || "",
      message: registration.message || "",
    });
  });

  styleHeader(sheet, NAVY);
  stripeRows(sheet);
  autoFilterAndFreeze(sheet);

  return sheet;
}

function buildSessionsSheet(workbook, sessions, formationsBySlug, registrations) {
  const sheet = workbook.addWorksheet("Formations en cours");

  sheet.columns = [
    { header: "Début", key: "startDate", width: 14 },
    { header: "Fin", key: "endDate", width: 14 },
    { header: "Formation", key: "formation", width: 46 },
    { header: "Ville", key: "city", width: 18 },
    { header: "Modalité", key: "mode", width: 16 },
    { header: "Inscrits", key: "count", width: 10 },
  ];

  // Seules les sessions a venir ou en cours interessent les agents.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const countBySession = registrations.reduce((accumulator, registration) => {
    if (registration.sessionId) {
      accumulator.set(registration.sessionId, (accumulator.get(registration.sessionId) || 0) + 1);
    }

    return accumulator;
  }, new Map());

  sessions
    .filter((session) => {
      const end = new Date(session.endDate || session.startDate);

      return !Number.isNaN(end.getTime()) && end >= today;
    })
    .sort((left, right) => String(left.startDate).localeCompare(String(right.startDate)))
    .forEach((session) => {
      const formation = formationsBySlug.get(session.formationSlug);

      sheet.addRow({
        startDate: formatDateFr(session.startDate),
        endDate: formatDateFr(session.endDate),
        formation: formation ? formation.title : session.formationSlug,
        city: session.city || "",
        mode: session.mode || "",
        count: countBySession.get(session.id) || 0,
      });
    });

  styleHeader(sheet, GREEN);
  stripeRows(sheet);
  autoFilterAndFreeze(sheet);

  return sheet;
}

/**
 * Classeur de secours hebdomadaire : si le site est indisponible, les agents
 * gardent sous la main la liste des demandes et les sessions a venir.
 */
async function buildWeeklyExportWorkbook() {
  const [registrations, formations, sessions] = await Promise.all([
    listRegistrations(),
    listFormations(),
    listSessions(),
  ]);

  const formationsBySlug = new Map(formations.map((formation) => [formation.slug, formation]));
  const sessionsById = new Map(sessions.map((session) => [session.id, session]));

  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Oxideve";
  workbook.created = new Date();

  const sorted = [...registrations].sort((left, right) =>
    String(right.createdAt).localeCompare(String(left.createdAt)),
  );

  buildRegistrationsSheet(workbook, sorted, formationsBySlug, sessionsById);
  const sessionsSheet = buildSessionsSheet(workbook, sessions, formationsBySlug, registrations);

  const buffer = await workbook.xlsx.writeBuffer();

  return {
    buffer: Buffer.from(buffer),
    registrationsCount: sorted.length,
    sessionsCount: sessionsSheet.rowCount - 1,
  };
}

/** Nom de fichier date, pour que les envois successifs ne s'ecrasent pas. */
function weeklyExportFileName(date = new Date()) {
  const jour = String(date.getDate()).padStart(2, "0");
  const mois = String(date.getMonth() + 1).padStart(2, "0");

  return `oxideve-inscrits-${date.getFullYear()}-${mois}-${jour}.xlsx`;
}

module.exports = {
  buildWeeklyExportWorkbook,
  weeklyExportFileName,
};
