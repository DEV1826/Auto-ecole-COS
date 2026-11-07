// /home/stive-junior/Auto-ecole-COS/electron/services/examen.service.js

/**
 * Service de gestion des examens (code et conduite)
 *
 * @module examenService
 * @description
 * Fournit toutes les opérations CRUD pour les examens, les statistiques agrégées,
 * les tendances, les sparklines, ainsi que l’accès aux examens par candidat.
 * Gère également l’impression d’attestation pour les examens réussis.
 *
 * Toutes les fonctions utilisent le wrapper `executePrismaOperation` pour une
 * gestion homogène des erreurs. Les dates sont manipulées au format ISO.
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @see {@link prisma.client.js} – Utilitaires génériques Prisma
 */

import {
  prisma,
  executePrismaOperation,
  create,
  update,
  findUnique,
  findMany,
  count,
  remove,
} from './prisma.client.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { jsPDF } from 'jspdf';
const { shell } = globalThis.__ELECTRON_MAIN__ ?? {};

// ===============================
// CONSTANTES & UTILITAIRES INTERNES
// ===============================

/** Types d'examen valides */
const VALID_TYPES = ['CODE', 'CONDUITE'];

/** Résultats d'examen valides */
const VALID_RESULTATS = ['EN_ATTENTE', 'RECU', 'AJOURNE'];

/** Défaut de période pour le filtre (en jours) */
const DEFAULT_PERIOD_MAP = {
  today: 1,
  week: 7,
  month: 30,
  all: null,
};

async function getCertificatesExportDirectory() {
  const { app } = globalThis.__ELECTRON_MAIN__ ?? {};
  const baseDir = app ? app.getPath('documents') : process.cwd();
  const exportDir = path.join(baseDir, 'Auto-Ecole COS', 'exports', 'certificats');
  await fs.mkdir(exportDir, { recursive: true });
  return exportDir;
}

async function getExamensExportDirectory() {
  const { app } = globalThis.__ELECTRON_MAIN__ ?? {};
  const baseDir = app ? app.getPath('documents') : process.cwd();
  const exportDir = path.join(baseDir, 'Auto-Ecole COS', 'exports', 'examens');
  await fs.mkdir(exportDir, { recursive: true });
  return exportDir;
}

/**
 * Convertit une date au format ISO string ou Date en objet Date.
 * @param {Date|string|null} date
 * @returns {Date|null}
 */
function toDate(date) {
  if (!date) return null;
  return date instanceof Date ? date : new Date(date);
}

/**
 * Construit l'objet `where` pour la liste paginée des examens.
 * @param {Object} params
 * @param {string} [params.search] - Recherche textuelle (candidat, centre)
 * @param {string} [params.type] - Type d'examen
 * @param {string} [params.resultat] - Résultat
 * @param {number} [params.candidatId] - ID du candidat
 * @param {Date|string} [params.dateDebut] - Date de début
 * @param {Date|string} [params.dateFin] - Date de fin
 * @param {string} [params.period] - Période prédéfinie
 * @returns {Object}
 */
