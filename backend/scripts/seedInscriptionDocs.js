/**
 * Documents de demonstration pour les dossiers d'inscription.
 *
 * Genere de vrais PDF a la charte Oxideve, lisibles mais sans valeur legale,
 * afin de montrer le fonctionnement aux futurs administrateurs. Le contenu
 * est volontairement marque "exemple".
 *
 * A n'utiliser qu'en developpement : le script refuse de s'executer en
 * production.
 */
const fs = require("fs");
const path = require("path");

const { loadDotEnv } = require("./loadDotEnv");

loadDotEnv();

const PDFDocument = require("pdfkit");

const { getPrismaClient } = require("../services/prismaClient");
const {
  NAVY,
  GREEN,
  MUTED,
  PAGE_MARGINS,
  applyPageFrame,
  drawBulletList,
  drawDocumentTitle,
  drawParagraph,
  drawSectionTitle,
} = require("../services/pdfTheme");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "documents");

/** Les six documents cites dans le modele de message. */
const DOCUMENTS = [
  {
    fichier: "exemple-devis.pdf",
    label: "Le devis à signer",
    description: "à signer et à nous retourner par mail",
    titre: "Devis de formation",
    surtitre: "Document d'exemple",
    intro:
      "Ce devis récapitule le coût de la formation et les modalités de règlement. Il doit nous être retourné signé pour valider l'inscription.",
    sections: [
      {
        titre: "Récapitulatif",
        points: [
          "Intitulé de la formation et dates retenues",
          "Nombre de participants inscrits",
          "Montant hors taxes, TVA non applicable (article 261B du CGI)",
          "Conditions de règlement et délai de rétractation",
        ],
      },
      {
        titre: "À faire",
        points: [
          "Vérifier les coordonnées de facturation",
          "Apposer la mention « bon pour accord », dater et signer",
          "Nous retourner le document par mail à contact@oxideve.com",
        ],
      },
    ],
  },
  {
    fichier: "exemple-attestation-securite-electrique.pdf",
    label: "L'attestation de sécurité électrique",
    description: "à compléter par l'employeur",
    titre: "Attestation de sécurité électrique",
    surtitre: "Document d'exemple",
    intro:
      "Cette attestation confirme que le participant dispose des connaissances électriques requises pour suivre la formation en sécurité.",
    sections: [
      {
        titre: "Renseignements attendus",
        points: [
          "Identité du participant et fonction occupée",
          "Niveau d'habilitation électrique détenu, le cas échéant",
          "Expérience pratique sur installations électriques",
          "Cachet de l'entreprise et signature du responsable",
        ],
      },
      {
        titre: "Pourquoi ce document",
        points: [
          "Il conditionne l'accès aux travaux pratiques",
          "Il est demandé lors des audits de qualification",
        ],
      },
    ],
  },
  {
    fichier: "exemple-etapes-agrement-rge.pdf",
    label: "Les différentes étapes d'agrément RGE",
    description: "parcours complet de la qualification",
    titre: "Les étapes de l'agrément RGE",
    surtitre: "Document d'exemple",
    intro:
      "La qualification RGE se déroule en plusieurs étapes, de la formation initiale à l'audit de chantier. Ce document en présente le déroulé.",
    sections: [
      {
        titre: "Avant la formation",
        points: [
          "Vérifier l'éligibilité de l'entreprise",
          "Constituer le dossier administratif",
          "Choisir la qualification visée (QualiPV, QualiPAC, Recharge+ elec...)",
        ],
      },
      {
        titre: "Après la formation",
        points: [
          "Déposer le dossier auprès de l'organisme qualificateur",
          "Fournir une première référence de chantier",
          "Recevoir l'audit de contrôle dans les deux ans",
          "Renouveler la qualification tous les quatre ans",
        ],
      },
    ],
  },
  {
    fichier: "exemple-demande-prise-en-charge.pdf",
    label: "La demande de prise en charge financière",
    description: "à transmettre à votre OPCO",
    titre: "Demande de prise en charge",
    surtitre: "Document d'exemple",
    intro:
      "Ce formulaire permet de solliciter le financement de la formation auprès de votre opérateur de compétences.",
    sections: [
      {
        titre: "Pièces à joindre",
        points: [
          "Le devis signé",
          "Le programme détaillé de la formation",
          "Le numéro de déclaration d'activité de l'organisme",
          "Le relevé d'identité bancaire de l'entreprise",
        ],
      },
      {
        titre: "Délais à prévoir",
        points: [
          "Déposer la demande au moins trois semaines avant la session",
          "L'accord de prise en charge est transmis sous dix jours ouvrés",
          "Notre équipe vous accompagne dans ces démarches",
        ],
      },
    ],
  },
  {
    fichier: "exemple-reglement-interieur.pdf",
    label: "Le règlement intérieur",
    description: "à lire avant le début de la formation",
    titre: "Règlement intérieur",
    surtitre: "Document d'exemple",
    intro:
      "Ce règlement s'applique à toute personne participant à une formation Oxideve, dans nos locaux comme en entreprise.",
    sections: [
      {
        titre: "Règles principales",
        points: [
          "Horaires et modalités d'émargement",
          "Consignes de sécurité et équipements de protection",
          "Usage des équipements et des supports pédagogiques",
          "Procédure en cas d'absence ou de retard",
        ],
      },
    ],
  },
  {
    fichier: "exemple-plan-acces-montpellier.pdf",
    label: "Le plan d'accès au centre",
    description: "Montpellier — transports et stationnement",
    titre: "Plan d'accès",
    surtitre: "Document d'exemple",
    intro: "Informations pratiques pour rejoindre le centre de formation le jour de la session.",
    sections: [
      {
        titre: "Venir au centre",
        points: [
          "Accès en tramway : arrêt le plus proche à cinq minutes à pied",
          "Stationnement gratuit sur le parking visiteurs",
          "Accueil à partir de 8 h 30, la formation débute à 9 h 00",
        ],
      },
      {
        titre: "Sur place",
        points: [
          "Salle équipée et plateau technique",
          "Restauration à proximité immédiate",
          "Local accessible aux personnes à mobilité réduite",
        ],
      },
    ],
  },
];

