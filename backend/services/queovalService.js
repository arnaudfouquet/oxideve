const { getPrismaClient } = require("./prismaClient");

const QUEOVAL_API_BASE = "https://api.applimetier.com/web.API.auth";

// États "Etat_PRO" à synchroniser ; les stages annulés (5) sont ignorés.
const SYNCED_STATES = new Set(["2", "3"]);

function getQueovalHeaders() {
  const bearer = process.env.QUEOVAL_API_TOKEN;

  if (!bearer) {
    throw new Error("Identifiant Queoval manquant : renseignez QUEOVAL_API_TOKEN dans .env");
  }

  return {
    Authorization: `Bearer ${bearer}`,
    Accept: "application/json",
  };
}

async function queovalGet(path, params) {
  const headers = getQueovalHeaders();
  const url = new URL(`${QUEOVAL_API_BASE}${path}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new Error(`Appel Queoval échoué (statut ${response.status}) sur ${path} : ${bodyText.slice(0, 500)}`);
  }

  const payload = await response.json();

  if (payload.HasError) {
    throw new Error(`Erreur Queoval sur ${path} : ${payload.ErrorMessage || "inconnue"}`);
  }

  return payload.Value || [];
}

function extractCity(villeADR) {
  if (!villeADR) {
    return null;
  }

  const parts = villeADR.split(",");
  return (parts[1] || parts[0] || "").trim();
}

async function fetchStageDetails(externalId) {
  const [sessions, addresses] = await Promise.all([
    queovalGet(`/STAGE/sessions/${externalId}`, {
      select: "Info_PRO,datedEVE,datefEVE,Etat_PRO",
      orderby: "datedEVE",
      fetch: "200",
    }),
    queovalGet(`/STAGE/adresse/${externalId}`, {
      select: "DenomADR,villeADR",
      fetch: "1",
    }),
  ]);

  if (!sessions.length) {
    return null;
  }

  const title = sessions[0].Info_PRO;
  const state = sessions[0].Etat_PRO;
  const startDate = sessions[0].datedEVE;
  const endDate = sessions[sessions.length - 1].datefEVE;
  const city = extractCity(addresses[0]?.villeADR);

  return { externalId, title, state, startDate, endDate, city };
}

async function fetchUpcomingStages(externalIds) {
  const stages = [];

  for (const externalId of externalIds) {
    const details = await fetchStageDetails(externalId);

    if (details && SYNCED_STATES.has(details.state)) {
      stages.push(details);
    }
  }

  return stages;
}

function normalizeTitleForMatching(title) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titleSimilarityScore(a, b) {
  const wordsA = new Set(normalizeTitleForMatching(a).split(" ").filter((word) => word.length > 2));
  const wordsB = new Set(normalizeTitleForMatching(b).split(" ").filter((word) => word.length > 2));

  if (wordsA.size === 0 || wordsB.size === 0) {
    return 0;
  }

  let shared = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) {
      shared += 1;
    }
  }

  return shared / Math.max(wordsA.size, wordsB.size);
}

const MATCH_THRESHOLD = 0.5;

function findBestFormationMatch(stageTitle, formations) {
  let best = null;
  let bestScore = 0;

  for (const formation of formations) {
    const score = titleSimilarityScore(stageTitle, formation.title);

    if (score > bestScore) {
      bestScore = score;
      best = formation;
    }
  }

  return bestScore >= MATCH_THRESHOLD ? best : null;
}

async function syncQueovalCalendar(externalIds) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Base de données indisponible : DATABASE_URL non configuré");
  }

  if (!Array.isArray(externalIds) || !externalIds.length) {
    throw new Error("Aucun identifiant de stage Queoval fourni");
  }

  const stages = await fetchUpcomingStages(externalIds);
  const formations = await prisma.formation.findMany({ select: { slug: true, title: true } });

  const summary = {
    matched: 0,
    pending: 0,
    total: stages.length,
  };

  for (const stage of stages) {
    const match = findBestFormationMatch(stage.title, formations);

    if (!match) {
      await prisma.pendingSyncSession.upsert({
        where: { externalId: stage.externalId },
        create: {
          externalId: stage.externalId,
          externalTitle: stage.title,
          city: stage.city,
          startDate: new Date(stage.startDate),
          endDate: new Date(stage.endDate),
          seatsLeft: 0,
          externalState: stage.state,
        },
        update: {
          externalTitle: stage.title,
          city: stage.city,
          startDate: new Date(stage.startDate),
          endDate: new Date(stage.endDate),
          externalState: stage.state,
        },
      });
      summary.pending += 1;
      continue;
    }

    await prisma.session.upsert({
      where: { externalId: stage.externalId },
      create: {
        formationSlug: match.slug,
        city: stage.city || "À distance",
        startDate: new Date(stage.startDate),
        endDate: new Date(stage.endDate),
        seatsLeft: 0,
        mode: stage.city ? "Présentiel" : "Distanciel",
        source: "queoval",
        externalId: stage.externalId,
        externalTitle: stage.title,
        externalState: stage.state,
        lastSyncedAt: new Date(),
      },
      update: {
        formationSlug: match.slug,
        city: stage.city || "À distance",
        startDate: new Date(stage.startDate),
        endDate: new Date(stage.endDate),
        mode: stage.city ? "Présentiel" : "Distanciel",
        externalTitle: stage.title,
        externalState: stage.state,
        lastSyncedAt: new Date(),
      },
    });
    summary.matched += 1;
  }

  return summary;
}

async function listPendingSyncSessions() {
  const prisma = getPrismaClient();

  if (!prisma) {
    return [];
  }

  return prisma.pendingSyncSession.findMany({ orderBy: { startDate: "asc" } });
}

async function resolvePendingSyncSession(id, formationSlug) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Base de données indisponible : DATABASE_URL non configuré");
  }

  const pending = await prisma.pendingSyncSession.findUnique({ where: { id } });

  if (!pending) {
    throw new Error("Session en attente introuvable");
  }

  const session = await prisma.session.upsert({
    where: { externalId: pending.externalId },
    create: {
      formationSlug,
      city: pending.city || "À distance",
      startDate: pending.startDate,
      endDate: pending.endDate,
      seatsLeft: pending.seatsLeft,
      mode: pending.city ? "Présentiel" : "Distanciel",
      source: "queoval",
      externalId: pending.externalId,
      externalTitle: pending.externalTitle,
      externalState: pending.externalState,
      lastSyncedAt: new Date(),
    },
    update: {
      formationSlug,
      city: pending.city || "À distance",
      startDate: pending.startDate,
      endDate: pending.endDate,
      seatsLeft: pending.seatsLeft,
      lastSyncedAt: new Date(),
    },
  });

  await prisma.pendingSyncSession.delete({ where: { id } });

  return session;
}

module.exports = {
  syncQueovalCalendar,
  listPendingSyncSessions,
  resolvePendingSyncSession,
};
