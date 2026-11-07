import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { applyMigrations } from './migrations.js';

const requirePrisma = createRequire(import.meta.url);
const { app } = globalThis.__ELECTRON_MAIN__ ?? {};

function getPrismaClientDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'generated-prisma');
  }
  return path.join(process.cwd(), 'generated-prisma');
}

const clientDir = getPrismaClientDir();
const { PrismaClient } = requirePrisma(clientDir);

let dbPath = '';
let prismaInstance = null;
let initialized = false;

function getDatabasePath() {
  if (!app.isPackaged) {
    return path.join(process.cwd(), 'prisma', 'dev.db');
  }

  const userDataPath = app.getPath('userData');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  return path.join(userDataPath, 'database.db');
}

function getMigrationsDir() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'prisma', 'migrations')
    : path.join(process.cwd(), 'prisma', 'migrations');
}

export async function initializePrisma() {
  if (initialized) {
    return;
  }

  dbPath = getDatabasePath();
  process.env.DATABASE_URL = `file:${dbPath}`;

  // Crée la base si besoin et applique les migrations manquantes (y compris
  // lors d'une mise à jour de l'application sur un poste existant).
  const { applied, baselined } = applyMigrations(dbPath, getMigrationsDir(), (message) =>
    console.log(`[migrations] ${message}`)
  );
  if (baselined.length > 0) {
    console.log(`[migrations] Base existante reconnue : ${baselined.join(', ')}`);
  }
  if (applied.length > 0) {
    console.log(`[migrations] Migrations appliquées : ${applied.join(', ')}`);
  }

  if (!prismaInstance) {
    if (app.isPackaged) {
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(
        clientDir,
        'query_engine-windows.dll.node'
      );
    }

    prismaInstance = new PrismaClient({
      log: app.isPackaged ? ['error'] : ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty',
      datasources: {
        db: {
          url: `file:${dbPath}`,
        },
      },
    });

    await prismaInstance.$connect();
  }

  initialized = true;
}

export function getPrismaClient() {
  if (!prismaInstance) {
    throw new Error('Prisma is not initialized. Call initializePrisma() first.');
  }
  return prismaInstance;
}

export async function disconnectPrisma() {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
    initialized = false;
  }
}

export async function executePrismaOperation(operation, errorMessage = 'Erreur base de donnees') {
  try {
    return await operation();
  } catch (error) {
    console.error(`[Prisma Error] ${errorMessage}:`, error);
    throw new Error(`${errorMessage} : ${error.message}`, { cause: error });
  }
}

export async function findUnique(model, where, include = {}, select = null) {
  const prisma = getPrismaClient();
  const queryOptions = { where };

  if (select && Object.keys(select).length > 0) {
    queryOptions.select = select;
  } else if (include && Object.keys(include).length > 0) {
    queryOptions.include = include;
  }

  return executePrismaOperation(
    () => prisma[model].findUnique(queryOptions),
    `Impossible de trouver ${model} avec les criteres fournis`
  );
}

export async function findMany(
  model,
  where = {},
  include = {},
  orderBy = {},
  skip = 0,
  take = 100,
  select = null
) {
  const prisma = getPrismaClient();
  const queryOptions = { where, orderBy, skip, take };

  if (select && Object.keys(select).length > 0) {
    queryOptions.select = select;
  } else if (include && Object.keys(include).length > 0) {
    queryOptions.include = include;
  }

  return executePrismaOperation(
    () => prisma[model].findMany(queryOptions),
    `Impossible de recuperer les ${model}`
  );
}

export async function create(model, data, include = {}) {
  const prisma = getPrismaClient();
  return executePrismaOperation(
    () => prisma[model].create({ data, include }),
    `Impossible de creer ${model}`
  );
}

export async function update(model, where, data, include = {}) {
  const prisma = getPrismaClient();
  return executePrismaOperation(
    () => prisma[model].update({ where, data, include }),
    `Impossible de mettre a jour ${model}`
  );
}

export async function remove(model, where) {
  const prisma = getPrismaClient();
  return executePrismaOperation(
    () => prisma[model].delete({ where }),
    `Impossible de supprimer ${model}`
  );
}

export async function softDelete(model, where) {
  return update(model, where, { deletedAt: new Date() });
}

export async function count(model, where = {}) {
  const prisma = getPrismaClient();
  return executePrismaOperation(
    () => prisma[model].count({ where }),
    `Impossible de compter les ${model}`
  );
}

export async function transaction(callback) {
  const prisma = getPrismaClient();
  return prisma.$transaction(async (tx) => {
    return await callback(tx);
  });
}

export async function rawQuery(query, params = []) {
  const prisma = getPrismaClient();
  return executePrismaOperation(
    () => prisma.$queryRawUnsafe(query, ...params),
    "Erreur lors de l'execution de la requete brute"
  );
}

