const fs = require("fs");
const path = require("path");
const { randomBytes } = require("crypto");

const { getPrismaClient } = require("./prismaClient");

/**
 * Dossiers d'inscription : documents joints, modele de message et pages
 * partagees avec les prospects.
 */

/** Texte par defaut, utilise tant qu'aucun modele n'a ete enregistre. */
const DEFAULT_TEMPLATE = {
  subject: "Dossier d'inscription — {{formation}}",
  body: `Bonjour,

Veuillez trouver le dossier d'inscription concernant la formation {{formation}} qui se tiendra à {{ville}} du {{dates}}.

Il comprend :

- Le bulletin d'inscription à remplir en ligne
- Le devis à signer et à nous renvoyer
- L'attestation de sécurité électrique
- Les différentes étapes d'agrément RGE
- La demande de prise en charge financière
- Le programme détaillé

Tous ces documents sont réunis ici :
{{lien_dossier}}

Restant à votre disposition,

L'équipe Oxideve
contact@oxideve.com — 06.36.44.55.93`,
};

function normalizeDocument(document) {
  return {
    id: document.id,
    label: document.label,
    description: document.description || "",
    fileUrl: document.fileUrl,
    fileName: document.fileName,
    fileSize: document.fileSize || 0,
    formationSlug: document.formationSlug || "",
    position: document.position || 0,
    published: document.published !== false,
  };
}

/** Tous les documents, communs d'abord puis specifiques. */
async function listDocuments() {
  const prisma = getPrismaClient();
  const documents = await prisma.inscriptionDocument.findMany({
    orderBy: [{ formationSlug: "asc" }, { position: "asc" }, { createdAt: "asc" }],
  });

  return documents.map(normalizeDocument);
}

/**
 * Documents a montrer dans un dossier : les communs, plus ceux de la
 * formation concernee. Les documents depublies sont ecartes.
 */
