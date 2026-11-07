/**
 * Handlers IPC — depenses.
 * Extrait de electron/main.js ; enregistrés via le wrapper sécurisé `handle`
 * (voir electron/ipc/security.js).
 *
 * @module electron/ipc/handlers/depenses
 */

import {
  getAllDepenses,
  getDepenseById,
  createDepense,
  updateDepense,
  deleteDepense,
  getDepensesStats,
  getDepensesTrends,
  getDepensesSparklines,
  getDepensesByVehicule,
  attachReceiptToDepense,
  getDepensesTrendChartData,
} from '../../services/depense.service.js';

/**
 * @param {(channel: string, handler: Function) => void} handle
 * @param {object} helpers - Utilitaires partagés fournis par main.js
 */
export function registerDepensesHandlers(handle) {
  // =============================
  // DEPENSES
  // =============================

  /**
   * Récupère la liste paginée des dépenses avec filtres optionnels.
   * @param {Object} event - Objet IPC
   * @param {DepensesListParams} params - Paramètres de pagination/filtres
   */
  handle('depenses:getAll', async (event, params) => {
    return getAllDepenses(params);
  });

  /**
   * Récupère une dépense par son identifiant.
   * @param {Object} event
   * @param {number} id - Identifiant de la dépense
   */
  handle('depenses:getById', async (event, id) => {
    return getDepenseById(id);
  });

  /**
   * Crée une nouvelle dépense, enregistre la sortie en caisse et retourne la dépense créée.
   * @param {Object} event
   * @param {CreateDepenseInput} data - Données de la dépense
   */
  handle('depenses:create', async (event, data) => {
    return createDepense(data);
  });

  /**
   * Met à jour les champs modifiables d’une dépense (catégorie, montant, description, fournisseur, référence, véhicule, date).
   * Ne modifie pas les champs liés à la transaction de caisse (montant, date) pour éviter les incohérences.
   * @param {Object} event
   * @param {number} id - Identifiant de la dépense
   * @param {UpdateDepenseInput} data - Champs à modifier
   */
  handle('depenses:update', async (event, { id, data }) => {
    return updateDepense(id, data);
  });

  /**
   * Supprime une dépense et annule la sortie correspondante en caisse.
   * @param {Object} event
   * @param {number} id - Identifiant de la dépense
   */
  handle('depenses:delete', async (event, id) => {
    return deleteDepense(id);
  });

  /**
   * Récupère les statistiques agrégées des dépenses (total, moyenne, par catégorie, etc.).
   * @param {Object} event
   */
  handle('depenses:getStats', async () => {
    return getDepensesStats();
  });

  /**
   * Récupère les tendances évolutives des dépenses (mois courant vs précédent, catégories en hausse/baisse, etc.).
   * @param {Object} event
   */
  handle('depenses:getTrends', async () => {
    return getDepensesTrends();
  });

  /**
   * Récupère les données des tendances évolutives des dépenses pour les graphiques (évolution mensuelle, répartition par catégorie, etc.).
   * @param {Object} event
   */
  handle('depenses:getTrendChartData', async () => {
    return getDepensesTrendChartData();
  });

  /**
   * Récupère les données des sparklines (12 mois) pour les dépenses.
   * @param {Object} event
   */
  handle('depenses:getSparklines', async () => {
    return getDepensesSparklines();
  });

  /**
   * Récupère toutes les dépenses associées à un véhicule spécifique.
   * @param {Object} event
   * @param {number} vehiculeId
   */
  handle('depenses:getByVehicule', async (event, vehiculeId) => {
    return getDepensesByVehicule(vehiculeId);
  });

  /**
   * Attache un justificatif (chemin de fichier) à une dépense existante.
   * @param {Object} event
   * @param {number} id - Identifiant de la dépense
   * @param {string} filePath - Chemin du
   */
  handle('depenses:attachReceipt', async (event, { id, filePath }) => {
    return attachReceiptToDepense(id, filePath);
  });
}
