const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const LOGO_PATH = path.join(__dirname, "..", "assets", "oxideve-logo.png");
const hasLogo = fs.existsSync(LOGO_PATH);

function drawHeader(doc, title) {
  if (hasLogo) {
    try {
      doc.image(LOGO_PATH, doc.page.margins.left, doc.page.margins.top, { width: 90 });
    } catch (error) {
      console.error("[pdfService] Échec du chargement du logo, PDF généré sans logo", error);
    }
  }

  const textLeft = hasLogo ? doc.page.margins.left + 100 : doc.page.margins.left;
  doc
    .fillColor("#004d6d")
    .fontSize(20)
    .font("Helvetica-Bold")
    .text(title, textLeft, doc.page.margins.top + 6, { align: "left" });
  doc.fillColor("#4d6a78").fontSize(10).font("Helvetica").text("Oxideve - Organisme de formation professionnelle", textLeft);

  doc.y = doc.page.margins.top + 90;
  doc.x = doc.page.margins.left;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function drawSectionTitle(doc, title) {
  doc.moveDown(1);
  doc.fillColor("#004d6d").fontSize(13).font("Helvetica-Bold").text(title);
  doc.moveDown(0.3);
  doc
    .strokeColor("#009cdc")
    .lineWidth(1.5)
    .moveTo(doc.x, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();
  doc.moveDown(0.5);
  doc.fillColor("#111111").font("Helvetica").fontSize(10.5);
}

function drawField(doc, label, value) {
  if (!value) {
    return;
  }

  doc.font("Helvetica-Bold").text(`${label} : `, { continued: true }).font("Helvetica").text(String(value));
}

/**
 * Génère un PDF récapitulatif simple et lisible du bulletin d'inscription.
 * Retourne une Promise<Buffer> pour rester facile à consommer (await) côté routes/services.
 */
function generateBulletinPdf(bulletin, formation, session) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      drawHeader(doc, "Bulletin d'inscription");
      doc.fillColor("#4d6a78").fontSize(9).text(`Récapitulatif généré le ${formatDate(new Date())}`);

      drawSectionTitle(doc, "Formation");
      drawField(doc, "Formation", formation?.title || bulletin.formationSlug);
      drawField(doc, "Session", bulletin.sessionDates || (session ? `${formatDate(session.startDate)} - ${formatDate(session.endDate)}` : null));
      drawField(doc, "Lieu", bulletin.sessionLocation || session?.city || formation?.location);
      drawField(doc, "Origine de la demande", bulletin.source);
      drawField(doc, "Distributeur", bulletin.distributorName);

      drawSectionTitle(doc, "Commanditaire de la formation");
      drawField(doc, "Raison sociale", bulletin.companyName);
      drawField(doc, "SIRET", bulletin.siret);
      drawField(doc, "Code APE", bulletin.apeCode);
      drawField(doc, "Adresse", bulletin.companyAddress);
      drawField(doc, "Nom du commanditaire", bulletin.sponsorFullName);
      drawField(doc, "Fonction", bulletin.sponsorRole);
      drawField(doc, "Email", bulletin.sponsorEmail);
      drawField(doc, "Téléphone", bulletin.sponsorPhone);

      const learners = Array.isArray(bulletin.learners) ? bulletin.learners : [];
      const multipleLearners = learners.length > 1;

      learners.forEach((learner, index) => {
        drawSectionTitle(doc, multipleLearners ? `Apprenant ${index + 1}` : "Apprenant");
        drawField(doc, "Nom", learner.fullName);
        drawField(doc, "Email", learner.email);
        drawField(doc, "Fonction", learner.role);
        drawField(doc, "Téléphone", learner.phone);
        drawField(doc, "Date de naissance", learner.birthDate ? formatDate(learner.birthDate) : null);
        drawField(doc, "Situation de handicap", learner.hasDisability ? "Oui" : "Non");

        if (learner.hasDisability && learner.disabilityDetails) {
          doc.moveDown(0.3);
          doc.font("Helvetica-Bold").text("Précisions : ", { continued: true }).font("Helvetica").text(learner.disabilityDetails);
        }
      });

      doc.moveDown(1.5);
      doc
        .fillColor("#4d6a78")
        .fontSize(8.5)
        .text(
          "Ce document constitue un récapitulatif de votre demande d'inscription. L'équipe Oxideve vous recontactera pour finaliser l'organisation de la formation.",
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Génère un PDF récapitulatif d'une tentative d'auto-évaluation : score, et détail
 * correct/incorrect par question. Retourne une Promise<Buffer>.
 */
function generateQuizPdf(quiz, attemptResult) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      drawHeader(doc, "Résultat de l'auto-évaluation");
      doc.fillColor("#4d6a78").fontSize(9).text(`Généré le ${formatDate(new Date())}`);

      drawSectionTitle(doc, quiz?.title || "Auto-évaluation");
      drawField(doc, "Candidat", attemptResult.attempt.learnerFullName);
      drawField(doc, "Email", attemptResult.attempt.learnerEmail);
      drawField(doc, "Entreprise", attemptResult.attempt.companyName);
      drawField(doc, "Score", `${attemptResult.attempt.scoreOn20} / 20`);
      drawField(doc, "Bonnes réponses", `${attemptResult.correctCount} / ${attemptResult.totalQuestions}`);

      drawSectionTitle(doc, "Détail des réponses");

      for (const [index, detail] of attemptResult.details.entries()) {
        doc.font("Helvetica-Bold").fillColor("#111111").fontSize(10.5).text(`${index + 1}. ${detail.question}`);
        doc
          .font("Helvetica")
          .fillColor(detail.isCorrect ? "#0b6a4d" : "#a93b3b")
          .text(`Réponse donnée : ${detail.submittedLabel || "Non répondu"}`);

        if (!detail.isCorrect) {
          doc.fillColor("#4d6a78").text(`Bonne réponse : ${detail.correctLabel || "-"}`);
        }

        doc.moveDown(0.5);
      }

      doc.fillColor("#111111");
      doc.moveDown(1);
      doc
        .fillColor("#4d6a78")
        .fontSize(8.5)
        .text("Ce document est un support pédagogique destiné à préparer la formation, il n'a pas de valeur certificative.");

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateBulletinPdf,
  generateQuizPdf,
};
