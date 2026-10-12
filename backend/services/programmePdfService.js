const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const BANNER_PATH = path.join(__dirname, "..", "assets", "banniere-programme.jpg");
const hasBanner = fs.existsSync(BANNER_PATH);

const NAVY = "#004d6d";
const BLUE = "#009cdc";
const GREEN = "#09cf65";
const MUTED = "#4d6a78";

const BANNER_RATIO = 620 / 2480;
const FOOTER_LINES = [
  "OXIDEVE – 39 av Jean François Champollion – 31100 TOULOUSE – contact@oxideve.com",
  "OXIDEVE : contact@oxideve.com – 06.36.44.55.93.",
  "Organisme de formation déclaré auprès du préfet de l'Occitanie n° 76 66 022 09 66.",
  "SIRET : 840 764 310 000 24 – APE : 8559A",
];

/**
 * Masque répété sur chaque page : bannière en haut, mentions légales en bas.
 * Les marges du document réservent la place, ce masque ne fait que dessiner.
 */
function drawPageFrame(doc) {
  // Le masque écrit du texte, ce qui peut déclencher un saut de page et donc
  // un nouvel appel : ce verrou empêche la récursion infinie.
  if (doc._frameLock) return;
  doc._frameLock = true;

  const pageWidth = doc.page.width;
  // Le masque dessine hors flux : on restaure le curseur pour ne pas décaler
  // le contenu de la page qui vient d'être ajoutée.
  const cursorX = doc.x;
  const cursorY = doc.y;

  if (hasBanner) {
    try {
      doc.image(BANNER_PATH, 0, 0, { width: pageWidth });
    } catch (error) {
      console.error("[programmePdfService] Bannière illisible, PDF généré sans bannière", error);
    }
  }

  const footerTop = doc.page.height - 74;
  doc
    .strokeColor(BLUE)
    .lineWidth(1)
    .moveTo(40, footerTop - 10)
    .lineTo(pageWidth - 40, footerTop - 10)
    .stroke();

  doc.fontSize(7).font("Helvetica").fillColor(MUTED);
  FOOTER_LINES.forEach((line, index) => {
    doc.text(line, 40, footerTop + index * 10, {
      width: pageWidth - 80,
      align: "center",
      lineBreak: false,
      height: 10,
    });
  });

  doc.x = cursorX;
  doc.y = cursorY;
  doc._frameLock = false;
}

/** Réserve l'espace du masque : le contenu démarre sous la bannière. */
function contentTop(doc) {
  return hasBanner ? doc.page.width * BANNER_RATIO + 26 : 56;
}

function sectionTitle(doc, title) {
  doc.moveDown(0.8);
  doc.fillColor(NAVY).fontSize(13).font("Helvetica-Bold").text(title);
  doc.moveDown(0.25);
  const y = doc.y;
  doc.strokeColor(GREEN).lineWidth(1.5).moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).stroke();
  doc.moveDown(0.6);
}

function paragraph(doc, text, options = {}) {
  if (!text) return;
  doc
    .fillColor(options.color || MUTED)
    .fontSize(options.size || 10)
    .font(options.font || "Helvetica")
    .text(text, { align: "left", lineGap: 2 });
  doc.moveDown(0.4);
}

function bulletList(doc, items) {
  if (!Array.isArray(items) || !items.length) return;

  items.forEach((item) => {
    doc.fillColor(MUTED).fontSize(10).font("Helvetica").text(`•  ${item}`, {
      indent: 8,
      lineGap: 2,
    });
  });
  doc.moveDown(0.4);
}

function factRow(doc, label, value) {
  if (!value) return;
  const left = doc.page.margins.left;
  const labelWidth = 120;
  const startY = doc.y;

  doc.fillColor(BLUE).fontSize(9.5).font("Helvetica-Bold").text(label.toUpperCase(), left, startY, { width: labelWidth });
  doc
    .fillColor(NAVY)
    .fontSize(10)
    .font("Helvetica")
    .text(value, left + labelWidth + 10, startY, {
      width: doc.page.width - doc.page.margins.right - left - labelWidth - 10,
      lineGap: 2,
    });

  doc.x = left;
  doc.moveDown(0.5);
}

function generateProgrammePdf(formation) {
  return new Promise((resolve, reject) => {
    const bannerHeight = hasBanner ? Math.round(595.28 * BANNER_RATIO) : 40;
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: bannerHeight + 26, bottom: 96, left: 48, right: 48 },
      info: { Title: `Programme - ${formation.title}`, Author: "Oxideve" },
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Le masque doit être dessiné sur la première page et sur chaque nouvelle page.
    drawPageFrame(doc);
    doc.on("pageAdded", () => drawPageFrame(doc));

    doc.x = doc.page.margins.left;
    doc.y = contentTop(doc);

    doc.fillColor(GREEN).fontSize(10).font("Helvetica-Bold").text(formation.category.toUpperCase());
    doc.moveDown(0.3);
    doc
      .fillColor(NAVY)
      .fontSize(20)
      .font("Helvetica-Bold")
      .text(formation.levelLabel ? `${formation.title} — ${formation.levelLabel}` : formation.title, { lineGap: 2 });
    doc.moveDown(0.5);

    paragraph(doc, formation.summary, { size: 10.5 });

    sectionTitle(doc, "Informations pratiques");
    factRow(doc, "Durée", formation.duration);
    factRow(doc, "Durée détaillée", formation.durationDetails);
    factRow(doc, "Public", formation.audience);
    factRow(doc, "Lieu", formation.location);
    factRow(doc, "Tarif", formation.cpfEligible ? `${formation.price} — Finançable CPF` : formation.price);
    factRow(doc, "Modalités tarif", formation.priceDetails);
    factRow(doc, "Taux de réussite", formation.successRate);
    factRow(doc, "Accessibilité", formation.handicapPolicy);

    if (formation.certification) {
      sectionTitle(doc, "Finalité");
      paragraph(doc, formation.certification);
    }

    sectionTitle(doc, "Présentation");
    paragraph(doc, formation.description);

    sectionTitle(doc, "Objectifs pédagogiques");
    bulletList(doc, formation.objectives);

    sectionTitle(doc, "Points forts");
    bulletList(doc, formation.benefits);

    sectionTitle(doc, "Prérequis");
    bulletList(doc, formation.prerequisites);

    sectionTitle(doc, "Modalités pédagogiques");
    bulletList(doc, formation.modalities);

    const programme = Array.isArray(formation.programme) ? formation.programme : [];
    if (programme.length) {
      sectionTitle(doc, "Programme détaillé");

      programme.forEach((day, dayIndex) => {
        doc.fillColor(NAVY).fontSize(11.5).font("Helvetica-Bold").text(`Jour ${dayIndex + 1} : ${day.title}`);
        doc.moveDown(0.35);

        (day.sequences || []).forEach((sequence) => {
          doc.fillColor(GREEN).fontSize(10).font("Helvetica-Bold").text(sequence.title);
          doc.moveDown(0.2);
          bulletList(doc, sequence.points);
        });

        doc.moveDown(0.3);
      });
    }

    doc.end();
  });
}

module.exports = {
  generateProgrammePdf,
};