function buildWhereClause({ search, type, resultat, candidatId, dateDebut, dateFin, period }) {
  const where = {};

  if (type && VALID_TYPES.includes(type)) {
    where.type = type;
  }

  if (resultat && VALID_RESULTATS.includes(resultat)) {
    where.resultat = resultat;
  }

  if (candidatId && !isNaN(candidatId)) {
    where.candidatId = Number(candidatId);
  }

  if (search && search.trim().length > 0) {
    const term = search.trim();
    where.OR = [
      { centre: { contains: term, mode: 'insensitive' } },
      { notes: { contains: term, mode: 'insensitive' } },
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

  // Gestion de la période
  if (period && period !== 'all') {
    const days = DEFAULT_PERIOD_MAP[period];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    where.date = { gte: startDate };
  } else if (dateDebut || dateFin) {
    where.date = {};
    if (dateDebut) where.date.gte = toDate(dateDebut);
    if (dateFin) where.date.lte = toDate(dateFin);
  }

  return where;
}

// ===============================
// FONCTIONS PRINCIPALES (exportées)
// ===============================

/**
 * Récupère la liste paginée des examens avec filtres optionnels.
 * Si `page` et `limit` sont fournis, la réponse est paginée.
 * Sinon, retourne tous les examens correspondant aux filtres.
 *
 * @param {Object} [params] - Paramètres de pagination, filtres et tri
 * @param {number} [params.page] - Numéro de page (1-indexed) – optionnel
 * @param {number} [params.limit] - Nombre d'éléments par page – optionnel
 * @param {string} [params.search] - Recherche textuelle (candidat, centre)
 * @param {string} [params.type] - Type d'examen
 * @param {string} [params.resultat] - Résultat
 * @param {number} [params.candidatId] - ID candidat
 * @param {Date|string} [params.dateDebut] - Date de début
 * @param {Date|string} [params.dateFin] - Date de fin
 * @param {string} [params.period] - Période prédéfinie
 * @param {string} [params.sortBy='date'] - Champ de tri (date, note, createdAt)
 * @param {'asc'|'desc'} [params.sortOrder='desc'] - Sens du tri
 * @returns {Promise<Object|Array>} Si paginé : { examens, total, page, limit, totalPages }
 *                                   Sinon : tableau direct d'examens
 */
export async function getAllExamens(params = {}) {
  const { page, limit, sortBy = 'date', sortOrder = 'desc', ...filters } = params;
  const where = buildWhereClause(filters);

  const include = {
    candidat: {
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        numeroPermis: true,
      },
    },
  };

  // Cas paginé
  if (page !== undefined && limit !== undefined) {
    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
    const take = Math.max(1, limit);
    const allowedSortFields = ['date', 'note', 'createdAt'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'date';
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy = { [orderField]: orderDirection };

    return executePrismaOperation(async () => {
      const [examens, total] = await Promise.all([
        findMany('examen', where, include, orderBy, skip, take),
        count('examen', where),
      ]);
      return {
        examens,
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      };
    }, 'Erreur lors de la récupération des examens');
  } else {
    // Non paginé
    return executePrismaOperation(async () => {
      const examens = await findMany('examen', where, include, { date: 'desc' });
      return examens;
    }, 'Erreur lors de la récupération des examens');
  }
}

/**
 * Récupère un examen par son identifiant (avec candidat).
 *
 * @param {number} id - Identifiant de l'examen
 * @returns {Promise<Object>}
 * @throws {Error}
 */
export async function getExamenById(id) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant examen invalide.');
  }

  return executePrismaOperation(async () => {
    const examen = await findUnique(
      'examen',
      { id },
      {
        candidat: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            numeroPermis: true,
          },
        },
      }
    );
    if (!examen) {
      throw new Error('Examen non trouvé.');
    }
    return examen;
  }, 'Erreur lors de la récupération de l’examen');
}

/**
 * Crée un nouvel examen.
 *
 * @param {Object} data - Données de l'examen
 * @param {Date|string} data.date - Date et heure de l'examen
 * @param {string} data.type - Type d'examen (CODE ou CONDUIT)
 * @param {number} data.candidatId - Identifiant du candidat
 * @param {string} [data.centre] - Centre d'examen (optionnel)
 * @param {string} [data.notes] - Remarques (optionnel)
 * @returns {Promise<Object>}
 */