function genererPdf(modele) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: PAGE_MARGINS,
      info: { Title: modele.titre, Author: "Oxideve" },
    });

    const morceaux = [];
    doc.on("data", (c) => morceaux.push(c));
    doc.on("end", () => resolve(Buffer.concat(morceaux)));
    doc.on("error", reject);

    applyPageFrame(doc);

    drawDocumentTitle(doc, modele.titre, modele.surtitre);
    drawParagraph(doc, modele.intro, { size: 10.5 });

    for (const section of modele.sections) {
      drawSectionTitle(doc, section.titre);
      drawBulletList(doc, section.points);
    }

    drawSectionTitle(doc, "Avertissement");
    drawParagraph(
      doc,
      "Ce document est un exemple destiné à la démonstration de l'espace d'administration. " +
        "Il ne possède aucune valeur contractuelle et doit être remplacé par le document réel.",
      { color: MUTED },
    );

    doc.end();
  });
}

async function run() {
  if (process.env.NODE_ENV === "production") {
    console.error("[seedInscriptionDocs] Refus : ce script est réservé au développement.");
    process.exitCode = 1;
    return;
  }

  const prisma = getPrismaClient();

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  let crees = 0;
  let ignores = 0;

  for (const [index, modele] of DOCUMENTS.entries()) {
    const existant = await prisma.inscriptionDocument.findFirst({ where: { label: modele.label } });

    if (existant) {
      ignores++;
      continue;
    }

    const buffer = await genererPdf(modele);
    const chemin = path.join(UPLOAD_DIR, modele.fichier);
    fs.writeFileSync(chemin, buffer);

    await prisma.inscriptionDocument.create({
      data: {
        label: modele.label,
        description: modele.description,
        fileUrl: `/uploads/documents/${modele.fichier}`,
        fileName: modele.fichier,
        fileSize: buffer.length,
        formationSlug: null,
        position: index,
        published: true,
      },
    });

    crees++;
  }

  const total = await prisma.inscriptionDocument.count();

  console.log(`[seedInscriptionDocs] ${crees} document(s) créé(s), ${ignores} déjà présent(s).`);
  console.log(`[seedInscriptionDocs] Total en base : ${total} document(s).`);
}

run()
  .catch((error) => {
    console.error("[seedInscriptionDocs] Échec", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await getPrismaClient().$disconnect();
  });
