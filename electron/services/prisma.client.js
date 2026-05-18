/**
 * Service Prisma pour l'application Auto-École COS
 * Fournit une instance unique du client Prisma ainsi que des méthodes génériques
 * et spécifiques pour interagir avec la base de données.
 *
 * @module prismaService
 */

import { createRequire } from 'module';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

// ----- Déterminer le chemin du client Prisma -----
function getPrismaClientDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'generated');
  } else {
    return path.join(process.cwd(), 'generated');
  }
}

const clientDir = getPrismaClientDir();
const requirePrisma = createRequire(import.meta.url);
const { PrismaClient } = requirePrisma(clientDir);

// Variable pour stocker le chemin réel de la base de données SQLite
let dbPath = '';
let prismaInstance = null;
let initialized = false;

/**
 * Détermine le chemin de la base de données selon l'environnement réel
 * (packagé ou non)
 * @returns {string} Chemin absolu du fichier de base de données
 */
function getDatabasePath() {
  if (!app.isPackaged) {
    return path.join(process.cwd(), 'prisma', 'dev.db');
  } else {
    console.log('Mode Production détecté pour la base de données.');
    // Production : dossier %APPDATA%/Auto-Ecole COS sous Windows
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      console.log(`Création du dossier utilisateur distant : ${userDataPath}`);
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    return path.join(userDataPath, 'database.db');
  }
}

/**
 * Initialise la base de données (migrations + création du client Prisma)
 * Doit être appelée UNE SEULE FOIS au démarrage de l'app Electron.
 */
export async function initializePrisma() {
  if (initialized) {
    console.log('Prisma service déjà initialisé. Passage.');
    return;
  }

  dbPath = getDatabasePath();
  // Injection dynamique de la variable d'environnement lue par le client Prisma
  process.env.DATABASE_URL = `file:${dbPath}`;

  console.log(`📦 Chemin d'accès final de la Base de données : ${dbPath}`);

  // 1. Si la DB n'existe pas (fichier absent) → exécuter les migrations
  if (!fs.existsSync(dbPath)) {
    console.log("🔄 Base de données vierge détectée. Préparation de l'application du schéma...");

    // Localise le dossier prisma embarqué (extraResources)
    const prismaDir = app.isPackaged
      ? path.join(process.resourcesPath, 'prisma')
      : path.join(process.cwd(), 'prisma');

    const schemaPath = path.join(prismaDir, 'schema.prisma');
    console.log(`Vérification de l'existence du schéma à l'emplacement : ${schemaPath}`);

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema Prisma introuvable lors de l'initialisation : ${schemaPath}`);
    }

    if (app.isPackaged) {
      /**
       * EN PRODUCTION : L'environnement client n'a pas Node.js installé globalement.
       * Nous allons utiliser le moteur Prisma local ou exécuter les migrations via le binaire de Prisma
       * s'il est extrait, ou passer par une commande adaptée à l'architecture cible.
       *
       * Pour pallier l'absence de Node global sous Windows, nous utilisons le chemin de l'exécutable
       * Electron lui-même si nécessaire, ou nous lançons directement le script via un runner sécurisé.
       */
      console.log('Exécution des migrations en mode packagé.');

      const prismaCli = path.join(
        process.resourcesPath,
        'app.asar.unpacked',
        'node_modules',
        'prisma',
        'build',
        'index.js'
      );

      if (!fs.existsSync(prismaCli)) {
        console.error(`Le CLI Prisma est introuvable dans l'asar décompressé : ${prismaCli}`);
      }

      try {
        // Sous Windows, on essaie d'appeler l'instance via le process d'exécution courant ou via un shell tolérant
        console.log('Lancement de la commande de déploiement des migrations...');

        // Utilisation de process.execPath (qui est l'exécutable d'Electron) pour s'assurer d'avoir un moteur JS
        // ou repli sur la commande d'exécution standard si l'environnement le permet.
        const execCommand = `node "${prismaCli}" migrate deploy --schema "${schemaPath}"`;

        execSync(execCommand, {
          stdio: 'inherit',
          env: {
            ...process.env,
            DATABASE_URL: `file:${dbPath}`,
          },
        });
        console.log('✅ Migrations appliquées avec succès en environnement de production.');
      } catch (err) {
        console.error(
          "❌ Échec critique lors de l'application des migrations en production :",
          err.message
        );
        throw err;
      }
    } else {
      // Environnement de développement local
      try {
        console.log('Exécution des migrations en mode développement.');
        execSync(`npx prisma migrate dev --name init --schema "${schemaPath}"`, {
          stdio: 'inherit',
        });
        console.log('✅ Migrations de développement appliquées.');
      } catch (err) {
        console.error('❌ Échec des migrations de développement :', err.message);
        throw err;
      }
    }
  } else {
    console.log(
      '💾 Fichier de base de données existant détecté. Aucune migration initiale requise.'
    );
  }

  // 2. Créer l'instance du client Prisma
  if (!prismaInstance) {
    console.log('Instanciation du PrismaClient...');
    try {
      const edgeOptions = {};
      if (app.isPackaged) {
        const unpackedQueryEnginePath = path.join(
          process.resourcesPath,
          'app.asar.unpacked',
          'node_modules',
          '@prisma',
          'engines'
        );

        // On indique à Prisma où trouver ses exécutables de requêtes Windows
        process.env.PRISMA_QUERY_ENGINE_BINARY = path.join(
          unpackedQueryEnginePath,
          'query-engine-windows.exe'
        );
        process.env.PRISMA_SCHEMA_ENGINE_BINARY = path.join(
          unpackedQueryEnginePath,
          'schema-engine-windows.exe'
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
        ...edgeOptions,
      });

      // Connexion immédiate pour valider que les moteurs (engines) fonctionnent correctement
      await prismaInstance.$connect();
      console.log('🚀 Connexion au client Prisma établie avec succès.');
    } catch (connectError) {
      console.error(
        '❌ Erreur fatale lors de la connexion au Prisma Client :',
        connectError.message
      );
      throw connectError;
    }
  }

  initialized = true;
}

