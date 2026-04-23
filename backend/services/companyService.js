const { randomUUID } = require("crypto");
const { getPrismaClient } = require("./prismaClient");

const inMemoryCompanies = [];

function formatDateTime(value) {
  if (!value) {
    return undefined;
  }

  return typeof value === "string" ? value : new Date(value).toISOString();
}

function normalizeCompany(company) {
  return {
    id: company.id,
    name: company.name,
    contactName: company.contactName,
    email: company.email,
    phone: company.phone,
    status: company.status || "Prospect",
    source: company.source || "Inbound",
    priority: company.priority || "Normale",
    notes: company.notes || "",
    nextFollowUpAt: formatDateTime(company.nextFollowUpAt),
    lastContactAt: formatDateTime(company.lastContactAt),
    createdAt: formatDateTime(company.createdAt) || new Date().toISOString(),
    updatedAt: formatDateTime(company.updatedAt) || new Date().toISOString(),
  };
}

function buildCompanyKey(name, email) {
  return `${String(name || "").trim().toLowerCase()}::${String(email || "").trim().toLowerCase()}`;
}

async function syncCompaniesFromRegistrations(prisma) {
  const registrations = await prisma.inscription.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      company: true,
      contactName: true,
      email: true,
      phone: true,
      createdAt: true,
      companyId: true,
    },
  });

  const existingCompanies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      lastContactAt: true,
    },
  });

  const companyByKey = new Map(existingCompanies.map((company) => [buildCompanyKey(company.name, company.email), company]));

  for (const registration of registrations) {
    const key = buildCompanyKey(registration.company, registration.email);
    let company = companyByKey.get(key);

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: registration.company,
          contactName: registration.contactName,
          email: registration.email,
          phone: registration.phone,
          lastContactAt: registration.createdAt,
        },
        select: {
          id: true,
          name: true,
          email: true,
          lastContactAt: true,
        },
      });

      companyByKey.set(key, company);
    } else if (!company.lastContactAt || new Date(registration.createdAt) > new Date(company.lastContactAt)) {
      company = await prisma.company.update({
        where: { id: company.id },
        data: {
          contactName: registration.contactName,
          email: registration.email,
          phone: registration.phone,
          lastContactAt: registration.createdAt,
        },
        select: {
          id: true,
          name: true,
          email: true,
          lastContactAt: true,
        },
      });

      companyByKey.set(key, company);
    }

    if (!registration.companyId) {
      await prisma.inscription.update({
        where: { id: registration.id },
        data: { companyId: company.id },
      });
    }
  }
}

async function listCompanies() {
  const prisma = getPrismaClient();

  if (!prisma) {
    return [...inMemoryCompanies]
      .map(normalizeCompany)
      .sort((left, right) => (right.lastContactAt || "").localeCompare(left.lastContactAt || ""));
  }

  await syncCompaniesFromRegistrations(prisma);

  const companies = await prisma.company.findMany({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  return companies.map(normalizeCompany);
}

async function createCompany(payload) {
  const prisma = getPrismaClient();
  const now = new Date().toISOString();

  if (!prisma) {
    const company = normalizeCompany({
      id: randomUUID(),
      ...payload,
      notes: payload.notes || "",
      lastContactAt: payload.lastContactAt || now,
      createdAt: now,
      updatedAt: now,
    });

    inMemoryCompanies.unshift(company);
    return company;
  }

  const company = await prisma.company.create({
    data: {
      name: payload.name,
      contactName: payload.contactName,
      email: payload.email,
      phone: payload.phone,
      status: payload.status,
      source: payload.source,
      priority: payload.priority,
      notes: payload.notes || "",
      nextFollowUpAt: payload.nextFollowUpAt ? new Date(payload.nextFollowUpAt) : null,
      lastContactAt: payload.lastContactAt ? new Date(payload.lastContactAt) : new Date(),
    },
  });

  return normalizeCompany(company);
}

async function updateCompany(id, payload) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const index = inMemoryCompanies.findIndex((company) => company.id === id);

    if (index === -1) {
      throw new Error("Company not found");
    }

    const company = normalizeCompany({
      ...inMemoryCompanies[index],
      ...payload,
      id,
      updatedAt: new Date().toISOString(),
    });

    inMemoryCompanies[index] = company;
    return company;
  }

  const company = await prisma.company.update({
    where: { id },
    data: {
      name: payload.name,
      contactName: payload.contactName,
      email: payload.email,
      phone: payload.phone,
      status: payload.status,
      source: payload.source,
      priority: payload.priority,
      notes: payload.notes || "",
      nextFollowUpAt: payload.nextFollowUpAt ? new Date(payload.nextFollowUpAt) : null,
      lastContactAt: payload.lastContactAt ? new Date(payload.lastContactAt) : null,
    },
  });

  return normalizeCompany(company);
}

async function findOrCreateCompanyFromRegistration(payload) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const key = buildCompanyKey(payload.company, payload.email);
    const existing = inMemoryCompanies.find((company) => buildCompanyKey(company.name, company.email) === key);

    if (existing) {
      return existing;
    }

    const created = await createCompany({
      name: payload.company,
      contactName: payload.contactName,
      email: payload.email,
      phone: payload.phone,
      status: "Prospect",
      source: "Inbound",
      priority: "Normale",
      notes: "",
      lastContactAt: new Date().toISOString(),
    });

    return created;
  }

  const company = await prisma.company.upsert({
    where: {
      name_email: {
        name: payload.company,
        email: payload.email,
      },
    },
    update: {
      contactName: payload.contactName,
      phone: payload.phone,
      lastContactAt: new Date(),
    },
    create: {
      name: payload.company,
      contactName: payload.contactName,
      email: payload.email,
      phone: payload.phone,
      status: "Prospect",
      source: "Inbound",
      priority: "Normale",
      lastContactAt: new Date(),
    },
  });

  return normalizeCompany(company);
}

module.exports = {
  createCompany,
  findOrCreateCompanyFromRegistration,
  listCompanies,
  updateCompany,
};