export async function createExamen(data) {
  // Validation
  if (!data.date) throw new Error('La date de l’examen est obligatoire.');
  if (!data.type || !VALID_TYPES.includes(data.type)) {
    throw new Error(`Type d’examen invalide. Valeurs autorisées : ${VALID_TYPES.join(', ')}`);
  }
  if (!data.candidatId || isNaN(data.candidatId)) {
    throw new Error('Identifiant candidat invalide.');
  }

  // Vérifier l'existence du candidat
  const candidat = await findUnique('candidat', { id: data.candidatId, deletedAt: null });
  if (!candidat) throw new Error('Candidat non trouvé.');

  const examenData = {
    date: toDate(data.date),
    type: data.type,
    resultat: 'EN_ATTENTE', // par défaut
    note: null,
    centre: data.centre?.trim() || null,
    notes: data.notes?.trim() || null,
    candidatId: data.candidatId,
    createdAt: new Date(),
  };

  return executePrismaOperation(async () => {
    const newExamen = await create('examen', examenData, { candidat: true });
    return newExamen;
  }, 'Erreur lors de la création de l’examen');
}

/**
 * Met à jour un examen existant (patch partiel).
 * Seuls les champs modifiables (date, resultat, note, centre, notes) peuvent être mis à jour.
 *
 * @param {number} id - Identifiant de l'examen
 * @param {Object} data - Champs à modifier
 * @returns {Promise<Object>}
 */
