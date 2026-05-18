// /home/stive-junior/Auto-ecole-COS/electron/services/formation.service.js

/**
 * Service de gestion des formations (offres pédagogiques)
 *
 * @module formationService
 * @description
 * Fournit toutes les opérations CRUD pour les formations, les statistiques agrégées,
 * les tendances, les sparklines, ainsi que l’accès aux inscriptions mensuelles
 * et aux candidats inscrits.
 *
 * Toutes les fonctions utilisent le wrapper `executePrismaOperation` pour une
 * gestion homogène des erreurs. Les dates sont manipulées au format ISO.
 *
 * @author Stive Junior
 * @version 2.0.0
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
} from './prisma.client.js';

// ===============================
// CONSTANTES & UTILITAIRES INTERNES
// ===============================

/** Liste des catégories de permis valides (basée sur le schéma Prisma) */
const VALID_CATEGORIES = ['A', 'B', 'C', 'D', 'BE'];

/**
 * Construit l'objet `where` pour la liste paginée avec filtres.
 * @param {Object} params
 * @param {string} [params.search] - Recherche textuelle sur le nom
 * @param {string} [params.categorie] - Catégorie de permis
 * @param {boolean} [params.actif] - Statut actif/inactif
 * @returns {Object} Condition Prisma `where`
 */
function buildWhereClause({ search, categorie, actif }) {
  const where = {};

  if (search && search.trim().length > 0) {
    const term = search.trim();
    where.nom = { contains: term, mode: 'insensitive' };
  }

  if (categorie && VALID_CATEGORIES.includes(categorie)) {
    where.categorie = categorie;
  }

  if (actif !== undefined) {
    where.actif = actif === true;
  }

  return where;
}

// ===============================
// FONCTIONS PRINCIPALES (exportées)
// ===============================

/**
 * Récupère la liste des formations avec filtres optionnels.
 * Si `page` et `limit` sont fournis, la réponse est paginée.
 * Sinon, retourne toutes les formations correspondant aux filtres.
 *
 * @param {Object} [params] - Paramètres de pagination et filtres
 * @param {number} [params.page] - Numéro de page (1-indexed) - optionnel
 * @param {number} [params.limit] - Nombre d'éléments par page - optionnel
 * @param {string} [params.search] - Recherche textuelle (nom)
 * @param {string} [params.categorie] - Catégorie de permis (A, B, C, D, BE)
 * @param {boolean} [params.actif] - Filtre sur l'état actif/inactif
 * @returns {Promise<Object>} Réponse avec formations, total, page, limit, totalPages (si paginé)
 *                             ou directement un tableau de formations si non paginé.
 */
export async function getAllFormations(params = {}) {
  const { page, limit, ...filters } = params;
  const where = buildWhereClause(filters);

  if (page !== undefined && limit !== undefined) {
    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
    const take = Math.max(1, limit);
    return executePrismaOperation(async () => {
      const [formations, total] = await Promise.all([
        findMany(
          'formation',
          where,
          {
            tarifs: {
              orderBy: { dateDebut: 'desc' },
              take: 1,
            },
          },
          { createdAt: 'desc' },
          skip,
          take
        ),
        count('formation', where),
      ]);
      return {
        formations,
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      };
    }, 'Erreur lors de la récupération des formations');
  } else {
    return executePrismaOperation(async () => {
      const formations = await findMany(
        'formation',
        where,
        {
          tarifs: {
            orderBy: { dateDebut: 'desc' },
            take: 1,
          },
        },
        { createdAt: 'desc' }
      );
      return formations;
    }, 'Erreur lors de la récupération des formations');
  }
}

/**
 * Récupère une formation par son identifiant avec toutes ses relations.
 * Charge les candidats inscrits (avec leurs informations de base) et les tarifs historiques.
 *
 * @param {number} id - Identifiant de la formation
 * @returns {Promise<Formation>} Formation complète (avec tarifs et candidats)
 * @throws {Error} Si la formation n'existe pas
 */
