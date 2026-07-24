const { getPrismaClient } = require("./prismaClient");

const QUEOVAL_PIPE_URL = "https://applimetier.com/QueovalSiteWS1/api/Pipe/Formation/Filtered/CARD_PAGINATION";

const SYNCED_STATES = ["2", "3"]; // 2 = Planifiée, 3 = Confirmée

const COLUMN_DEFINITION = {
  codeBo: "BO_STAGE",
  codeProperty: "Etat_PRO",
  tableName: "TDOProduction",
  tablePrefix: "stg",
  columnOrderBy: "DatedPRO asc",
  columnFilterCode: "0",
  columnFilterGroupe: "COLPIPESTAGE",
};

function buildPayload(state, stepOffset) {
  return {
    column: {
      titre: "",
      columnSelector: [
        {
          PropType: 0,
          PropKey: "stg.Etat_PRO",
          PropValue: state,
          PropOperator: 1,
          PropInWhere: true,
          Order: 0,
          Text: null,
          Value: null,
          Hidden: false,
          Treeview: false,
        },
      ],
      pagination: {
        nbElement: 0,
        nbPage: 0,
        currentPage: 0,
        step: 50,
        stepOffset,
        paginationLoading: false,
        getPagination: true,
      },
      dropDisable: false,
    },
    filterBadges: [],
    columnDefinition: COLUMN_DEFINITION,
  };
}

function getQueovalHeaders() {
  const bearer = process.env.QUEOVAL_BEARER_TOKEN;
  const qgmt = process.env.QUEOVAL_QGMT_TOKEN;
  const cookie = process.env.QUEOVAL_COOKIE;

  if (!bearer || !qgmt || !cookie) {
    throw new Error(
      "Identifiants Queoval manquants : renseignez QUEOVAL_BEARER_TOKEN, QUEOVAL_QGMT_TOKEN et QUEOVAL_COOKIE dans .env"
    );
  }

  return {
    Authorization: `Bearer ${bearer}`,
    qgmt: `queoval ${qgmt}`,
    Cookie: cookie,
    "Content-Type": "application/json",
    Accept: "application/json, text/plain, */*",
  };
}

function toIsoDate(datePart) {
  if (!datePart) {
    return null;
  }

  const month = String(datePart.Month).padStart(2, "0");
  const day = String(datePart.Day).padStart(2, "0");
  return `${datePart.Year}-${month}-${day}`;
}

function extractCity(cpVille) {
  if (!cpVille) {
    return null;
  }

  const parts = cpVille.split(",");
  return (parts[1] || parts[0] || "").trim();
}

async function fetchStagesForState(state) {
  const headers = getQueovalHeaders();
  const stages = [];
  let stepOffset = 0;

  while (true) {
    const response = await fetch(QUEOVAL_PIPE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(buildPayload(state, stepOffset)),
    });

    if (!response.ok) {
      throw new Error(`Appel Queoval échoué (statut ${response.status}) pour l'état ${state}`);
    }

    const payload = await response.json();

    if (payload.HasError) {
      throw new Error(`Erreur Queoval : ${payload.Error || "inconnue"}`);
    }

    const cards = payload.Value?.cards || [];
    stages.push(...cards);

    const pagination = payload.Value?.pagination;
    const nextOffset = stepOffset + (pagination?.step || cards.length || 50);

    if (!pagination || cards.length === 0 || nextOffset >= (pagination.nbElement || 0)) {
      break;
    }

    stepOffset = nextOffset;
  }

  return stages;
}

async function fetchUpcomingStages() {
  const results = await Promise.all(SYNCED_STATES.map((state) => fetchStagesForState(state)));
  return results.flat();
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

async function syncQueovalCalendar() {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Base de données indisponible : DATABASE_URL non configuré");
  }

  const stages = await fetchUpcomingStages();
  const formations = await prisma.formation.findMany({ select: { slug: true, title: true } });

  const summary = {
    matched: 0,
    pending: 0,
    skippedCancelled: 0,
    total: stages.length,
  };

  for (const stage of stages) {
    const startDate = toIsoDate(stage.DateDebut);
    const endDate = toIsoDate(stage.DateFin);

    if (!startDate || !endDate) {
      continue;
    }

    const match = findBestFormationMatch(stage.Titre, formations);

    if (!match) {
      await prisma.pendingSyncSession.upsert({
        where: { externalId: stage.Ident },
        create: {
          externalId: stage.Ident,
          externalTitle: stage.Titre,
          city: extractCity(stage.CpVille),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          seatsLeft: stage.NbStagiaire ?? 0,
          externalState: stage.Etat,
        },
        update: {
          externalTitle: stage.Titre,
          city: extractCity(stage.CpVille),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          seatsLeft: stage.NbStagiaire ?? 0,
          externalState: stage.Etat,
        },
      });
      summary.pending += 1;
      continue;
    }

    await prisma.session.upsert({
      where: { externalId: stage.Ident },
      create: {
        formationSlug: match.slug,
        city: extractCity(stage.CpVille) || "À distance",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        seatsLeft: stage.NbStagiaire ?? 0,
        mode: stage.CpVille ? "Présentiel" : "Distanciel",
        source: "queoval",
        externalId: stage.Ident,
        externalTitle: stage.Titre,
        externalState: stage.Etat,
        lastSyncedAt: new Date(),
      },
      update: {
        formationSlug: match.slug,
        city: extractCity(stage.CpVille) || "À distance",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        seatsLeft: stage.NbStagiaire ?? 0,
        mode: stage.CpVille ? "Présentiel" : "Distanciel",
        externalTitle: stage.Titre,
        externalState: stage.Etat,
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
