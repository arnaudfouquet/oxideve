const fs = require("fs");
const path = require("path");

const BANNER_PATH = path.join(__dirname, "..", "assets", "banniere-programme.jpg");
const hasBanner = fs.existsSync(BANNER_PATH);

const NAVY = "#004d6d";
const BLUE = "#009cdc";
const GREEN = "#09cf65";
const MUTED = "#4d6a78";

/** Hauteur de la bannière rapportée à sa largeur (2480 x 620). */
const BANNER_RATIO = 620 / 2480;
const A4_WIDTH = 595.28;
const BANNER_HEIGHT = Math.round(A4_WIDTH * BANNER_RATIO);

const FOOTER_LINES = [
  "OXIDEVE – 39 av Jean François Champollion – 31100 TOULOUSE – contact@oxideve.com",
  "OXIDEVE : contact@oxideve.com – 06.36.44.55.93.",
  "Organisme de formation déclaré auprès du préfet de l'Occitanie n° 76 66 022 09 66.",
  "SIRET : 840 764 310 000 24 – APE : 8559A",
];

/** Marges réservant la place du masque (bannière en haut, mentions en bas). */
const PAGE_MARGINS = {
  top: (hasBanner ? BANNER_HEIGHT : 40) + 26,
  bottom: 96,
  left: 48,
  right: 48,
};

/**
 * Masque répété sur chaque page : bannière Oxideve en haut, filet bleu et
 * mentions légales en bas. Dessine hors flux et restaure le curseur.
 */
function drawPageFrame(doc) {
  // Le pied de page écrit du texte, ce qui peut déclencher un saut de page et
  // donc un nouvel appel : ce verrou empêche la récursion infinie.
  if (doc._frameLock) return;
  doc._frameLock = true;

  const pageWidth = doc.page.width;
  const cursorX = doc.x;
  const cursorY = doc.y;

  if (hasBanner) {
    try {
      doc.image(BANNER_PATH, 0, 0, { width: pageWidth });
    } catch (error) {
      console.error("[pdfTheme] Bannière illisible, PDF généré sans bannière", error);
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

/** Applique le masque à la première page puis à chaque page ajoutée. */
function applyPageFrame(doc) {
  drawPageFrame(doc);
  doc.on("pageAdded", () => drawPageFrame(doc));
  doc.x = doc.page.margins.left;
  doc.y = contentTop(doc);
}

/** Ordonnée de départ du contenu, sous la bannière. */
function contentTop(doc) {
  return hasBanner ? doc.page.width * BANNER_RATIO + 26 : 56;
}

/** Titre de document : surtitre vert optionnel puis titre navy. */
function drawDocumentTitle(doc, title, eyebrow) {
  if (eyebrow) {
    doc.fillColor(GREEN).fontSize(10).font("Helvetica-Bold").text(eyebrow.toUpperCase());
    doc.moveDown(0.3);
  }

  doc.fillColor(NAVY).fontSize(20).font("Helvetica-Bold").text(title, { lineGap: 2 });
  doc.moveDown(0.4);
}

/** Titre de section navy souligné d'un filet vert. */
function drawSectionTitle(doc, title) {
  doc.moveDown(0.8);
  doc.fillColor(NAVY).fontSize(13).font("Helvetica-Bold").text(title);
  doc.moveDown(0.25);
  const y = doc.y;
  doc
    .strokeColor(GREEN)
    .lineWidth(1.5)
    .moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .stroke();
  doc.moveDown(0.6);
  doc.x = doc.page.margins.left;
}

/** Ligne label (bleu, capitales) / valeur (navy) sur deux colonnes. */
function drawFactRow(doc, label, value) {
  if (!value) return;

  const left = doc.page.margins.left;
  const labelWidth = 130;
  const startY = doc.y;

  doc.fillColor(BLUE).fontSize(9.5).font("Helvetica-Bold").text(label.toUpperCase(), left, startY, { width: labelWidth });
  doc
    .fillColor(NAVY)
    .fontSize(10)
    .font("Helvetica")
    .text(String(value), left + labelWidth + 10, startY, {
      width: doc.page.width - doc.page.margins.right - left - labelWidth - 10,
      lineGap: 2,
    });

  doc.x = left;
  doc.moveDown(0.5);
}

function drawParagraph(doc, text, options = {}) {
  if (!text) return;

  doc
    .fillColor(options.color || MUTED)
    .fontSize(options.size || 10)
    .font(options.font || "Helvetica")
    .text(text, { align: "left", lineGap: 2 });
  doc.moveDown(0.4);
}

function drawBulletList(doc, items) {
  if (!Array.isArray(items) || !items.length) return;

  items.forEach((item) => {
    doc.fillColor(MUTED).fontSize(10).font("Helvetica").text(`•  ${item}`, { indent: 8, lineGap: 2 });
  });
  doc.moveDown(0.4);
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

module.exports = {
  NAVY,
  BLUE,
  GREEN,
  MUTED,
  PAGE_MARGINS,
  applyPageFrame,
  contentTop,
  drawBulletList,
  drawDocumentTitle,
  drawFactRow,
  drawPageFrame,
  drawParagraph,
  drawSectionTitle,
  formatDate,
};