export async function updateExamen(id, data) {
  if (!id || isNaN(id)) throw new Error('Identifiant examen invalide.');

  const existing = await findUnique('examen', { id });
  if (!existing) throw new Error('Examen non trouvé.');

  const updateData = {};
  const updatableFields = ['date', 'resultat', 'note', 'centre', 'notes'];

  for (const field of updatableFields) {
    if (data[field] !== undefined) {
      if (field === 'date') {
        updateData[field] = toDate(data[field]);
      } else if (field === 'resultat') {
        if (!VALID_RESULTATS.includes(data.resultat)) {
          throw new Error(`Résultat invalide. Valeurs autorisées : ${VALID_RESULTATS.join(', ')}`);
        }
        updateData[field] = data.resultat;
      } else if (field === 'note') {
        if (
          data.note !== null &&
          (typeof data.note !== 'number' || data.note < 0 || data.note > 20)
        ) {
          throw new Error('La note doit être comprise entre 0 et 20.');
        }
        updateData[field] = data.note;
      } else if (field === 'centre') {
        updateData[field] = data.centre?.trim() || null;
      } else if (field === 'notes') {
        updateData[field] = data.notes?.trim() || null;
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error('Aucune donnée à mettre à jour.');
  }

  return executePrismaOperation(async () => {
    const updated = await update('examen', { id }, updateData, { candidat: true });
    return updated;
  }, 'Erreur lors de la mise à jour de l’examen');
}

/**
 * Supprime définitivement un examen.
 *
 * @param {number} id - Identifiant de l'examen
 * @returns {Promise<{ success: boolean; message: string }>}
 */
export async function deleteExamen(id) {
  if (!id || isNaN(id)) throw new Error('Identifiant examen invalide.');

  const existing = await findUnique('examen', { id });
  if (!existing) throw new Error('Examen non trouvé.');

  return executePrismaOperation(async () => {
    await remove('examen', { id });
    return { success: true, message: 'Examen supprimé avec succès.' };
  }, 'Erreur lors de la suppression de l’examen');
}

// ===============================
// STATISTIQUES, TENDANCES ET SPARKLINES
// ===============================

/**
 * Récupère les statistiques agrégées des examens.
 *
 * @returns {Promise<Object>} ExamensStatsExtended
 */
export async function getExamensStats() {
  return executePrismaOperation(async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = startOfMonth;

    // Agrégations globales
    const totalExamens = await count('examen');
    const examensCode = await count('examen', { type: 'CODE' });
    const examensConduite = await count('examen', { type: 'CONDUITE' });
    const reussites = await count('examen', { resultat: 'RECU' });
    const echecs = await count('examen', { resultat: 'AJOURNE' });
    const tauxReussiteGlobal = totalExamens > 0 ? (reussites / totalExamens) * 100 : 0;

    // Examens du mois
    const examensMois = await count('examen', { date: { gte: startOfMonth } });
    const reussitesMois = await count('examen', { resultat: 'RECU', date: { gte: startOfMonth } });

    // Note moyenne des examens de conduite (uniquement ceux avec note non nulle)
    const notesConduite = await prisma.examen.aggregate({
      where: { type: 'CONDUITE', note: { not: null } },
      _avg: { note: true },
    });
    const noteMoyenneConduite = notesConduite._avg.note || 0;

    // Évolution du taux de réussite (mois courant vs mois précédent)
    const reussitesLastMonth = await count('examen', {
      resultat: 'RECU',
      date: { gte: startLastMonth, lt: endLastMonth },
    });
    const examensLastMonth = await count('examen', {
      date: { gte: startLastMonth, lt: endLastMonth },
    });
    const tauxReussiteLastMonth =
      examensLastMonth > 0 ? (reussitesLastMonth / examensLastMonth) * 100 : 0;
    const evolutionReussite =
      tauxReussiteLastMonth === 0
        ? tauxReussiteGlobal > 0
          ? 100
          : 0
        : tauxReussiteGlobal - tauxReussiteLastMonth;

    return {
      totalExamens,
      examensCode,
      examensConduite,
      reussites,
      echecs,
      tauxReussiteGlobal: parseFloat(tauxReussiteGlobal.toFixed(1)),
      examensMois,
      reussitesMois,
      noteMoyenneConduite: parseFloat(noteMoyenneConduite.toFixed(1)),
      evolutionReussite: parseFloat(evolutionReussite.toFixed(1)),
    };
  }, 'Erreur lors du calcul des statistiques des examens');
}

/**
 * Récupère les tendances évolutives (mois courant vs mois précédent).
 *
 * @returns {Promise<Object>} ExamensTrends
 */
export async function getExamensTrends() {
  return executePrismaOperation(async () => {
    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = startThisMonth;

    const computeTrend = (current, prev) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - prev) / prev) * 100).toFixed(1));
    };

    const [thisMonth, lastMonth] = await Promise.all([
      prisma.examen.aggregate({
        where: { date: { gte: startThisMonth } },
        _count: { id: true },
      }),
      prisma.examen.aggregate({
        where: { date: { gte: startLastMonth, lt: endLastMonth } },
        _count: { id: true },
      }),
    ]);

    const codeThis = await count('examen', { type: 'CODE', date: { gte: startThisMonth } });
    const codeLast = await count('examen', {
      type: 'CODE',
      date: { gte: startLastMonth, lt: endLastMonth },
    });
    const conduiteThis = await count('examen', { type: 'CONDUITE', date: { gte: startThisMonth } });
    const conduiteLast = await count('examen', {
      type: 'CONDUITE',
      date: { gte: startLastMonth, lt: endLastMonth },
    });
    const reussitesThis = await count('examen', {
      resultat: 'RECU',
      date: { gte: startThisMonth },
    });
    const reussitesLast = await count('examen', {
      resultat: 'RECU',
      date: { gte: startLastMonth, lt: endLastMonth },
    });
    const echecsThis = await count('examen', {
      resultat: 'AJOURNE',
      date: { gte: startThisMonth },
    });
    const echecsLast = await count('examen', {
      resultat: 'AJOURNE',
      date: { gte: startLastMonth, lt: endLastMonth },
    });

    const tauxThis = thisMonth._count.id > 0 ? (reussitesThis / thisMonth._count.id) * 100 : 0;
    const tauxLast = lastMonth._count.id > 0 ? (reussitesLast / lastMonth._count.id) * 100 : 0;
    const tauxReussiteTrend = computeTrend(tauxThis, tauxLast);

    return {
      totalExamens: computeTrend(thisMonth._count.id || 0, lastMonth._count.id || 0),
      examensCode: computeTrend(codeThis, codeLast),
      examensConduite: computeTrend(conduiteThis, conduiteLast),
      reussites: computeTrend(reussitesThis, reussitesLast),
      echecs: computeTrend(echecsThis, echecsLast),
      tauxReussiteGlobal: tauxReussiteTrend,
    };
  }, 'Erreur lors du calcul des tendances des examens');
}