async function listDocumentsForFormation(formationSlug) {
  const prisma = getPrismaClient();
  const documents = await prisma.inscriptionDocument.findMany({
    where: {
      published: true,
      OR: [{ formationSlug: null }, { formationSlug: "" }, { formationSlug }],
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  return documents.map(normalizeDocument);
}

async function createDocument(payload) {
  const prisma = getPrismaClient();
  const document = await prisma.inscriptionDocument.create({
    data: {
      label: payload.label,
      description: payload.description || null,
      fileUrl: payload.fileUrl,
      fileName: payload.fileName,
      fileSize: payload.fileSize || 0,
      formationSlug: payload.formationSlug || null,
      position: payload.position || 0,
      published: payload.published !== false,
    },
  });

  return normalizeDocument(document);
}

/**
 * Supprime le fichier du disque. Sans incidence s'il a deja disparu : la
 * ligne en base reste la reference, un fichier orphelin ne doit pas faire
 * echouer l'operation.
 */
function removeFileFromDisk(fileUrl) {
  if (!fileUrl) return;

  const nom = path.basename(fileUrl);
  const chemin = path.join(__dirname, "..", "uploads", "documents", nom);

  try {
    if (fs.existsSync(chemin)) fs.unlinkSync(chemin);
  } catch (error) {
    console.error(`[inscriptionFolder] Fichier non supprimé : ${nom}`, error.message);
  }
}

async function updateDocument(id, payload) {
  const prisma = getPrismaClient();
  const data = {};

  for (const champ of ["label", "description", "formationSlug"]) {
    if (payload[champ] !== undefined) data[champ] = payload[champ] || null;
  }

  if (payload.position !== undefined) data.position = payload.position;
  if (payload.published !== undefined) data.published = payload.published;

  // Remplacement du fichier : on ecrase les references puis on efface
  // l'ancien, une fois la base a jour pour ne pas perdre le nouveau en cas
  // d'echec.
  let ancien = null;

  if (payload.fileUrl) {
    const actuel = await prisma.inscriptionDocument.findUnique({ where: { id } });
    ancien = actuel && actuel.fileUrl !== payload.fileUrl ? actuel.fileUrl : null;

    data.fileUrl = payload.fileUrl;
    data.fileName = payload.fileName;
    data.fileSize = payload.fileSize || 0;
  }

  const document = await prisma.inscriptionDocument.update({ where: { id }, data });

  if (ancien) removeFileFromDisk(ancien);

  return normalizeDocument(document);
}

async function deleteDocument(id) {
  const prisma = getPrismaClient();
  const document = await prisma.inscriptionDocument.findUnique({ where: { id } });

  await prisma.inscriptionDocument.delete({ where: { id } });

  // Le fichier n'a plus de raison d'occuper le disque.
  if (document) removeFileFromDisk(document.fileUrl);
}

/** Modele propre a la formation, a defaut le modele general, a defaut le texte livre. */
async function getTemplate(formationSlug) {
  const prisma = getPrismaClient();

  if (formationSlug) {
    const propre = await prisma.inscriptionTemplate.findUnique({ where: { formationSlug } });
    if (propre) return { subject: propre.subject, body: propre.body, formationSlug, custom: true };
  }

  const general = await prisma.inscriptionTemplate.findFirst({ where: { formationSlug: null } });

  if (general) return { subject: general.subject, body: general.body, formationSlug: "", custom: true };

  return { ...DEFAULT_TEMPLATE, formationSlug: "", custom: false };
}

async function listTemplates() {
  const prisma = getPrismaClient();
  const modeles = await prisma.inscriptionTemplate.findMany({ orderBy: { formationSlug: "asc" } });

  return modeles.map((modele) => ({
    id: modele.id,
    subject: modele.subject,
    body: modele.body,
    formationSlug: modele.formationSlug || "",
  }));
}

async function saveTemplate({ formationSlug, subject, body }) {
  const prisma = getPrismaClient();
  const cle = formationSlug || null;

  const existant = cle
    ? await prisma.inscriptionTemplate.findUnique({ where: { formationSlug: cle } })
    : await prisma.inscriptionTemplate.findFirst({ where: { formationSlug: null } });

  if (existant) {
    const modele = await prisma.inscriptionTemplate.update({
      where: { id: existant.id },
      data: { subject, body },
    });
    return { id: modele.id, subject: modele.subject, body: modele.body, formationSlug: cle || "" };
  }

  const modele = await prisma.inscriptionTemplate.create({
    data: { subject, body, formationSlug: cle },
  });

  return { id: modele.id, subject: modele.subject, body: modele.body, formationSlug: cle || "" };
}

async function deleteTemplate(id) {
  const prisma = getPrismaClient();
  await prisma.inscriptionTemplate.delete({ where: { id } });
}

/** Jeton d'adresse : court a recopier, assez long pour ne pas se deviner. */
function buildToken() {
  return randomBytes(9).toString("base64url");
}

/**
 * Un dossier par inscription : on reutilise celui qui existe deja plutot que
 * d'en creer un nouveau a chaque envoi, sinon les anciens liens cessent de
 * correspondre a ce que le prospect a recu.
 */
async function getOrCreateFolder(payload) {
  const prisma = getPrismaClient();

  const existant = await prisma.inscriptionFolder.findFirst({
    where: { registrationId: payload.registrationId },
    orderBy: { createdAt: "desc" },
  });

  if (existant) return existant;

  return prisma.inscriptionFolder.create({
    data: {
      token: buildToken(),
      registrationId: payload.registrationId,
      formationSlug: payload.formationSlug,
      companyName: payload.companyName || null,
      contactName: payload.contactName || null,
      contactEmail: payload.contactEmail || null,
      contactPhone: payload.contactPhone || null,
      sessionId: payload.sessionId || null,
    },
  });
}

/** Lecture publique : enregistre la consultation au passage. */
async function getFolderByToken(token, { trackView = false } = {}) {
  const prisma = getPrismaClient();
  const dossier = await prisma.inscriptionFolder.findUnique({ where: { token } });

  if (!dossier) return null;

  if (trackView) {
    const maintenant = new Date();
    await prisma.inscriptionFolder.update({
      where: { id: dossier.id },
      data: {
        firstViewedAt: dossier.firstViewedAt || maintenant,
        lastViewedAt: maintenant,
        viewCount: dossier.viewCount + 1,
      },
    });
  }

  return dossier;
}

/** Consultations des dossiers, pour les afficher dans la liste des inscriptions. */
async function listFoldersByRegistrations(registrationIds) {
  if (!Array.isArray(registrationIds) || !registrationIds.length) return [];

  const prisma = getPrismaClient();
  const dossiers = await prisma.inscriptionFolder.findMany({
    where: { registrationId: { in: registrationIds } },
  });

  return dossiers.map((dossier) => ({
    registrationId: dossier.registrationId,
    token: dossier.token,
    firstViewedAt: dossier.firstViewedAt ? dossier.firstViewedAt.toISOString() : null,
    viewCount: dossier.viewCount,
  }));
}

module.exports = {
  DEFAULT_TEMPLATE,
  createDocument,
  deleteDocument,
  deleteTemplate,
  getFolderByToken,
  getOrCreateFolder,
  getTemplate,
  listDocuments,
  listDocumentsForFormation,
  listFoldersByRegistrations,
  listTemplates,
  saveTemplate,
  updateDocument,
};