export async function findUserByEmail(email) {
  return findUnique('utilisateur', { email });
}

export async function findUserWithRelations(id) {
  return findUnique(
    'utilisateur',
    { id },
    {
      permissions: true,
      sessions: { where: { actif: true } },
      auditLogs: { take: 10, orderBy: { createdAt: 'desc' } },
    }
  );
}

export async function findCandidatWithFullDetails(id) {
  return findUnique(
    'candidat',
    { id },
    {
      formation: { include: { formation: true } },
      paiements: true,
      examens: true,
      lecons: { include: { moniteur: true, vehicule: true } },
      factures: true,
      documents: true,
    }
  );
}

export async function findActiveCandidats(filters = {}) {
  const where = { deletedAt: null, ...filters };
  return findMany(
    'candidat',
    where,
    { formation: { include: { formation: true } } },
    { dateInscription: 'desc' }
  );
}

export async function findLeconsBetweenDates(startDate, endDate, moniteurId = null) {
  const where = {
    date: { gte: startDate, lte: endDate },
    ...(moniteurId && { moniteurId }),
  };
  return findMany(
    'lecon',
    where,
    { candidat: true, moniteur: true, vehicule: true },
    { date: 'asc' }
  );
}

export async function completeLecon(leconId) {
  return transaction(async (tx) => {
    const lecon = await tx.lecon.findUnique({
      where: { id: leconId },
      include: { candidat: { include: { formation: true } } },
    });
    if (!lecon) throw new Error('Lecon introuvable');
    if (lecon.statut === 'EFFECTUEE') throw new Error('Lecon deja effectuee');

    const updatedLecon = await tx.lecon.update({
      where: { id: leconId },
      data: { statut: 'EFFECTUEE' },
    });

    if (lecon.type === 'CONDUITE' || lecon.type === 'CONDUITE_ACCOMPAGNEE') {
      const formationCandidat = await tx.formationCandidat.findUnique({
        where: { candidatId: lecon.candidatId },
      });
      if (formationCandidat) {
        await tx.formationCandidat.update({
          where: { id: formationCandidat.id },
          data: { heuresConduiteEffectuees: { increment: lecon.duree / 60 } },
        });
      }
    } else if (lecon.type === 'CODE') {
      const formationCandidat = await tx.formationCandidat.findUnique({
        where: { candidatId: lecon.candidatId },
      });
      if (formationCandidat) {
        await tx.formationCandidat.update({
          where: { id: formationCandidat.id },
          data: { heuresCodeEffectuees: { increment: lecon.duree / 60 } },
        });
      }
    }
    return updatedLecon;
  });
}

export async function createPaiementWithCaisse(paiementData) {
  return transaction(async (tx) => {
    const paiement = await tx.paiement.create({ data: paiementData });

    const dernierMouvement = await tx.caisse.findFirst({
      orderBy: { date: 'desc' },
    });
    const nouveauSolde = (dernierMouvement?.solde || 0) + paiement.montant;
    await tx.caisse.create({
      data: {
        type: 'ENTREE',
        montant: paiement.montant,
        solde: nouveauSolde,
        description: `Paiement #${paiement.id} - Candidat ${paiement.candidatId}`,
        reference: paiement.reference,
        date: paiement.date,
      },
    });

    if (paiement.factureId) {
      const facture = await tx.facture.findUnique({
        where: { id: paiement.factureId },
        include: { paiements: true },
      });
      const totalPaye = facture.paiements.reduce((sum, p) => sum + p.montant, 0);
      let nouveauStatut = 'PARTIELLEMENT_PAYEE';
      if (totalPaye >= facture.montantTotal) nouveauStatut = 'PAYEE';
      await tx.facture.update({
        where: { id: facture.id },
        data: { statut: nouveauStatut },
      });
    }

    return paiement;
  });
}

export async function searchCandidats(searchTerm) {
  const prisma = getPrismaClient();
  return prisma.candidat.findMany({
    where: {
      OR: [
        { nom: { contains: searchTerm, mode: 'insensitive' } },
        { prenom: { contains: searchTerm, mode: 'insensitive' } },
        { numeroPermis: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ],
      deletedAt: null,
    },
    include: { formation: { include: { formation: true } } },
    take: 20,
  });
}

export async function isVehiculeDisponible(vehiculeId, date, dureeMinutes = 60) {
  const start = date;
  const end = new Date(date.getTime() + dureeMinutes * 60000);
  const overlappingLecon = await findMany(
    'lecon',
    {
      vehiculeId,
      date: { lt: end, gt: start },
      statut: { not: 'ANNULEE' },
    },
    {},
    {},
    0,
    1
  );
  return overlappingLecon.length === 0;
}

export const prisma = new Proxy(
  {},
  {
    get(_, prop) {
      const client = getPrismaClient();
      return client[prop];
    },
  }
);