/**
 * Récupère les données des sparklines pour les 12 derniers mois.
 *
 * @returns {Promise<Object>} ExamensSparklineData
 */
export async function getExamensSparklines() {
  return executePrismaOperation(async () => {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      months.push({
        start,
        end,
        label: start.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      });
    }

    const examensValues = [];
    const reussitesValues = [];
    const tauxValues = [];

    for (const m of months) {
      const total = await count('examen', { date: { gte: m.start, lte: m.end } });
      const reussis = await count('examen', {
        resultat: 'RECU',
        date: { gte: m.start, lte: m.end },
      });
      examensValues.push(total);
      reussitesValues.push(reussis);
      const taux = total > 0 ? (reussis / total) * 100 : 0;
      tauxValues.push(taux);
    }

    return {
      examensSparkline: { values: examensValues, labels: months.map((m) => m.label) },
      reussitesSparkline: { values: reussitesValues, labels: months.map((m) => m.label) },
      tauxReussiteSparkline: { values: tauxValues, labels: months.map((m) => m.label) },
    };
  }, 'Erreur lors de la génération des sparklines des examens');
}

// ===============================
// RELATIONS SPÉCIFIQUES
// ===============================

/**
 * Récupère tous les examens d’un candidat spécifique.
 *
 * @param {number} candidatId - Identifiant du candidat
 * @returns {Promise<Examen[]>} Liste des examens (triés par date décroissante)
 */
export async function getExamensByCandidat(candidatId) {
  if (!candidatId || isNaN(candidatId)) throw new Error('Identifiant candidat invalide.');
  return executePrismaOperation(async () => {
    return findMany('examen', { candidatId }, {}, { date: 'desc' });
  }, 'Erreur lors de la récupération des examens du candidat');
}

// ===============================
// IMPRESSION D'ATTESTATION (STUB)
// ===============================

/**
 * Génère / imprime l’attestation (certificat) pour un examen réussi.
 * Pour l’instant, il s’agit d’un stub qui retourne un chemin fictif.
 * Une implémentation réelle utiliserait une bibliothèque comme `pdfkit` ou `electron.print`.
 *
 * @param {number} id - Identifiant de l’examen
 * @returns {Promise<{ success: boolean; path?: string; message?: string }>}
 */