export async function getFormationById(id) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant formation invalide.');
  }

  return executePrismaOperation(async () => {
    const formation = await findUnique(
      'formation',
      { id },
      {
        tarifs: { orderBy: { dateDebut: 'desc' } },
        candidats: {
          include: {
            candidat: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
                telephone: true,
                statut: true,
                categorie: true,
                dateInscription: true,
              },
            },
          },
          orderBy: { dateDebut: 'desc' },
        },
      }
    );

    if (!formation) {
      throw new Error('Formation non trouvée.');
    }

    // Transformer la structure FormationCandidat en une liste plate de candidats
    // pour faciliter l'utilisation côté frontend
    const candidatsInscrits = formation.candidats.map((fc) => ({
      ...fc.candidat,
      formationCandidat: {
        id: fc.id,
        heuresCodeEffectuees: fc.heuresCodeEffectuees,
        heuresConduiteEffectuees: fc.heuresConduiteEffectuees,
        montantTotal: fc.montantTotal,
        dateDebut: fc.dateDebut,
        dateFin: fc.dateFin,
      },
    }));

    return {
      ...formation,
      candidatsInscrits,
    };
  }, 'Erreur lors de la récupération de la formation');
}

/**
 * Crée une nouvelle formation.
 *
 * @param {Object} data - Données de la formation
 * @param {string} data.nom - Nom de la formation
 * @param {string} [data.description] - Description
 * @param {number} data.prixTotal - Prix total (FCFA)
 * @param {number} data.heuresCode - Heures de code
 * @param {number} data.heuresConduite - Heures de conduite
 * @param {string} data.categorie - Catégorie de permis (A, B, C, D, BE)
 * @param {boolean} [data.actif=true] - Formation active ou non
 * @returns {Promise<Formation>} Formation créée
 */
export async function createFormation(data) {
  // Validation basique
  if (!data.nom?.trim()) {
    throw new Error('Le nom de la formation est obligatoire.');
  }
  if (!data.prixTotal || data.prixTotal <= 0) {
    throw new Error('Le prix total doit être un nombre positif.');
  }
  if (!data.heuresCode || data.heuresCode <= 0) {
    throw new Error('Le nombre d’heures de code doit être positif.');
  }
  if (!data.heuresConduite || data.heuresConduite <= 0) {
    throw new Error('Le nombre d’heures de conduite doit être positif.');
  }
  if (!data.categorie || !VALID_CATEGORIES.includes(data.categorie)) {
    throw new Error(`Catégorie invalide. Valeurs autorisées : ${VALID_CATEGORIES.join(', ')}`);
  }

  const createData = {
    nom: data.nom.trim(),
    description: data.description?.trim() || null,
    prixTotal: data.prixTotal,
    heuresCode: data.heuresCode,
    heuresConduite: data.heuresConduite,
    categorie: data.categorie,
    actif: data.actif !== undefined ? data.actif : true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return executePrismaOperation(async () => {
    // Créer la formation
    const formation = await create('formation', createData);

    // Créer un tarif historique initial
    await create('tarif', {
      formationId: formation.id,
      prix: formation.prixTotal,
      dateDebut: new Date(),
    });

    return formation;
  }, 'Erreur lors de la création de la formation');
}

/**
 * Met à jour une formation existante (patch partiel).
 * Si le prix total est modifié, un nouveau tarif est automatiquement créé.
 *
 * @param {number} id - Identifiant de la formation
 * @param {Object} data - Champs à mettre à jour (tous optionnels)
 * @returns {Promise<Formation>} Formation mise à jour
 */
export async function updateFormation(id, data) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant formation invalide.');
  }

  // Vérifier l'existence
  const existing = await findUnique('formation', { id });
  if (!existing) {
    throw new Error('Formation non trouvée.');
  }

  const updateData = {
    updatedAt: new Date(),
  };

  const updatableFields = [
    'nom',
    'description',
    'prixTotal',
    'heuresCode',
    'heuresConduite',
    'categorie',
    'actif',
  ];
  for (const field of updatableFields) {
    if (data[field] !== undefined) {
      if (typeof data[field] === 'string') {
        updateData[field] = data[field].trim() || null;
      } else {
        updateData[field] = data[field];
      }
    }
  }

  // Validation de la catégorie si modifiée
  if (updateData.categorie && !VALID_CATEGORIES.includes(updateData.categorie)) {
    throw new Error(`Catégorie invalide. Valeurs autorisées : ${VALID_CATEGORIES.join(', ')}`);
  }

  return executePrismaOperation(async () => {
    // Mise à jour de la formation
    const formation = await update('formation', { id }, updateData);

    // Si le prix total a changé, créer un nouveau tarif
    if (data.prixTotal !== undefined && data.prixTotal !== existing.prixTotal) {
      await create('tarif', {
        formationId: id,
        prix: formation.prixTotal,
        dateDebut: new Date(),
      });
    }

    return formation;
  }, 'Erreur lors de la mise à jour de la formation');
}

