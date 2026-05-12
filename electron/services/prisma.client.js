// /home/stive-junior/Auto-ecole-COS/electron/services/prisma.service.js

/**
 * Service Prisma pour l'application Auto-École COS
 * Fournit une instance unique du client Prisma ainsi que des méthodes génériques
 * et spécifiques pour interagir avec la base de données.
 *
 * @module prismaService
 */

import { PrismaClient } from '@prisma/client';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

/**
 * Détermine le chemin de la base de données selon l'environnement
 * - En développement : utilise le fichier dev.db dans le dossier racine du projet
 * - En production : stocke la base dans userData (pour éviter les pertes de données)
 * @returns {string} Chemin absolu vers le fichier SQLite
 */
function getDatabasePath() {
  if (process.env.NODE_ENV === 'development') {
    // En développement, on utilise le fichier à la racine du projet
    return path.join(process.cwd(), 'prisma', 'dev.db');
  } else {
    // En production, on utilise le répertoire userData d'Electron
    const userDataPath = app.getPath('userData');
    const dbDir = path.join(userDataPath, 'database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    return path.join(dbDir, 'app.db');
  }
}

// Définir l'URL de la base de données
const databaseUrl = `file:${getDatabasePath()}`;
process.env.DATABASE_URL = databaseUrl;

// ===============================
// INSTANCE UNIQUE DU CLIENT PRISMA
// ===============================

/**
 * Instance unique du PrismaClient
 * @type {PrismaClient}
 */
let prismaInstance = null;

/**
 * Retourne l'instance unique du client Prisma.
 * Garantit une seule connexion à la base de données.
 * @returns {PrismaClient}
 */
export function getPrismaClient() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      errorFormat: 'pretty',
    });
  }
  return prismaInstance;
}

/**
 * Ferme la connexion Prisma (à appeler lors de la fermeture de l'application)
 * @returns {Promise<void>}
 */