export async function printCertificate(id) {
  if (!id || isNaN(id)) throw new Error('Identifiant examen invalide.');

  const examen = await getExamenById(id);
  if (!examen) throw new Error('Examen non trouvé.');
  if (examen.resultat !== 'RECU') {
    throw new Error('L’attestation n’est disponible que pour les examens réussis.');
  }

  const exportDir = await getCertificatesExportDirectory();
  const filename = `attestation_examen_${id}.pdf`;
  const filePath = path.join(exportDir, filename);

  const doc = new jsPDF();
  const examDate = new Date(examen.date);
  const candidatNom = examen.candidat
    ? `${examen.candidat.prenom} ${examen.candidat.nom}`.trim()
    : `Candidat #${examen.candidatId}`;

  doc.setFillColor(49, 46, 129);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Attestation de réussite', 14, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text("Auto-école COS", 14, 25);

  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text('Ce document atteste que :', 14, 52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(candidatNom, 14, 64);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`a réussi l'examen de ${examen.type.toLowerCase()}`, 14, 78);
  doc.text(
    `organisé le ${new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(examDate)}`,
    14,
    88
  );
  doc.text(`au centre : ${examen.centre || 'Non renseigné'}`, 14, 98);

  if (examen.note !== null && examen.note !== undefined) {
    doc.text(`Note obtenue : ${examen.note}/20`, 14, 108);
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(14, 130, 88, 130);
  doc.line(122, 130, 196, 130);
  doc.setFontSize(10);
  doc.text('Signature du responsable', 14, 136);
  doc.text('Cachet', 122, 136);

  const buffer = Buffer.from(doc.output('arraybuffer'));
  await fs.writeFile(filePath, buffer);

  if (shell?.openPath) {
    const openError = await shell.openPath(filePath);
    if (openError) {
      console.warn(`[printCertificate] Impossible d'ouvrir automatiquement ${filePath}: ${openError}`);
    }
  }

  return {
    success: true,
    path: filePath,
    message: `Attestation générée : ${filename}`,
  };
}
export async function exportExamensReport(params = {}) {
  const examens = await prisma.examen.findMany({
    where: buildWhereClause(params),
    include: {
      candidat: {
        select: {
          nom: true,
          prenom: true,
        },
      },
    },
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
  });

  const exportDir = await getExamensExportDirectory();
  const filePath = path.join(exportDir, `examens-${new Date().toISOString().slice(0, 10)}.pdf`);
  const doc = new jsPDF();

  doc.setFillColor(49, 46, 129);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Registre des examens', 14, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Edition du ${new Intl.DateTimeFormat('fr-FR').format(new Date())}`, 14, 25);

  const total = examens.length;
  const reussis = examens.filter((examen) => examen.resultat === 'RECU').length;
  const ajournes = examens.filter((examen) => examen.resultat === 'AJOURNE').length;

  doc.setTextColor(31, 41, 55);
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(14, 42, 56, 18, 4, 4, 'FD');
  doc.roundedRect(74, 42, 56, 18, 4, 4, 'FD');
  doc.roundedRect(134, 42, 62, 18, 4, 4, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Examens', 18, 49);
  doc.text('Reussis', 78, 49);
  doc.text('Ajournes', 138, 49);
  doc.setFontSize(12);
  doc.text(String(total), 18, 56);
  doc.text(String(reussis), 78, 56);
  doc.text(String(ajournes), 138, 56);

  let y = 78;
  const pageHeight = doc.internal.pageSize.getHeight();
  const drawHeader = () => {
    doc.setFillColor(238, 242, 255);
    doc.rect(14, y, 182, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Date', 16, y + 5.5);
    doc.text('Candidat', 36, y + 5.5);
    doc.text('Type', 104, y + 5.5);
    doc.text('Centre', 126, y + 5.5);
    doc.text('Resultat', 168, y + 5.5);
    y += 10;
  };

  drawHeader();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  for (const examen of examens) {
    if (y > pageHeight - 18) {
      doc.addPage();
      y = 18;
      drawHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
    }

    const candidat = examen.candidat
      ? `${examen.candidat.prenom} ${examen.candidat.nom}`.trim()
      : `Candidat #${examen.candidatId}`;

    doc.text(
      new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(examen.date)),
      16,
      y
    );
    doc.text(doc.splitTextToSize(candidat, 62), 36, y);
    doc.text(examen.type, 104, y);
    doc.text(doc.splitTextToSize(examen.centre || '-', 36), 126, y);
    doc.text(examen.resultat, 168, y);
    doc.setDrawColor(224, 231, 255);
    doc.line(14, y + 3, 196, y + 3);
    y += 8;
  }

  const buffer = Buffer.from(doc.output('arraybuffer'));
  await fs.writeFile(filePath, buffer);

  if (shell?.openPath) {
    const openError = await shell.openPath(filePath);
    if (openError) {
      console.warn(`[exportExamensReport] Impossible d'ouvrir automatiquement ${filePath}: ${openError}`);
    }
  }

  return {
    success: true,
    path: filePath,
    message: `Export gÃ©nÃ©rÃ© : ${filePath}`,
  };
}