/**
 * Retourne l'instance unique du client Prisma.
 * Lance une erreur si initializePrisma() n'a pas été appelée.
 * @returns {PrismaClient}
 */
export function getPrismaClient() {
  if (!prismaInstance) {
    throw new Error('Prisma n’est pas initialisé. Appelez initializePrisma() d’abord.');
  }
  return prismaInstance;
}

/**
 * Ferme la connexion Prisma proprement lors de la fermeture de l'application Electron
 * @returns {Promise<void>}
 */
export async function disconnectPrisma() {
  if (prismaInstance) {
    console.log('Déconnexion du service Prisma...');
    await prismaInstance.$disconnect();
    prismaInstance = null;
    initialized = false;
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
 * @param {object} select - Champs scalaires à sélectionner (utilisé si include est vide)
 * @returns {Promise<object|null>}
 */
export async function findUnique(model, where, include = {}, select = null) {
  const prisma = getPrismaClient();
  const queryOptions = { where };

  // Utiliser select si fourni, sinon utiliser include
  if (select && Object.keys(select).length > 0) {
    queryOptions.select = select;
  } else if (include && Object.keys(include).length > 0) {
    queryOptions.include = include;
  }

  return executePrismaOperation(
    () => prisma[model].findUnique(queryOptions),
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
 * @param {object} select - Champs scalaires à sélectionner (utilisé si include est vide)
 * @returns {Promise<object[]>}
 */
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

  // Utiliser select si fourni, sinon utiliser include
  if (select && Object.keys(select).length > 0) {
    queryOptions.select = select;
  } else if (include && Object.keys(include).length > 0) {
    queryOptions.include = include;
  }

  return executePrismaOperation(
    () => prisma[model].findMany(queryOptions),
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
/**
 * Proxy vers l'instance Prisma.
 * Chaque accès à une propriété appelle `getPrismaClient()`.
 * Évite l'exécution prématurée lors du chargement du module.
 */
export const prisma = new Proxy(
  {},
  {
    get(_, prop) {
      const client = getPrismaClient();
      return client[prop];
    },
  }
);