export async function disconnectPrisma() {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

// ===============================
// UTILITAIRES GÉNÉRIQUES
// ===============================

/**
 * Wrapper pour exécuter une opération Prisma avec gestion d'erreurs standardisée
 * @template T
 * @param {() => Promise<T>} operation - Fonction asynchrone contenant l'opération Prisma
 * @param {string} errorMessage - Message d'erreur personnalisé
 * @returns {Promise<T>}
 * @throws {Error} Lance une erreur avec le message d'échec
 */
export async function executePrismaOperation(operation, errorMessage = 'Erreur base de données') {
  try {
    return await operation();
  } catch (error) {
    console.error(`[Prisma Error] ${errorMessage}:`, error);
    throw new Error(`${errorMessage} : ${error.message}`, { cause: error });
  }
}

/**
 * Générique pour trouver un enregistrement unique
 * @param {string} model - Nom du modèle (ex: 'candidat')
 * @param {object} where - Conditions de recherche
 * @param {object} include - Relations à inclure
 * @returns {Promise<object|null>}
 */
export async function findUnique(model, where, include = {}) {
  const prisma = getPrismaClient();
  return executePrismaOperation(
    () => prisma[model].findUnique({ where, include }),
    `Impossible de trouver ${model} avec les critères fournis`
  );
}

/**
 * Générique pour trouver plusieurs enregistrements
 * @param {string} model - Nom du modèle
 * @param {object} where - Conditions (filtres)
 * @param {object} include - Relations à inclure
 * @param {object} orderBy - Tri
 * @param {number} skip - Pagination
 * @param {number} take - Limite
 * @returns {Promise<object[]>}
 */
export async function findMany(
  model,
  where = {},
  include = {},
  orderBy = {},
  skip = 0,
  take = 100
) {
  const prisma = getPrismaClient();
  return executePrismaOperation(
    () => prisma[model].findMany({ where, include, orderBy, skip, take }),
    `Impossible de récupérer les ${model}`
  );
}

/**
 * Crée un nouvel enregistrement
 * @param {string} model - Nom du modèle
 * @param {object} data - Données à insérer
 * @param {object} include - Relations à inclure dans le retour
 * @returns {Promise<object>}
 */
export async function create(model, data, include = {}) {
  const prisma = getPrismaClient();
  return executePrismaOperation(
    () => prisma[model].create({ data, include }),
    `Impossible de créer ${model}`
  );
}

/**
 * Met à jour un enregistrement existant
 * @param {string} model - Nom du modèle
 * @param {object} where - Condition d'identification
 * @param {object} data - Champs à modifier
 * @param {object} include - Relations à inclure dans le retour
 * @returns {Promise<object>}
 */
export async function update(model, where, data, include = {}) {
  const prisma = getPrismaClient();
  return executePrismaOperation(
    () => prisma[model].update({ where, data, include }),
    `Impossible de mettre à jour ${model}`
  );
}

/**
 * Supprime un enregistrement (permanent)
 * @param {string} model - Nom du modèle
 * @param {object} where - Condition d'identification
 * @returns {Promise<object>}
 */
export async function remove(model, where) {
  const prisma = getPrismaClient();
  return executePrismaOperation(
    () => prisma[model].delete({ where }),
    `Impossible de supprimer ${model}`
  );
}

/**
 * Suppression logique (soft delete) - uniquement pour les modèles supportant `deletedAt`
 * @param {string} model - Nom du modèle (doit avoir un champ deletedAt)
 * @param {object} where - Condition d'identification
 * @returns {Promise<object>}
 */
export async function softDelete(model, where) {
  return update(model, where, { deletedAt: new Date() });
}

/**
 * Compte le nombre d'enregistrements selon des filtres
 * @param {string} model - Nom du modèle
 * @param {object} where - Conditions
 * @returns {Promise<number>}
 */
export async function count(model, where = {}) {
  const prisma = getPrismaClient();
  return executePrismaOperation(
    () => prisma[model].count({ where }),
    `Impossible de compter les ${model}`
  );
}

/**
 * Exécute une transaction Prisma
 * @param {Function} callback - Fonction async recevant le client Prisma transactionnel
 * @returns {Promise<any>}
 */
export async function transaction(callback) {
  const prisma = getPrismaClient();
  return prisma.$transaction(async (tx) => {
    return await callback(tx);
  });
}

/**
 * Exécute des requêtes brutes (raw query) en toute sécurité
 * @param {string} query - Requête SQL paramétrée
 * @param {any[]} params - Paramètres
 * @returns {Promise<any>}
 */
export async function rawQuery(query, params = []) {
  const prisma = getPrismaClient();
  return executePrismaOperation(
    () => prisma.$queryRawUnsafe(query, ...params),
    "Erreur lors de l'exécution de la requête brute"
  );
}

// ===============================
// MÉTHODES SPÉCIFIQUES PAR MODÈLE
// ===============================

// ----- UTILISATEURS -----
/**
 * Trouve un utilisateur par email
 * @param {string} email
 * @returns {Promise<object|null>}
 */
export async function findUserByEmail(email) {
  return findUnique('utilisateur', { email });
}

/**
 * Trouve un utilisateur avec ses permissions et sessions actives
 * @param {number} id
 * @returns {Promise<object|null>}
 */
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

// ----- CANDIDATS -----
/**
 * Trouve un candidat avec sa formation, ses paiements, examens, leçons
 * @param {number} id
 * @returns {Promise<object|null>}
 */
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

/**
 * Liste des candidats actifs (non soft-deleted)
 * @param {object} filters
 * @returns {Promise<object[]>}
 */
export async function findActiveCandidats(filters = {}) {
  const where = { deletedAt: null, ...filters };
  return findMany(
    'candidat',
    where,
    { formation: { include: { formation: true } } },
    { dateInscription: 'desc' }
  );
}

// ----- LECONS (planning) -----
/**
 * Récupère les leçons pour une période donnée
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {number|null} moniteurId
 * @returns {Promise<object[]>}
 */
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

/**
 * Marque une leçon comme effectuée et met à jour les heures de conduite du candidat
 * @param {number} leconId
 * @returns {Promise<object>}
 */
export async function completeLecon(leconId) {
  return transaction(async (tx) => {
    // 1. Récupérer la leçon avec candidat et formation
    const lecon = await tx.lecon.findUnique({
      where: { id: leconId },
      include: { candidat: { include: { formation: true } } },
    });
    if (!lecon) throw new Error('Leçon introuvable');
    if (lecon.statut === 'EFFECTUEE') throw new Error('Leçon déjà effectuée');

    // 2. Mettre à jour la leçon
    const updatedLecon = await tx.lecon.update({
      where: { id: leconId },
      data: { statut: 'EFFECTUEE' },
    });

    // 3. Mettre à jour les heures de conduite du candidat dans formation_candidats
    if (lecon.type === 'CONDUITE' || lecon.type === 'CONDUITE_ACCOMPAGNEE') {
      const formationCandidat = await tx.formationCandidat.findUnique({
        where: { candidatId: lecon.candidatId },
      });
      if (formationCandidat) {
        await tx.formationCandidat.update({
          where: { id: formationCandidat.id },
          data: { heuresConduiteEffectuees: { increment: lecon.duree / 60 } }, // duree en minutes, on ajoute en heures
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

// ----- PAIEMENTS ET CAISSE -----
/**
 * Enregistre un paiement et met à jour le solde de caisse
 * @param {object} paiementData
 * @returns {Promise<object>}
 */
export async function createPaiementWithCaisse(paiementData) {
  return transaction(async (tx) => {
    // Créer le paiement
    const paiement = await tx.paiement.create({ data: paiementData });

    // Mettre à jour le solde de la caisse
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

    // Si le paiement est associé à une facture, mettre à jour le statut de la facture
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

// ----- DASHBOARD STATS -----
/**
 * Récupère les statistiques générales pour le dashboard
 * @returns {Promise<object>}
 */
export async function getDashboardStats() {
  const prisma = getPrismaClient();
  const [
    totalCandidats,
    totalMoniteurs,
    totalVehicules,
    totalLeconsMois,
    totalPaiementsMois,
    topFormations,
  ] = await Promise.all([
    prisma.candidat.count({ where: { deletedAt: null } }),
    prisma.moniteurs.count({ where: { actif: true } }),
    prisma.vehicule.count({ where: { statut: { not: 'HORS_SERVICE' } } }),
    prisma.lecon.count({
      where: {
        date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        statut: 'EFFECTUEE',
      },
    }),
    prisma.paiement.aggregate({
      where: {
        date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { montant: true },
    }),
    prisma.formationCandidat.groupBy({
      by: ['formationId'],
      _count: true,
      orderBy: { _count: { formationId: 'desc' } },
      take: 3,
    }),
  ]);
  return {
    totalCandidats,
    totalMoniteurs,
    totalVehicules,
    totalLeconsMois,
    totalPaiementsMois: totalPaiementsMois._sum.montant || 0,
    topFormations,
  };
}

// ----- AUTRES MÉTHODES UTILES (EXEMPLES) -----
/**
 * Recherche des candidats par nom, prénom ou numéro de permis
 * @param {string} searchTerm
 * @returns {Promise<object[]>}
 */
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

/**
 * Vérifie la disponibilité d'un véhicule sur une plage horaire
 * @param {number} vehiculeId
 * @param {Date} date
 * @param {number} dureeMinutes
 * @returns {Promise<boolean>}
 */
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

// ===============================
// EXPORT PAR DÉFAUT (optionnel) ET RÉEXPORT DU CLIENT BRUT
// ===============================

/**
 * Instance brute du client Prisma
 */
export const prisma = getPrismaClient();
