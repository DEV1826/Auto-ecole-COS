/**
 * Service de gestion des documents (fichiers scannés, permis, factures, etc.)
 *
 * @module documentService
 * @description
 * Fournit toutes les opérations CRUD pour les documents, les statistiques agrégées,
 * les tendances et les sparklines pour les tableaux de bord.
 * Gère également le téléversement de fichiers avec stockage physique organisé.
 *
 * Toutes les fonctions utilisent le wrapper `executePrismaOperation` pour une
 * gestion homogène des erreurs. Les dates sont manipulées au format ISO.
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @see {@link prisma.client.js} – Utilitaires génériques Prisma
 */

import { shell } from 'electron';
import {
  prisma,
  executePrismaOperation,
  create,
  findUnique,
  findMany,
  count,
} from './prisma.client.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// ===============================
// CONSTANTES & UTILITAIRES INTERNES
// ===============================

/** Liste des types de documents valides */
const VALID_DOCUMENT_TYPES = ['permis', 'carte_identite', 'facture', 'recu', 'autre'];

/** Dossier racine pour le stockage des documents (relatif à userData) */
const DOCUMENTS_BASE_DIR = 'documents';

/** Défaut de période pour le filtre (en jours) */
const DEFAULT_PERIOD_MAP = {
  today: 1,
  week: 7,
  month: 30,
  all: null,
};

/**
 * Récupère le chemin de base absolu pour le stockage des documents.
 * Utilise le répertoire userData d'Electron.
 * @returns {Promise<string>} Chemin absolu
 */
async function getDocumentsBaseDir() {
  const { app } = await import('electron');
  const userData = app.getPath('userData');
  const baseDir = path.join(userData, DOCUMENTS_BASE_DIR);
  await fs.mkdir(baseDir, { recursive: true });
  return baseDir;
}

/**
 * Nettoie un nom de fichier pour le rendre sûr.
 * @param {string} originalName - Nom original
 * @returns {string} Nom nettoyé
 */
