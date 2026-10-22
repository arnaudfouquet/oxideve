const PDFDocument = require("pdfkit");
const {
  GREEN,
  NAVY,
  PAGE_MARGINS,
  applyPageFrame,
  drawBulletList,
  drawDocumentTitle,
  drawFactRow,
  drawParagraph,
  drawPartnerLogos,
  drawSectionTitle,
  measurePartnerLogos,
} = require("./pdfTheme");

/**
 * Génère la fiche programme d'une formation dans la charte Oxideve
 * (bannière et mentions légales répétées sur chaque page).
 * Retourne une Promise<Buffer>.
 */
function generateProgrammePdf(formation) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: PAGE_MARGINS,
        info: { Title: `Programme - ${formation.title}`, Author: "Oxideve" },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      applyPageFrame(doc);

      // Les logos partenaires se placent a hauteur du titre, a droite : on
      // retient l'ordonnee avant de l'ecrire et on lui reserve la largeur.
      const hautTitre = doc.y;
      const largeurLogos = measurePartnerLogos(doc, formation.partnerLogos);

      drawDocumentTitle(
        doc,
        formation.levelLabel ? `${formation.title} — ${formation.levelLabel}` : formation.title,
        formation.category,
        largeurLogos,
      );
      drawPartnerLogos(doc, formation.partnerLogos, hautTitre);
      drawParagraph(doc, formation.summary, { size: 10.5 });

      drawSectionTitle(doc, "Informations pratiques");
      drawFactRow(doc, "Durée", formation.duration);
      drawFactRow(doc, "Durée détaillée", formation.durationDetails);
      drawFactRow(doc, "Public", formation.audience);
      drawFactRow(doc, "Lieu", formation.location);
      drawFactRow(doc, "Tarif", formation.cpfEligible ? `${formation.price} — Finançable CPF` : formation.price);
      drawFactRow(doc, "Modalités tarif", formation.priceDetails);
      drawFactRow(doc, "Taux de réussite", formation.successRate);
      drawFactRow(doc, "Accessibilité", formation.handicapPolicy);

      if (formation.certification) {
        drawSectionTitle(doc, "Finalité");
        drawParagraph(doc, formation.certification);
      }

      drawSectionTitle(doc, "Présentation");
      drawParagraph(doc, formation.description);

      drawSectionTitle(doc, "Objectifs pédagogiques");
      drawBulletList(doc, formation.objectives);

      drawSectionTitle(doc, "Points forts");
      drawBulletList(doc, formation.benefits);

      drawSectionTitle(doc, "Prérequis");
      drawBulletList(doc, formation.prerequisites);

      drawSectionTitle(doc, "Modalités pédagogiques");
      drawBulletList(doc, formation.modalities);

      const programme = Array.isArray(formation.programme) ? formation.programme : [];
      if (programme.length) {
        drawSectionTitle(doc, "Programme détaillé");

        programme.forEach((day, dayIndex) => {
          doc.fillColor(NAVY).fontSize(11.5).font("Helvetica-Bold").text(`Jour ${dayIndex + 1} : ${day.title}`);
          doc.moveDown(0.35);

          (day.sequences || []).forEach((sequence) => {
            doc.fillColor(GREEN).fontSize(10).font("Helvetica-Bold").text(sequence.title);
            doc.moveDown(0.2);
            drawBulletList(doc, sequence.points);
          });

          doc.moveDown(0.3);
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateProgrammePdf,
};
