const { randomUUID } = require("crypto");
const { getPrismaClient } = require("./prismaClient");

const inMemoryTasks = [];
const inMemoryInteractions = [];

function formatDateTime(value) {
  if (!value) {
    return undefined;
  }

  return typeof value === "string" ? value : new Date(value).toISOString();
}

function normalizeTask(task) {
  return {
    id: task.id,
    companyId: task.companyId,
    title: task.title,
    description: task.description || "",
    status: task.status || "A faire",
    dueDate: formatDateTime(task.dueDate),
    owner: task.owner || "",
    createdAt: formatDateTime(task.createdAt) || new Date().toISOString(),
    updatedAt: formatDateTime(task.updatedAt) || new Date().toISOString(),
  };
}

function normalizeInteraction(interaction) {
  return {
    id: interaction.id,
    companyId: interaction.companyId,
    type: interaction.type,
    channel: interaction.channel || "",
    summary: interaction.summary,
    owner: interaction.owner || "",
    occurredAt: formatDateTime(interaction.occurredAt) || new Date().toISOString(),
    createdAt: formatDateTime(interaction.createdAt) || new Date().toISOString(),
  };
}

async function listCrmTasks() {
  const prisma = getPrismaClient();

  if (!prisma) {
    return [...inMemoryTasks].map(normalizeTask).sort((left, right) => (left.dueDate || "9999").localeCompare(right.dueDate || "9999"));
  }

  const tasks = await prisma.companyTask.findMany({
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return tasks.map(normalizeTask);
}

async function createCrmTask(payload) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const task = normalizeTask({
      id: randomUUID(),
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    inMemoryTasks.unshift(task);
    return task;
  }

  const task = await prisma.companyTask.create({
    data: {
      companyId: payload.companyId,
      title: payload.title,
      description: payload.description || "",
      status: payload.status,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      owner: payload.owner || null,
    },
  });

  return normalizeTask(task);
}

async function updateCrmTask(id, payload) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const index = inMemoryTasks.findIndex((task) => task.id === id);

    if (index === -1) {
      throw new Error("Task not found");
    }

    const task = normalizeTask({
      ...inMemoryTasks[index],
      ...payload,
      id,
      updatedAt: new Date().toISOString(),
    });
    inMemoryTasks[index] = task;
    return task;
  }

  const task = await prisma.companyTask.update({
    where: { id },
    data: {
      title: payload.title,
      description: payload.description || "",
      status: payload.status,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      owner: payload.owner || null,
    },
  });

  return normalizeTask(task);
}

async function listCrmInteractions() {
  const prisma = getPrismaClient();

  if (!prisma) {
    return [...inMemoryInteractions].map(normalizeInteraction).sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
  }

  const interactions = await prisma.companyInteraction.findMany({
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
  });

  return interactions.map(normalizeInteraction);
}

async function createCrmInteraction(payload) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const interaction = normalizeInteraction({
      id: randomUUID(),
      ...payload,
      occurredAt: payload.occurredAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    inMemoryInteractions.unshift(interaction);
    return interaction;
  }

  const interaction = await prisma.companyInteraction.create({
    data: {
      companyId: payload.companyId,
      type: payload.type,
      channel: payload.channel || null,
      summary: payload.summary,
      owner: payload.owner || null,
      occurredAt: payload.occurredAt ? new Date(payload.occurredAt) : new Date(),
    },
  });

  return normalizeInteraction(interaction);
}

module.exports = {
  createCrmInteraction,
  createCrmTask,
  listCrmInteractions,
  listCrmTasks,
  updateCrmTask,
};