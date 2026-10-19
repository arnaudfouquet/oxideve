const PDFDocument = require("pdfkit");
const {
  GREEN,
  MUTED,
  NAVY,
  PAGE_MARGINS,
  applyPageFrame,
  drawDocumentTitle,
  drawFactRow,
  drawParagraph,
  drawSectionTitle,
  formatDate,
} = require("./pdfTheme");

/**
 * Génère un PDF récapitulatif du bulletin d'inscription, dans la charte
 * Oxideve (bannière et mentions légales répétées sur chaque page).
 * Retourne une Promise<Buffer>.
 */
function generateBulletinPdf(bulletin, formation, session) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: PAGE_MARGINS,
        info: { Title: "Bulletin d'inscription", Author: "Oxideve" },
      });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      applyPageFrame(doc);

      drawDocumentTitle(doc, "Bulletin d'inscription", formation?.category);
      drawParagraph(doc, `Récapitulatif généré le ${formatDate(new Date())}`, { size: 9 });

      drawSectionTitle(doc, "Formation");
      drawFactRow(doc, "Formation", formation?.title || bulletin.formationSlug);
      drawFactRow(
        doc,
        "Session",
        bulletin.sessionDates || (session ? `${formatDate(session.startDate)} - ${formatDate(session.endDate)}` : null),
      );
      drawFactRow(doc, "Lieu", bulletin.sessionLocation || session?.city || formation?.location);
      drawFactRow(doc, "Origine de la demande", bulletin.source);
      drawFactRow(doc, "Distributeur", bulletin.distributorName);

      drawSectionTitle(doc, "Commanditaire de la formation");
      drawFactRow(doc, "Raison sociale", bulletin.companyName);
      drawFactRow(doc, "SIRET", bulletin.siret);
      drawFactRow(doc, "Code APE", bulletin.apeCode);
      drawFactRow(doc, "Adresse", bulletin.companyAddress);
      drawFactRow(doc, "Nom du commanditaire", bulletin.sponsorFullName);
      drawFactRow(doc, "Fonction", bulletin.sponsorRole);
      drawFactRow(doc, "Email", bulletin.sponsorEmail);
      drawFactRow(doc, "Téléphone", bulletin.sponsorPhone);

      const learners = Array.isArray(bulletin.learners) ? bulletin.learners : [];
      const multipleLearners = learners.length > 1;

      learners.forEach((learner, index) => {
        drawSectionTitle(doc, multipleLearners ? `Apprenant ${index + 1}` : "Apprenant");
        drawFactRow(doc, "Nom", learner.fullName);
        drawFactRow(doc, "Email", learner.email);
        drawFactRow(doc, "Fonction", learner.role);
        drawFactRow(doc, "Téléphone", learner.phone);
        drawFactRow(doc, "Date de naissance", learner.birthDate ? formatDate(learner.birthDate) : null);
        drawFactRow(doc, "Situation de handicap", learner.hasDisability ? "Oui" : "Non");

        if (learner.hasDisability && learner.disabilityDetails) {
          drawFactRow(doc, "Précisions", learner.disabilityDetails);
        }
      });

      doc.moveDown(1);
      drawParagraph(
        doc,
        "Ce document constitue un récapitulatif de votre demande d'inscription. L'équipe Oxideve vous recontactera pour finaliser l'organisation de la formation.",
        { size: 8.5 },
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Génère un PDF récapitulatif d'une tentative d'auto-évaluation (score et
 * détail par question), dans la charte Oxideve. Retourne une Promise<Buffer>.
 */
function generateQuizPdf(quiz, attemptResult) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: PAGE_MARGINS,
        info: { Title: "Résultat de l'auto-évaluation", Author: "Oxideve" },
      });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      applyPageFrame(doc);

      drawDocumentTitle(doc, "Résultat de l'auto-évaluation", quiz?.title);
      drawParagraph(doc, `Généré le ${formatDate(new Date())}`, { size: 9 });

      drawSectionTitle(doc, "Candidat");
      drawFactRow(doc, "Nom", attemptResult.attempt.learnerFullName);
      drawFactRow(doc, "Email", attemptResult.attempt.learnerEmail);
      drawFactRow(doc, "Entreprise", attemptResult.attempt.companyName);

      drawSectionTitle(doc, "Score");
      drawFactRow(doc, "Score", `${attemptResult.attempt.scoreOn20} / 20`);
      drawFactRow(doc, "Bonnes réponses", `${attemptResult.correctCount} / ${attemptResult.totalQuestions}`);

      drawSectionTitle(doc, "Détail des réponses");

      attemptResult.details.forEach((detail, index) => {
        doc.fillColor(NAVY).fontSize(10.5).font("Helvetica-Bold").text(`${index + 1}. ${detail.question}`, { lineGap: 2 });
        doc
          .fillColor(detail.isCorrect ? GREEN : "#b13030")
          .fontSize(10)
          .font("Helvetica")
          .text(`Réponse donnée : ${detail.submittedLabel || "Non répondu"}`, { indent: 10 });

        if (!detail.isCorrect) {
          doc.fillColor(MUTED).text(`Bonne réponse : ${detail.correctLabel || "-"}`, { indent: 10 });
        }

        doc.moveDown(0.5);
      });

      // Conseil de niveau, identique à celui affiché à l'écran après le quiz.
      const scoreOnTen = Math.round((attemptResult.attempt.scoreOn20 / 2) * 10) / 10;
      const belowThreshold = scoreOnTen < 5;

      drawSectionTitle(doc, "Votre niveau");
      drawParagraph(doc, `Vous avez obtenu le score de ${scoreOnTen} / 10.`, {
        color: NAVY,
        font: "Helvetica-Bold",
        size: 11,
      });
      drawParagraph(doc, "Si vous avez obtenu un score :");
      drawParagraph(
        doc,
        "- Inférieur à 5/10 : Niveau de connaissance trop juste, nous vous conseillons de demander l'envoi du référentiel à contact@oxideve.com afin que vous puissiez débuter les révisions",
        { color: belowThreshold ? NAVY : MUTED, font: belowThreshold ? "Helvetica-Bold" : "Helvetica" },
      );
      drawParagraph(
        doc,
        "- Supérieur à 5/10 : Niveau de prérequis correct, nous vous souhaitons une bonne formation",
        { color: belowThreshold ? MUTED : NAVY, font: belowThreshold ? "Helvetica" : "Helvetica-Bold" },
      );

      doc.moveDown(0.6);
      drawParagraph(
        doc,
        "Ce document est un support pédagogique destiné à préparer la formation, il n'a pas de valeur certificative.",
        { size: 8.5 },
      );

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
