/**
 * Handlers IPC — factures.
 * Extrait de electron/main.js ; enregistrés via le wrapper sécurisé `handle`
 * (voir electron/ipc/security.js).
 *
 * @module electron/ipc/handlers/factures
 */

import {
  getAllFactures,
  getFactureById,
  createFacture,
  updateFacture,
  deleteFacture,
  getFacturesStats,
  getFacturesTrends,
  getFacturesSparklines,
  getPaiementsByFacture,
  getFacturesByCandidat,
  sendFactureByEmail,
} from '../../services/facture.service.js';
import { generateFacturePDFDesktop } from '../../services/facture.pdf.service.js';

/**
 * @param {(channel: string, handler: Function) => void} handle
 * @param {object} helpers - Utilitaires partagés fournis par main.js
 */
export function registerFacturesHandlers(handle) {
  // =============================
  // FACTURES
  // =============================

  /**
   * Récupère la liste paginée des factures avec filtres.
   * @param {Object} event
   * @param {FacturesListParams} params
   */
  handle('factures:getAll', async (event, params) => {
    return getAllFactures(params);
  });

  /**
   * Récupère une facture par son ID (avec candidat et paiements).
   * @param {Object} event
   * @param {number} id
   */
  handle('factures:getById', async (event, id) => {
    return getFactureById(id);
  });

  /**
   * Crée une nouvelle facture (génère le numéro et le PDF).
   * @param {Object} event
   * @param {CreateFactureInput} data
   */
  handle('factures:create', async (event, data) => {
    return createFacture(data);
  });

  /**
   * Met à jour une facture (statut, échéance, notes).
   * @param {Object} event
   * @param {number} id
   * @param {UpdateFactureInput} data
   */
  handle('factures:update', async (event, { id, data }) => {
    return updateFacture(id, data);
  });

  /**
   * Supprime une facture (si aucun paiement associé).
   * @param {Object} event
   * @param {number} id
   */
  handle('factures:delete', async (event, id) => {
    return deleteFacture(id);
  });

  /**
   * Récupère les statistiques agrégées des factures.
   * @param {Object} event
   */
  handle('factures:getStats', async () => {
    return getFacturesStats();
  });

  /**
   * Récupère les tendances évolutives des factures.
   * @param {Object} event
   */
  handle('factures:getTrends', async () => {
    return getFacturesTrends();
  });

  /**
   * Récupère les données des sparklines (12 mois) pour les factures.
   * @param {Object} event
   */
  handle('factures:getSparklines', async () => {
    return getFacturesSparklines();
  });

  /**
   * Récupère tous les paiements associés à une facture.
   * @param {Object} event
   * @param {number} factureId
   */
  handle('factures:getPaiements', async (event, factureId) => {
    return getPaiementsByFacture(factureId);
  });

  /**
   * Récupère toutes les factures d’un candidat.
   * @param {Object} event
   * @param {number} candidatId
   */
  handle('factures:getByCandidat', async (event, candidatId) => {
    return getFacturesByCandidat(candidatId);
  });

  /**
   * Génère (ou régénère) le PDF d’une facture.
   * @param {Object} event
   * @param {number} id
   */
  handle('factures:generatePDF', async (event, id) => {
    return generateFacturePDFDesktop(id);
  });

  /**
   * Envoie la facture par email au candidat.
   * @param {Object} event
   * @param {number} id
   */
  handle('factures:sendByEmail', async (event, id) => {
    return sendFactureByEmail(id);
  });
}