/**
 * Supprime logiquement une formation (soft delete) – ici, on désactive plutôt
 * que de supprimer physiquement, car des candidats peuvent y être inscrits.
 * Pour une suppression réelle, utilisez `deleteFormationPermanent`.
 *
 * @param {number} id - Identifiant de la formation
 * @returns {Promise<{ success: boolean; message: string }>}
 */
export async function deleteFormation(id) {
  if (!id || isNaN(id)) {
    throw new Error('Identifiant formation invalide.');
  }

  return executePrismaOperation(async () => {
    const existing = await findUnique('formation', { id });
    if (!existing) {
      throw new Error('Formation non trouvée.');
    }

    // Désactivation plutôt que suppression physique
    await update('formation', { id }, { actif: false, updatedAt: new Date() });
    return { success: true, message: 'Formation désactivée avec succès.' };
  }, 'Erreur lors de la désactivation de la formation');
}

// ===============================
// STATISTIQUES, TENDANCES ET SPARKLINES
// ===============================

/**
 * Récupère les statistiques agrégées des formations.
 *
 * @returns {Promise<FormationsStats>} Métriques (total, actives, prix moyen, inscriptions)
 */
export async function getFormationsStats() {
  return executePrismaOperation(async () => {
    const totalFormations = await count('formation');
    const formationsActives = await count('formation', { actif: true });

    const formationsActivesList = await findMany('formation', { actif: true }, {}, {}, 0, 100, {
      prixTotal: true,
      heuresConduite: true,
    });

    const prixMoyen =
      formationsActivesList.length > 0
        ? formationsActivesList.reduce((sum, f) => sum + f.prixTotal, 0) /
          formationsActivesList.length
        : 0;

    const dureeMoyenneConduite =
      formationsActivesList.length > 0
        ? formationsActivesList.reduce((sum, f) => sum + f.heuresConduite, 0) /
          formationsActivesList.length
        : 0;

    // Nombre total d'inscriptions (via FormationCandidat)
    const totalInscriptions = await count('formationCandidat');

    // Inscriptions du mois en cours
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const inscriptionsMois = await count('formationCandidat', { dateDebut: { gte: startOfMonth } });

    return {
      totalFormations,
      formationsActives,
      prixMoyen: Math.round(prixMoyen),
      dureeMoyenneConduite: Math.round(dureeMoyenneConduite),
      totalInscriptions,
      inscriptionsMois,
    };
  }, 'Erreur lors du calcul des statistiques des formations');
}

/**
 * Récupère les tendances évolutives (mois en cours vs mois précédent).
 *
 * @returns {Promise<FormationsTrends>} Tendances en pourcentage
 */