function sanitizeFileName(originalName) {
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  const safeName = nameWithoutExt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${safeName}${ext}`;
}

/**
 * Génère un nom de fichier unique (timestamp + hash + nom original nettoyé).
 * @param {string} originalName - Nom original
 * @returns {Promise<string>} Nom unique
 */
async function generateUniqueFileName(originalName) {
  const timestamp = Date.now();
  const randomHash = crypto.randomBytes(4).toString('hex');
  const safeName = sanitizeFileName(originalName);
  return `${timestamp}_${randomHash}_${safeName}`;
}

/**
 * Construit l'objet `where` pour la liste paginée avec filtres.
 * @param {Object} params
 * @param {string} [params.type] - Type de document
 * @param {number} [params.candidatId] - ID du candidat
 * @param {string} [params.period] - Période ('today', 'week', 'month', 'all')
 * @param {string} [params.search] - Recherche sur nomFichier ou nom candidat
 * @returns {Object} Condition Prisma `where`
 */
function buildWhereClause({ type, candidatId, period, search }) {
  const where = {};

  if (type && VALID_DOCUMENT_TYPES.includes(type)) {
    where.type = type;
  }

  if (candidatId && !isNaN(candidatId)) {
    where.candidatId = Number(candidatId);
  }

  if (period && period !== 'all') {
    const days = DEFAULT_PERIOD_MAP[period] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    where.uploadedAt = { gte: startDate };
  }

  if (search && search.trim().length > 0) {
    const term = search.trim();
    where.OR = [
      { nomFichier: { contains: term, mode: 'insensitive' } },
      {
        candidat: {
          OR: [
            { nom: { contains: term, mode: 'insensitive' } },
            { prenom: { contains: term, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }

  return where;
}

// ===============================
// FONCTIONS PRINCIPALES (exportées)
// ===============================

/**
 * Téléverse un document : sauvegarde le fichier sur le disque et enregistre en base.
 *
 * @param {Object} params - Paramètres du téléversement
 * @param {number} params.candidatId - Identifiant du candidat
 * @param {string} params.type - Type de document (permis, carte_identite, facture, recu, autre)
 * @param {Buffer} params.buffer - Contenu du fichier
 * @param {string} params.originalName - Nom original du fichier
 * @param {string} [params.mimeType] - Type MIME du fichier
 * @param {string} [params.description] - Description optionnelle
 * @returns {Promise<Document>} Document créé avec son chemin physique
 *
 * @throws {Error} Si les paramètres sont invalides ou si l'écriture échoue
 */
export async function uploadDocument({ candidatId, type, buffer, originalName, mimeType }) {
  // Validation des paramètres
  if (!candidatId || isNaN(candidatId)) throw new Error('Identifiant candidat invalide.');
  if (!type || !VALID_DOCUMENT_TYPES.includes(type)) {
    throw new Error(
      `Type de document invalide. Valeurs autorisées : ${VALID_DOCUMENT_TYPES.join(', ')}`
    );
  }
  if (!buffer || !(buffer instanceof Buffer) || buffer.length === 0) {
    throw new Error('Contenu du fichier invalide ou vide.');
  }
  if (!originalName?.trim()) throw new Error('Nom de fichier original manquant.');

  return executePrismaOperation(async () => {
    // Vérifier l'existence du candidat
    const candidat = await findUnique('candidat', { id: candidatId, deletedAt: null });
    if (!candidat) throw new Error('Candidat non trouvé.');

    // Préparer le chemin de destination : base/documents/{type}/{candidatId}/
    const baseDir = await getDocumentsBaseDir();
    const targetDir = path.join(baseDir, type, String(candidatId));
    await fs.mkdir(targetDir, { recursive: true });

    // Générer un nom de fichier unique
    const uniqueFileName = await generateUniqueFileName(originalName);
    const filePath = path.join(targetDir, uniqueFileName);

    // Écrire le fichier sur le disque
    await fs.writeFile(filePath, buffer);

    // Calculer la taille du fichier
    const taille = buffer.length;

    // Enregistrer les métadonnées en base
    const documentData = {
      candidatId,
      type,
      nomFichier: originalName,
      chemin: filePath,
      taille,
      mimeType: mimeType || null,
      uploadedAt: new Date(),
    };

    const newDocument = await create('document', documentData, {
      candidat: {
        select: { candidat },
      },
    });

    return newDocument;
  }, 'Erreur lors du téléversement du document');
}

/**
 * Récupère la liste paginée des documents avec filtres optionnels.
 *
 * @param {Object} [params] - Paramètres de pagination et filtres
 * @param {number} [params.page=1] - Numéro de page (1-indexed)
 * @param {number} [params.limit=20] - Nombre d'éléments par page
 * @param {string} [params.type] - Filtrer par type de document
 * @param {number} [params.candidatId] - Filtrer par candidat
 * @param {string} [params.period] - Période ('today', 'week', 'month', 'all')
 * @param {string} [params.search] - Recherche textuelle (nomFichier, nom candidat)
 * @returns {Promise<Object>} Réponse paginée avec documents et métadonnées
 *
 * @example
 * const result = await getAllDocuments({ page: 2, limit: 20, type: 'permis', period: 'month' });
 */
export async function getAllDocuments(params = {}) {
  const { page = 1, limit = 20, ...filters } = params;
  const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
  const take = Math.max(1, limit);

  const where = buildWhereClause(filters);

  return executePrismaOperation(async () => {
    const [documents, total] = await Promise.all([
      findMany(
        'document',
        where,
        {
          candidat: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              telephone: true,
            },
          },
        },
        { uploadedAt: 'desc' },
        skip,
        take
      ),
      count('document', where),
    ]);

    return {
      documents,
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }, 'Erreur lors de la récupération des documents');
}

/**
 * Récupère un document par son identifiant, avec le candidat associé.
 *
 * @param {number} id - Identifiant du document
 * @returns {Promise<Document>} Document complet (avec candidat)
 * @throws {Error} Si le document n'existe pas
 */
export async function getDocumentById(id) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant document invalide.');
  }

  return executePrismaOperation(async () => {
    const document = await findUnique(
      'document',
      { id },
      {
        candidat: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
          },
        },
      }
    );
    if (!document) {
      throw new Error('Document non trouvé.');
    }
    return document;
  }, 'Erreur lors de la récupération du document');
}

/**
 * Supprime définitivement un document de la base et du disque.
 *
 * @param {number} id - Identifiant du document
 * @returns {Promise<{ success: boolean; message: string }>}
 */
export async function deleteDocument(id) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant document invalide.');
  }

  return executePrismaOperation(async () => {
    const doc = await findUnique('document', { id });
    if (!doc) {
      throw new Error('Document non trouvé.');
    }

    // Supprimer le fichier physique (si possible)
    if (doc.chemin) {
      try {
        await fs.unlink(doc.chemin);
      } catch (err) {
        console.error(`Impossible de supprimer le fichier ${doc.chemin}:`, err);
        // On continue, le document est quand même supprimé de la base
      }
    }

    await prisma.document.delete({ where: { id } });
    return { success: true, message: 'Document supprimé avec succès.' };
  }, 'Erreur lors de la suppression du document');
}

/**
 * Télécharge un document (le renvoie sous forme de buffer ou chemin).
 * Note : Cette fonction est appelée côté main, le téléchargement réel
 * (dialogue d'enregistrement) est géré dans le handler IPC.
 *
 * @param {number} id - Identifiant du document
 * @returns {Promise<{ chemin: string; nomFichier: string }>}
 */
export async function downloadDocument(id) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant document invalide.');
  }

  return executePrismaOperation(async () => {
    const doc = await findUnique('document', { id });
    if (!doc) {
      throw new Error('Document non trouvé.');
    }
    if (!doc.chemin || !doc.nomFichier) {
      throw new Error('Fichier physique manquant.');
    }
    // Vérifier que le fichier existe
    await fs.access(doc.chemin);
    return { chemin: doc.chemin, nomFichier: doc.nomFichier };
  }, 'Erreur lors du téléchargement du document');
}

/**
 * Ouvre un document avec l'application par défaut du système.
 * Le handler IPC appelle directement cette fonction.
 *
 * @param {string} chemin - Chemin absolu du fichier
 * @returns {Promise<{ success: boolean }>}
 */
export async function openDocument(chemin) {
  if (!chemin) {
    throw new Error('Chemin de fichier manquant.');
  }

  await fs.access(chemin);
  const result = await shell.openPath(chemin);
  if (result) throw new Error(result);
  return { success: true };
}
// ===============================
// STATISTIQUES, TENDANCES ET SPARKLINES
// ===============================

/**
 * Récupère les statistiques agrégées des documents.
 *
 * @returns {Promise<DocumentsStats>} Statistiques (total, taille, répartition par type)
 */
export async function getDocumentsStats() {
  return executePrismaOperation(async () => {
    const [totalDocuments, totalTaille, repartition] = await Promise.all([
      count('document'),
      prisma.document.aggregate({ _sum: { taille: true } }),
      prisma.document.groupBy({
        by: ['type'],
        _count: { type: true },
        _sum: { taille: true },
      }),
    ]);

    const stats = {
      totalDocuments,
      totalTailleBytes: totalTaille._sum.taille || 0,
      documentsCarteIdentite: 0,
      documentsRecu: 0,
    };

    for (const r of repartition) {
      if (r.type === 'carte_identite') stats.documentsCarteIdentite = r._count.type;
      if (r.type === 'recu') stats.documentsRecu = r._count.type;
    }

    return stats;
  }, 'Erreur lors du calcul des statistiques des documents');
}

/**
 * Récupère les tendances évolutives pour les documents.
 * Compare les périodes (mois en cours vs mois précédent).
 *
 * @returns {Promise<DocumentsTrends>} Tendances en pourcentage
 */
export async function getDocumentsTrends() {
  return executePrismaOperation(async () => {
    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = startThisMonth;

    // Récupérer le nombre total de documents et la taille cumulée pour les deux périodes
    const [currentPeriod, previousPeriod] = await Promise.all([
      prisma.document.aggregate({
        where: { uploadedAt: { gte: startThisMonth } },
        _count: { id: true },
        _sum: { taille: true },
      }),
      prisma.document.aggregate({
        where: { uploadedAt: { gte: startLastMonth, lt: endLastMonth } },
        _count: { id: true },
        _sum: { taille: true },
      }),
    ]);

    const currentCount = currentPeriod._count.id;
    const prevCount = previousPeriod._count.id;
    const currentSize = currentPeriod._sum.taille || 0;
    const prevSize = previousPeriod._sum.taille || 0;

    const computeTrend = (current, prev) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - prev) / prev) * 100).toFixed(1));
    };

    // Répartition par type (carte_identite et recus) – on compare les volumes
    const [currentCarte, currentRecu, prevCarte, prevRecu] = await Promise.all([
      count('document', { uploadedAt: { gte: startThisMonth }, type: 'carte_identite' }),
      count('document', { uploadedAt: { gte: startThisMonth }, type: 'recu' }),
      count('document', {
        uploadedAt: { gte: startLastMonth, lt: endLastMonth },
        type: 'carte_identite',
      }),
      count('document', { uploadedAt: { gte: startLastMonth, lt: endLastMonth }, type: 'recu' }),
    ]);

    return {
      totalDocuments: computeTrend(currentCount, prevCount),
      totalTailleBytes: computeTrend(currentSize, prevSize),
      documentsCarteIdentite: computeTrend(currentCarte, prevCarte),
      documentsRecu: computeTrend(currentRecu, prevRecu),
    };
  }, 'Erreur lors du calcul des tendances des documents');
}

/**
 * Récupère les données des sparklines pour les 12 derniers mois.
 *
 * @returns {Promise<DocumentsSparklineData>} Sparklines pour total, cartes identité, reçus, taille
 */
export async function getDocumentsSparklines() {
  return executePrismaOperation(async () => {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        start: monthDate,
        end: new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0),
        label: monthDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      });
    }

    const totalValues = [];
    const carteValues = [];
    const recuValues = [];
    const tailleValues = [];

    for (const m of months) {
      const [totalCount, carteCount, recuCount, totalSize] = await Promise.all([
        count('document', { uploadedAt: { gte: m.start, lte: m.end } }),
        count('document', { uploadedAt: { gte: m.start, lte: m.end }, type: 'carte_identite' }),
        count('document', { uploadedAt: { gte: m.start, lte: m.end }, type: 'recu' }),
        prisma.document.aggregate({
          where: { uploadedAt: { gte: m.start, lte: m.end } },
          _sum: { taille: true },
        }),
      ]);
      totalValues.push(totalCount);
      carteValues.push(carteCount);
      recuValues.push(recuCount);
      tailleValues.push(Math.floor((totalSize._sum.taille || 0) / 1_000_000)); // en Mo
    }

    return {
      totalSparkline: { values: totalValues, labels: months.map((m) => m.label) },
      carteIdentiteSparkline: { values: carteValues, labels: months.map((m) => m.label) },
      recusSparkline: { values: recuValues, labels: months.map((m) => m.label) },
      tailleSparkline: { values: tailleValues, labels: months.map((m) => m.label) },
    };
  }, 'Erreur lors de la génération des sparklines');
}

/**
 * Enregistre un document après téléversement (à appeler depuis un autre service).
 * Cette fonction est utilisée par candidat.service.js pour ajouter un document.
 *
 * @param {Object} data - Données du document
 * @returns {Promise<Document>} Document créé
 */
export async function addDocument(data) {
  if (!data.candidatId || isNaN(data.candidatId)) {
    throw new Error('Identifiant candidat invalide.');
  }
  if (!data.type?.trim() || !data.nomFichier?.trim() || !data.chemin?.trim()) {
    throw new Error('Type, nomFichier et chemin sont obligatoires.');
  }
  if (!VALID_DOCUMENT_TYPES.includes(data.type)) {
    throw new Error(
      `Type de document invalide. Valeurs autorisées : ${VALID_DOCUMENT_TYPES.join(', ')}`
    );
  }

  return executePrismaOperation(async () => {
    const candidat = await findUnique('candidat', { id: data.candidatId, deletedAt: null });
    if (!candidat) {
      throw new Error('Candidat non trouvé.');
    }

    const documentData = {
      candidatId: data.candidatId,
      type: data.type.trim(),
      nomFichier: data.nomFichier.trim(),
      chemin: data.chemin.trim(),
      taille: data.taille || null,
      mimeType: data.mimeType?.trim() || null,
      uploadedAt: new Date(),
    };

    return create('document', documentData);
  }, "Erreur lors de l'ajout du document");
}
