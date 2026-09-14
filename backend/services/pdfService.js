const PDFDocument = require("pdfkit");

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

      doc.fillColor("#004d6d").fontSize(20).font("Helvetica-Bold").text("Bulletin d'inscription", { align: "left" });
      doc.fillColor("#4d6a78").fontSize(10).font("Helvetica").text("Oxideve - Organisme de formation professionnelle");
      doc.moveDown(0.3);
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

      drawSectionTitle(doc, "Apprenant");
      drawField(doc, "Nom", bulletin.learnerFullName);
      drawField(doc, "Fonction", bulletin.learnerRole);
      drawField(doc, "Téléphone", bulletin.learnerPhone);
      drawField(doc, "Date de naissance", bulletin.learnerBirthDate ? formatDate(bulletin.learnerBirthDate) : null);
      drawField(doc, "Situation de handicap", bulletin.hasDisability ? "Oui" : "Non");

      if (bulletin.hasDisability && bulletin.disabilityDetails) {
        doc.moveDown(0.3);
        doc.font("Helvetica-Bold").text("Précisions : ", { continued: true }).font("Helvetica").text(bulletin.disabilityDetails);
      }

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

module.exports = {
  generateBulletinPdf,
};