export async function getFormationsTrends() {
  return executePrismaOperation(async () => {
    const now = new Date();
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = startThisMonth;

    // Formations actives (comparaison directe, pas de variation mensuelle)
    const formationsActives = await count('formation', { actif: true });
    // On calcule la variation sur le nombre total de formations (si nécessaire)
    // const totalFormationsPrev = await count('formation', { createdAt: { lt: startThisMonth } });
    // const totalFormationsCurrent = await count('formation', { createdAt: { lt: new Date() } });
    // const totalFormationsTrend = totalFormationsPrev === 0 ? totalFormationsCurrent > 0 ? 100 : 0 : ((totalFormationsCurrent - totalFormationsPrev) / totalFormationsPrev) * 100;

    // Prix moyen (formations actives) – variation mois précédent
    const [currentActive, prevActive] = await Promise.all([
      findMany('formation', { actif: true }, {}, {}, 0, 100, { prixTotal: true }),
      findMany('formation', { actif: true, createdAt: { lt: startThisMonth } }, {}, {}, 0, 100, {
        prixTotal: true,
      }),
    ]);
    const avgPriceCurrent =
      currentActive.length > 0
        ? currentActive.reduce((s, f) => s + f.prixTotal, 0) / currentActive.length
        : 0;
    const avgPricePrev =
      prevActive.length > 0
        ? prevActive.reduce((s, f) => s + f.prixTotal, 0) / prevActive.length
        : 0;
    const prixMoyenTrend =
      avgPricePrev === 0
        ? avgPriceCurrent > 0
          ? 100
          : 0
        : ((avgPriceCurrent - avgPricePrev) / avgPricePrev) * 100;

    // Inscriptions : ce mois vs mois dernier
    const [inscriptionsCurrent, inscriptionsPrev] = await Promise.all([
      count('formationCandidat', { dateDebut: { gte: startThisMonth } }),
      count('formationCandidat', { dateDebut: { gte: startLastMonth, lt: endLastMonth } }),
    ]);
    const inscriptionsTrend =
      inscriptionsPrev === 0
        ? inscriptionsCurrent > 0
          ? 100
          : 0
        : ((inscriptionsCurrent - inscriptionsPrev) / inscriptionsPrev) * 100;

    // Inscriptions du mois (variation vs mois dernier)
    const inscriptionsMoisCurrent = inscriptionsCurrent;
    const inscriptionsMoisPrev = inscriptionsPrev;
    const inscriptionsMoisTrend =
      inscriptionsMoisPrev === 0
        ? inscriptionsMoisCurrent > 0
          ? 100
          : 0
        : ((inscriptionsMoisCurrent - inscriptionsMoisPrev) / inscriptionsMoisPrev) * 100;

    return {
      formationsActives: formationsActives,
      prixMoyen: parseFloat(prixMoyenTrend.toFixed(1)),
      totalInscriptions: parseFloat(inscriptionsTrend.toFixed(1)),
      inscriptionsMois: parseFloat(inscriptionsMoisTrend.toFixed(1)),
    };
  }, 'Erreur lors du calcul des tendances des formations');
}

/**
 * Récupère les données des sparklines pour les 12 derniers mois.
 *
 * @returns {Promise<FormationsSparklineData>} Sparklines pour formations actives, prix moyen, inscriptions
 */
export async function getFormationsSparklines() {
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

    const formationsActivesValues = [];
    const prixMoyenValues = [];
    const totalInscriptionsValues = [];
    const inscriptionsMoisValues = [];

    for (const m of months) {
      // Formations actives à la fin du mois (créées avant ou pendant le mois)
      const actives = await count('formation', {
        actif: true,
        createdAt: { lte: m.end },
      });
      formationsActivesValues.push(actives);

      // Prix moyen des formations actives pendant ce mois
      const formationsInMonth = await findMany(
        'formation',
        {
          actif: true,
          createdAt: { lte: m.end },
        },
        {},
        {},
        0,
        100,
        { prixTotal: true }
      );
      const avgPrice =
        formationsInMonth.length > 0
          ? formationsInMonth.reduce((s, f) => s + f.prixTotal, 0) / formationsInMonth.length
          : 0;
      prixMoyenValues.push(Math.round(avgPrice));

      // Inscriptions totales (cumulées) jusqu'à la fin du mois
      const totalInsc = await count('formationCandidat', { dateDebut: { lte: m.end } });
      totalInscriptionsValues.push(totalInsc);

      // Inscriptions du mois
      const inscMois = await count('formationCandidat', {
        dateDebut: { gte: m.start, lte: m.end },
      });
      inscriptionsMoisValues.push(inscMois);
    }

    return {
      formationsActivesSparkline: {
        values: formationsActivesValues,
        labels: months.map((m) => m.label),
      },
      prixMoyenSparkline: { values: prixMoyenValues, labels: months.map((m) => m.label) },
      totalInscriptionsSparkline: {
        values: totalInscriptionsValues,
        labels: months.map((m) => m.label),
      },
      inscriptionsMoisSparkline: {
        values: inscriptionsMoisValues,
        labels: months.map((m) => m.label),
      },
    };
  }, 'Erreur lors de la génération des sparklines');
}

