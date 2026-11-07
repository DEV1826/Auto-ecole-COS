/**
 * Handlers IPC — paiements.
 * Extrait de electron/main.js ; enregistrés via le wrapper sécurisé `handle`
 * (voir electron/ipc/security.js).
 *
 * @module electron/ipc/handlers/paiements
 */

import {
  getAllPaiements,
  getPaiementById,
  createPaiement,
  updatePaiement,
  deletePaiement,
  getPaiementsStats,
  getPaiementsTrends,
  getPaiementsSparklines,
  getPaiementsByCandidat,
  getSoldeCandidat,
  getResumeMensuel,
  printReceipt,
} from '../../services/paiement.service.js';

/**
 * @param {(channel: string, handler: Function) => void} handle
 * @param {object} helpers - Utilitaires partagés fournis par main.js
 */
export function registerPaiementsHandlers(handle) {
  // =============================
  // PAIEMENTS
  // =============================

  /**
   * Récupère la liste paginée des paiements avec filtres optionnels.
   * @param {Object} event - Objet IPC
   * @param {PaiementsListParams} params - Paramètres de pagination/filtres
   */
  handle('paiements:getAll', async (event, params) => {
    return getAllPaiements(params);
  });

  /**
   * Récupère un paiement par son identifiant (avec candidat et facture).
   * @param {Object} event
   * @param {number} id - Identifiant du paiement
   */
  handle('paiements:getById', async (event, id) => {
    return getPaiementById(id);
  });

  /**
   * Crée un nouveau paiement, met à jour la caisse et la facture associée.
   * @param {Object} event
   * @param {CreatePaiementInput} data - Données du paiement
   */
  handle('paiements:create', async (event, data) => {
    return createPaiement(data);
  });

  /**
   * Met à jour les champs non‑financiers d’un paiement (référence, note, factureId).
   * @param {Object} event
   * @param {number} id - Identifiant du paiement
   * @param {UpdatePaiementInput} data - Champs à modifier
   */
  handle('paiements:update', async (event, { id, data }) => {
    return updatePaiement(id, data);
  });

  /**
   * Supprime définitivement un paiement et annule l’entrée en caisse.
   * @param {Object} event
   * @param {number} id - Identifiant du paiement
   */
  handle('paiements:delete', async (event, id) => {
    return deletePaiement(id);
  });

  /**
   * Récupère les statistiques complètes des paiements (dashboard).
   * @param {Object} event
   */
  handle('paiements:getStats', async () => {
    return getPaiementsStats();
  });

  /**
   * Récupère les tendances évolutives des paiements (mois courant vs précédent).
   * @param {Object} event
   */
  handle('paiements:getTrends', async () => {
    return getPaiementsTrends();
  });

  /**
   * Récupère les sparklines des paiements pour les 12 derniers mois.
   * @param {Object} event
   */
  handle('paiements:getSparklines', async () => {
    return getPaiementsSparklines();
  });

  /**
   * Récupère tous les paiements d’un candidat spécifique.
   * @param {Object} event
   * @param {number} candidatId
   */
  handle('paiements:getByCandidat', async (event, candidatId) => {
    return getPaiementsByCandidat(candidatId);
  });

  /**
   * Calcule le solde d’un candidat (total facturé - total payé).
   * @param {Object} event
   * @param {number} candidatId
   */
  handle('paiements:getSoldeCandidat', async (event, candidatId) => {
    return getSoldeCandidat(candidatId);
  });

  /**
   * Récupère le résumé mensuel des paiements pour une année et un mois donnés.
   * @param {Object} event
   * @param {number} annee
   * @param {number} mois
   */
  handle('paiements:getResumeMensuel', async (event, annee, mois) => {
    return getResumeMensuel(annee, mois);
  });

  /**
   * Génère le reçu d’un paiement (export PDF – stub pour l’instant).
   * @param {Object} event
   * @param {number} id
   */
  handle('paiements:printReceipt', async (event, id) => {
    return printReceipt(id);
  });
}
