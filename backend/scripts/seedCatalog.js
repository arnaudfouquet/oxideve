const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

async function main() {
  loadDotEnv(path.join(__dirname, "..", "..", ".env"));

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed the catalog");
  }

  const prisma = new PrismaClient();
  const catalogPath = path.join(__dirname, "..", "..", "shared", "catalog-data.json");
  const { formations, sessions } = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

  try {
    for (const formation of formations) {
      await prisma.formation.upsert({
        where: { slug: formation.slug },
        create: {
          id: formation.id,
          slug: formation.slug,
          title: formation.title,
          shortTitle: formation.shortTitle,
          category: formation.category,
          duration: formation.duration,
          durationDetails: formation.durationDetails,
          location: formation.location,
          audience: formation.audience,
          summary: formation.summary,
          description: formation.description,
          benefits: formation.benefits,
          objectives: formation.objectives,
          prerequisites: formation.prerequisites,
          modalities: formation.modalities,
          programme: formation.programme,
          certification: formation.certification,
          price: formation.price,
          priceDetails: formation.priceDetails,
          successRate: formation.successRate,
          handicapPolicy: formation.handicapPolicy,
          seoTitle: formation.seoTitle,
          seoDescription: formation.seoDescription,
          videoUrl: formation.videoUrl || null,
          rgeBadge: formation.rgeBadge || null,
          partnerLogos: formation.partnerLogos || null,
          priceMemberLabel: formation.priceMemberLabel || null,
          priceMember: formation.priceMember || null,
          memberProgram: formation.memberProgram || null,
          faq: formation.faq || null,
          stats: formation.stats || null,
          gallery: formation.gallery || null,
          relatedSlugs: formation.relatedSlugs || null,
          levelLabel: formation.levelLabel || null,
          subCategory: formation.subCategory || null,
          cpfEligible: Boolean(formation.cpfEligible),
          // Cadrage de bannière : posé à la création seulement, pour ne pas
          // écraser les réglages faits dans l'admin à chaque déploiement.
          bannerImage: formation.bannerImage || null,
          bannerPosition: formation.bannerPosition || null,
          tilePosition: formation.tilePosition || null,
        },
        update: {
          title: formation.title,
          shortTitle: formation.shortTitle,
          category: formation.category,
          duration: formation.duration,
          durationDetails: formation.durationDetails,
          location: formation.location,
          audience: formation.audience,
          summary: formation.summary,
          description: formation.description,
          benefits: formation.benefits,
          objectives: formation.objectives,
          prerequisites: formation.prerequisites,
          modalities: formation.modalities,
          programme: formation.programme,
          certification: formation.certification,
          price: formation.price,
          priceDetails: formation.priceDetails,
          successRate: formation.successRate,
          handicapPolicy: formation.handicapPolicy,
          seoTitle: formation.seoTitle,
          seoDescription: formation.seoDescription,
          videoUrl: formation.videoUrl || null,
          rgeBadge: formation.rgeBadge || null,
          partnerLogos: formation.partnerLogos || null,
          priceMemberLabel: formation.priceMemberLabel || null,
          priceMember: formation.priceMember || null,
          memberProgram: formation.memberProgram || null,
          faq: formation.faq || null,
          stats: formation.stats || null,
          gallery: formation.gallery || null,
          relatedSlugs: formation.relatedSlugs || null,
          levelLabel: formation.levelLabel || null,
          subCategory: formation.subCategory || null,
          cpfEligible: Boolean(formation.cpfEligible),
        },
      });
    }

    const currentSlugs = formations.map((formation) => formation.slug);
    const removedFormations = await prisma.formation.deleteMany({
      where: { slug: { notIn: currentSlugs } },
    });

    if (removedFormations.count > 0) {
      console.log(`Removed ${removedFormations.count} formation(s) no longer present in the catalog.`);
    }

    for (const session of sessions) {
      await prisma.session.upsert({
        where: { id: session.id },
        create: {
          id: session.id,
          formationSlug: session.formationSlug,
          city: session.city,
          startDate: new Date(session.startDate),
          endDate: new Date(session.endDate),
          mode: session.mode,
          // Marque d'origine : permet de distinguer les sessions issues du
          // catalogue de celles créées dans l'admin.
          source: "catalog",
        },
        update: {
          formationSlug: session.formationSlug,
          city: session.city,
          startDate: new Date(session.startDate),
          endDate: new Date(session.endDate),
          mode: session.mode,
          source: "catalog",
        },
      });
    }

    /*
     * Sessions fantômes : créées par une exécution précédente du catalogue,
     * puis retirées du fichier. Elles restaient affichées sur le site alors
     * qu'elles n'existaient plus, et toute inscription sur l'une d'elles
     * échouait. On ne supprime que celles portant la marque "catalog" ou
     * l'ancien format d'identifiant (`...-1`, `...-2`), jamais une session
     * saisie dans l'admin.
     */
    const currentSessionIds = sessions.map((session) => session.id);
    const obsoletes = await prisma.session.findMany({
      where: {
        id: { notIn: currentSessionIds },
        OR: [{ source: "catalog" }, { id: { endsWith: "-1" } }, { id: { endsWith: "-2" } }, { id: { endsWith: "-3" } }],
      },
      select: { id: true, startDate: true, city: true },
    });

    if (obsoletes.length) {
      // Les inscriptions liées sont conservées : la relation est en
      // onDelete: SetNull, leur session passe simplement à « non planifiée ».
      await prisma.session.deleteMany({ where: { id: { in: obsoletes.map((item) => item.id) } } });
      console.log(`Removed ${obsoletes.length} obsolete session(s) no longer present in the catalog:`);
      obsoletes.slice(0, 10).forEach((item) => {
        console.log(`  - ${item.startDate.toISOString().slice(0, 10)} ${item.city}`);
      });
    }

    console.log(`Seeded ${formations.length} formations and ${sessions.length} sessions.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Catalog seed failed", error);
  process.exit(1);
});