// ===============================
// FONCTIONS SPÉCIFIQUES POUR LE DÉTAIL D'UNE FORMATION
// ===============================

/**
 * Récupère le nombre d’inscriptions par mois pour une formation donnée.
 * Les données sont retournées sous forme de tableau d’objets { month, inscriptions }
 * pour les 12 derniers mois.
 *
 * @param {number} formationId - Identifiant de la formation
 * @returns {Promise<MonthlyInscriptionData[]>} Liste des inscriptions mensuelles
 */
export async function getMonthlyInscriptions(formationId) {
  if (!formationId || isNaN(formationId)) {
    throw new Error('Identifiant formation invalide.');
  }

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

    const result = [];
    for (const m of months) {
      const count = await prisma.formationCandidat.count({
        where: {
          formationId,
          dateDebut: { gte: m.start, lte: m.end },
        },
      });
      result.push({ month: m.label, inscriptions: count });
    }
    return result;
  }, 'Erreur lors de la récupération des inscriptions mensuelles');
}

/**
 * Récupère la liste des candidats inscrits à une formation (avec leurs informations détaillées).
 *
 * @param {number} formationId - Identifiant de la formation
 * @returns {Promise<Candidat[]>} Liste des candidats
 */
export async function getCandidatsByFormation(formationId) {
  if (!formationId || isNaN(formationId)) {
    throw new Error('Identifiant formation invalide.');
  }

  return executePrismaOperation(async () => {
    const formationsCandidats = await findMany(
      'formationCandidat',
      { formationId },
      {
        candidat: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            statut: true,
            categorie: true,
            dateInscription: true,
            numeroPermis: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      { dateDebut: 'desc' }
    );

    // Retourner la liste plate des candidats (sans les métadonnées de liaison)
    return formationsCandidats.map((fc) => fc.candidat);
  }, 'Erreur lors de la récupération des candidats inscrits');
}

/**
 * Récupère les statistiques de popularité pour chaque formation active.
 * Retourne un tableau de { formationId, name, inscriptions, trend }.
 *
 * @returns {Promise<Array<{ formationId: number; name: string; inscriptions: number; trend: number }>>}
 */
export async function getPopularityStats() {
  return executePrismaOperation(async () => {
    // Récupérer toutes les formations actives
    const formations = await findMany('formation', { actif: true }, {}, {}, 0, 100, {
      id: true,
      nom: true,
    });
    const now = new Date();
    const startCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = startCurrentMonth;

    const result = [];
    for (const f of formations) {
      // Nombre total d'inscriptions
      const totalInscriptions = await count('formationCandidat', { formationId: f.id });
      // Inscriptions du mois dernier
      const inscriptionsLastMonth = await count('formationCandidat', {
        formationId: f.id,
        dateDebut: { gte: startLastMonth, lt: endLastMonth },
      });
      // Inscriptions du mois courant (non terminé, on prend jusqu'à maintenant)
      const inscriptionsCurrentMonth = await count('formationCandidat', {
        formationId: f.id,
        dateDebut: { gte: startCurrentMonth },
      });
      let trend = 0;
      if (inscriptionsLastMonth > 0) {
        trend = ((inscriptionsCurrentMonth - inscriptionsLastMonth) / inscriptionsLastMonth) * 100;
      } else if (inscriptionsCurrentMonth > 0) {
        trend = 100;
      }
      result.push({
        formationId: f.id,
        name: f.nom,
        inscriptions: totalInscriptions,
        trend: Math.round(trend),
      });
    }
    return result;
  }, 'Erreur lors de la récupération des statistiques de popularité');
}

/**
 * Récupère le nombre d’inscriptions (candidats) pour une formation donnée.
 *
 * @param {number} formationId - Identifiant de la formation
 * @returns {Promise<number>} Nombre d'inscriptions
 */
export async function getNbInscriptions(formationId) {
  if (!formationId || isNaN(formationId)) {
    throw new Error('Identifiant formation invalide.');
  }
  return executePrismaOperation(async () => {
    return count('formationCandidat', { formationId });
  }, 'Erreur lors du comptage des inscriptions');
}
