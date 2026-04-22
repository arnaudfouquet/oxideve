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
        },
      });
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
          seatsLeft: session.seatsLeft,
          mode: session.mode,
        },
        update: {
          formationSlug: session.formationSlug,
          city: session.city,
          startDate: new Date(session.startDate),
          endDate: new Date(session.endDate),
          seatsLeft: session.seatsLeft,
          mode: session.mode,
        },
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