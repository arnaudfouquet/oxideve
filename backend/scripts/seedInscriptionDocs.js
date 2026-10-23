/**
 * Documents de demonstration pour les dossiers d'inscription.
 *
 * Genere de vrais PDF a la charte Oxideve, lisibles mais sans valeur legale,
 * afin de montrer le fonctionnement aux futurs administrateurs. Le contenu
 * est volontairement marque "exemple".
 *
 * En production le script ne s'execute que sur autorisation explicite,
 * `SEED_DEMO_DOCS=true`, pour alimenter une preproduction sans risquer de
 * deposer des documents fictifs sur le site reel.
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

  // Documents propres a une formation : ils illustrent le regroupement et ne
  // s'affichent que dans le dossier de la formation concernee.
  {
    fichier: "exemple-materiel-qualipac.pdf",
    label: "La liste du matériel à apporter",
    description: "équipement personnel pour les travaux pratiques",
    formationMatch: /qualipac/i,
    titre: "Matériel à apporter",
    surtitre: "QualiPAC — document d'exemple",
    intro: "Les travaux pratiques se déroulent sur plateau technique : prévoyez l'équipement suivant.",
    sections: [
      {
        titre: "Équipement personnel",
        points: [
          "Chaussures de sécurité",
          "Vêtements de travail",
          "Gants de manutention",
          "Calculatrice et de quoi noter",
        ],
      },
    ],
  },
  {
    fichier: "exemple-prerequis-irve.pdf",
    label: "Les prérequis techniques",
    description: "connaissances attendues avant la session",
    formationMatch: /irve-niveau-p2/i,
    titre: "Prérequis techniques IRVE P2",
    surtitre: "IRVE P2 — document d'exemple",
    intro: "Le niveau P2 suppose des acquis sur lesquels la formation s'appuie dès la première journée.",
    sections: [
      {
        titre: "Acquis attendus",
        points: [
          "Avoir suivi la formation IRVE de niveau P1",
          "Maîtriser la conception des installations électriques",
          "Connaître les réseaux et l'environnement informatique",
        ],
      },
    ],
  },
  {
    fichier: "exemple-attestation-fluides.pdf",
    label: "L'attestation d'expérience fluides",
    description: "à faire remplir par l'employeur",
    formationMatch: /fluides-frigorigenes-categorie-1/i,
    titre: "Attestation d'expérience",
    surtitre: "Fluides frigorigènes — document d'exemple",
    intro:
      "L'attestation d'aptitude catégorie 1 exige une expérience pratique sur les systèmes frigorifiques.",
    sections: [
      {
        titre: "À renseigner",
        points: [
          "Nature des interventions réalisées",
          "Durée de l'expérience sur systèmes frigorifiques",
          "Cachet de l'entreprise et signature",
        ],
      },
    ],
  },
  {
    fichier: "exemple-consignes-hauteur.pdf",
    label: "Les consignes de sécurité en hauteur",
    description: "à lire impérativement avant la session",
    formationMatch: /travail-en-hauteur|hauteur/i,
    titre: "Consignes de sécurité",
    surtitre: "Travail en hauteur — document d'exemple",
    intro: "La formation comporte des exercices pratiques en hauteur, encadrés par ces consignes.",
    sections: [
      {
        titre: "Avant la session",
        points: [
          "Signaler toute contre-indication médicale",
          "Prévoir une tenue permettant le port du harnais",
          "Ne pas porter de bijoux ni d'écharpe",
        ],
      },
    ],
  },
  {
    fichier: "exemple-fiche-aptitude-hauteur.pdf",
    label: "La fiche d'aptitude médicale",
    description: "délivrée par la médecine du travail",
    formationMatch: /travail-en-hauteur|hauteur/i,
    titre: "Fiche d'aptitude médicale",
    surtitre: "Travail en hauteur — document d'exemple",
    intro: "Le travail en hauteur requiert une aptitude médicale en cours de validité.",
    sections: [
      {
        titre: "À fournir",
        points: [
          "Avis d'aptitude de moins de vingt-quatre mois",
          "Mention explicite du travail en hauteur",
          "Copie à remettre le jour de la session",
        ],
      },
    ],
  },
  {
    fichier: "exemple-dossier-technique-qualipac.pdf",
    label: "Le dossier technique à préparer",
    description: "chantier de référence pour la qualification",
    formationMatch: /qualipac/i,
    titre: "Dossier technique",
    surtitre: "QualiPAC — document d'exemple",
    intro:
      "La qualification QualiPAC demande une référence de chantier : ce document en précise les attendus.",
    sections: [
      {
        titre: "Contenu attendu",
        points: [
          "Étude de dimensionnement de l'installation",
          "Photographies avant et après travaux",
          "Procès-verbal de mise en service",
          "Attestation de bonne fin signée du client",
        ],
      },
    ],
  },
  {
    fichier: "exemple-schemas-irve.pdf",
    label: "Les schémas de raccordement",
    description: "support technique remis en séance",
    formationMatch: /irve-niveau-p2/i,
    titre: "Schémas de raccordement",
    surtitre: "IRVE P2 — document d'exemple",
    intro: "Les architectures de recharge de puissance supérieure étudiées pendant la formation.",
    sections: [
      {
        titre: "Cas traités",
        points: [
          "Raccordement en courant alternatif triphasé",
          "Supervision de plusieurs points de charge",
          "Gestion dynamique de la puissance disponible",
        ],
      },
    ],
  },
  {
    fichier: "exemple-etude-cas-photovoltaique.pdf",
    label: "L'étude de cas à préparer",
    description: "à apporter le premier jour",
    formationMatch: /qualipv-36/i,
    titre: "Étude de cas",
    surtitre: "QualiPV — document d'exemple",
    intro: "La formation s'appuie sur un projet réel que chaque participant apporte.",
    sections: [
      {
        titre: "Éléments à réunir",
        points: [
          "Plan de toiture avec orientation et inclinaison",
          "Relevé de consommation annuelle",
          "Caractéristiques du raccordement existant",
        ],
      },
    ],
  },
  {
    fichier: "exemple-fiche-poste-sst.pdf",
    label: "La fiche de poste du participant",
    description: "contexte d'intervention du salarié",
    formationMatch: /sauveteur|sst/i,
    titre: "Fiche de poste",
    surtitre: "SST — document d'exemple",
    intro:
      "Les mises en situation sont adaptées aux risques réels du poste occupé par chaque participant.",
    sections: [
      {
        titre: "À décrire",
        points: [
          "Nature de l'activité et environnement de travail",
          "Risques principaux identifiés au poste",
          "Équipements de secours présents sur site",
        ],
      },
    ],
  },
  {
    fichier: "exemple-attestation-formation-bureautique.pdf",
    label: "Le questionnaire de niveau",
    description: "à remplir avant la session",
    formationMatch: /excel/i,
    titre: "Questionnaire de niveau",
    surtitre: "Bureautique — document d'exemple",
    intro: "Ce questionnaire permet de constituer des groupes homogènes et d'adapter le rythme.",
    sections: [
      {
        titre: "Points évalués",
        points: [
          "Aisance avec les formules de calcul",
          "Usage des tableaux croisés dynamiques",
          "Mise en forme et impression",
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
  if (process.env.NODE_ENV === "production" && process.env.SEED_DEMO_DOCS !== "true") {
    console.error(
      "[seedInscriptionDocs] Refus : en production, relancez avec SEED_DEMO_DOCS=true pour confirmer " +
        "le dépôt de documents d'exemple (ils portent la mention « aucune valeur contractuelle »).",
    );
    process.exitCode = 1;
    return;
  }

  if (process.env.NODE_ENV === "production") {
    console.warn("[seedInscriptionDocs] Dépôt de documents d'exemple sur un environnement de production.");
  }

  const prisma = getPrismaClient();

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  // Les documents propres a une formation la designent par un motif : on le
  // resout ici, pour ne pas figer des slugs qui pourraient changer.
  const formations = await prisma.formation.findMany({ select: { slug: true } });

  let crees = 0;
  let ignores = 0;

  for (const [index, modele] of DOCUMENTS.entries()) {
    const existant = await prisma.inscriptionDocument.findFirst({ where: { label: modele.label } });

    if (existant) {
      ignores++;
      continue;
    }

    let formationSlug = null;

    if (modele.formationMatch) {
      const trouvee = formations.find((item) => modele.formationMatch.test(item.slug));

      if (!trouvee) {
        console.warn(`[seedInscriptionDocs] Aucune formation pour « ${modele.label} », document ignoré.`);
        ignores++;
        continue;
      }

      formationSlug = trouvee.slug;
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
        formationSlug,
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
