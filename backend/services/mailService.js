const nodemailer = require("nodemailer");

let transporterSingleton = null;
let warnedMissingConfig = false;

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST);
}

function getTransporter() {
  if (!isSmtpConfigured()) {
    return null;
  }

  if (transporterSingleton) {
    return transporterSingleton;
  }

  transporterSingleton = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number.parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });

  return transporterSingleton;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function buildEmailHtml({ bulletin, formation, session, quizUrl }) {
  const formationTitle = formation?.title || bulletin.formationSlug;
  const sessionSummary =
    bulletin.sessionDates || (session ? `${formatDate(session.startDate)} - ${formatDate(session.endDate)}` : null);

  return `
    <div style="font-family: Arial, sans-serif; color: #004d6d; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #004d6d;">Confirmation de votre demande d'inscription</h2>
      <p>Bonjour,</p>
      <p>
        Nous avons bien reçu la demande d'inscription à la formation
        <strong>${formationTitle}</strong>${sessionSummary ? ` (session du ${sessionSummary})` : ""}.
      </p>
      <p>Vous trouverez le récapitulatif complet de votre bulletin d'inscription en pièce jointe (PDF).</p>
      <p>Notre équipe vous recontactera prochainement pour finaliser l'organisation de cette formation.</p>
      ${
        quizUrl
          ? `<p style="margin-top: 24px;">
              Prochaine étape : l'apprenant peut dès à présent réaliser son
              <strong>auto-évaluation</strong> en amont de la formation.
            </p>
            <p>
              <a href="${quizUrl}" style="display: inline-block; background: #09cf65; color: #ffffff; padding: 12px 20px; border-radius: 999px; text-decoration: none; font-weight: bold;">
                Faire mon auto-évaluation
              </a>
            </p>`
          : ""
      }
      <p style="margin-top: 32px; color: #4d6a78; font-size: 0.85rem;">Oxideve - Organisme de formation professionnelle</p>
    </div>
  `;
}

/**
 * Envoie l'email de confirmation de bulletin d'inscription au sponsor et à l'apprenant
 * (dédupliqués si même adresse), avec le PDF récapitulatif en pièce jointe.
 * Si SMTP_HOST n'est pas configuré, la fonction logge un avertissement et ne fait rien
 * (mode dégradé) plutôt que de faire planter le flux d'inscription.
 */
async function sendBulletinConfirmationEmail({ bulletin, formation, session, pdfBuffer, quizUrl }) {
  const transporter = getTransporter();

  if (!transporter) {
    if (!warnedMissingConfig) {
      console.warn(
        "[mailService] SMTP_HOST non configuré : envoi d'email désactivé (mode dégradé). Le bulletin reste enregistré en base.",
      );
      warnedMissingConfig = true;
    }

    return { sent: false, reason: "smtp_not_configured" };
  }

  // Le schéma BulletinInscription ne porte qu'un seul email de contact direct (sponsorEmail) ;
  // learnerEmail n'existe que dans un contexte quiz (QuizAttempt). On déduplique tout de même
  // au cas où un learnerEmail serait fourni explicitement (ex: apprenant = commanditaire).
  const uniqueRecipients = Array.from(new Set([bulletin.sponsorEmail, bulletin.learnerEmail].filter(Boolean)));

  const from = process.env.MAIL_FROM || "no-reply@oxideve.fr";
  const html = buildEmailHtml({ bulletin, formation, session, quizUrl });

  try {
    await transporter.sendMail({
      from,
      to: uniqueRecipients,
      subject: `Confirmation de votre inscription - ${formation?.title || bulletin.formationSlug}`,
      html,
      attachments: [
        {
          filename: "bulletin-inscription.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return { sent: true };
  } catch (error) {
    console.error("[mailService] Échec de l'envoi de l'email de confirmation", error);
    return { sent: false, reason: "send_error" };
  }
}

module.exports = {
  isSmtpConfigured,
  sendBulletinConfirmationEmail,
};
