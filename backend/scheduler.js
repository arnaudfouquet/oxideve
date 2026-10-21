const cron = require("node-cron");

const { buildWeeklyExportWorkbook, weeklyExportFileName } = require("./services/weeklyExportService");
const { sendWeeklyExportEmail, isSmtpConfigured } = require("./services/mailService");

// Vendredi 16h00, heure de Paris. Surchargeable si l'horaire doit bouger.
const WEEKLY_EXPORT_CRON = process.env.WEEKLY_EXPORT_CRON || "0 16 * * 5";
const TIMEZONE = process.env.SCHEDULER_TIMEZONE || "Europe/Paris";

/** Genere le classeur et l'envoie. Isole pour etre declenchable a la demande. */
async function runWeeklyExport() {
  const { buffer, registrationsCount, sessionsCount } = await buildWeeklyExportWorkbook();
  const fileName = weeklyExportFileName();

  const result = await sendWeeklyExportEmail({ buffer, fileName, registrationsCount, sessionsCount });

  if (result.sent) {
    console.log(
      `[scheduler] Export hebdomadaire envoyé à ${result.recipients.join(", ")} (${registrationsCount} demande(s), ${sessionsCount} session(s)).`,
    );
  } else {
    console.warn(`[scheduler] Export hebdomadaire non envoyé : ${result.reason}.`);
  }

  return { ...result, fileName, registrationsCount, sessionsCount };
}

/**
 * Les taches planifiees ne tournent qu'en production : en developpement, le
 * serveur redemarre sans cesse et enverrait des mails a chaque fois.
 */
function startScheduler() {
  if (process.env.ENABLE_SCHEDULER !== "true" && process.env.NODE_ENV !== "production") {
    console.log("[scheduler] Tâches planifiées désactivées (hors production).");
    return null;
  }

  if (!cron.validate(WEEKLY_EXPORT_CRON)) {
    console.error(`[scheduler] Expression cron invalide : "${WEEKLY_EXPORT_CRON}". Export hebdomadaire désactivé.`);
    return null;
  }

  if (!isSmtpConfigured()) {
    console.warn("[scheduler] SMTP non configuré : l'export hebdomadaire sera généré mais pas envoyé.");
  }

  const task = cron.schedule(
    WEEKLY_EXPORT_CRON,
    () => {
      runWeeklyExport().catch((error) => {
        console.error("[scheduler] Échec de l'export hebdomadaire", error);
      });
    },
    { timezone: TIMEZONE },
  );

  console.log(`[scheduler] Export hebdomadaire planifié (${WEEKLY_EXPORT_CRON}, ${TIMEZONE}).`);

  return task;
}

module.exports = {
  runWeeklyExport,
  startScheduler,
};
