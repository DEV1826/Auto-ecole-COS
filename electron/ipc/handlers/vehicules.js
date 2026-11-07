/**
 * Handlers IPC — vehicules.
 * Extrait de electron/main.js ; enregistrés via le wrapper sécurisé `handle`
 * (voir electron/ipc/security.js).
 *
 * @module electron/ipc/handlers/vehicules
 */

import {
  createVehicule,
  getAllVehicules,
  removeVehicule,
  updateVehicule,
  getVehiculeById,
  getVehiculesStats,
  getVehiculesTrends,
  getVehiculesSparklines,
  getEntretiensByVehicule,
  createEntretien,
  updateEntretien,
  deleteEntretien,
  updateVehiculeKilometrage,
  isImmatriculationUnique,
} from '../../services/vehicule.service.js';

/**
 * @param {(channel: string, handler: Function) => void} handle
 * @param {object} helpers - Utilitaires partagés fournis par main.js
 */
export function registerVehiculesHandlers(handle) {
  // =============================
  // VEHICULES
  // =============================

  /**
   * Récupère la liste paginée des véhicules avec filtres.
   */
  handle('vehicules:getAll', async (event, params) => {
    return getAllVehicules(params);
  });

  /**
   * Récupère un véhicule par son identifiant avec toutes ses relations.
   */
  handle('vehicules:getById', async (event, id) => {
    return getVehiculeById(id);
  });

  /**
   * Crée un nouveau véhicule.
   */
  handle('vehicules:create', async (event, data) => {
    return createVehicule(data);
  });

  /**
   * Met à jour un véhicule existant (patch partiel).
   */
  handle('vehicules:update', async (event, { id, data }) => {
    return updateVehicule(id, data);
  });

  /**
   * Supprime (désactive) un véhicule.
   */
  handle('vehicules:delete', async (event, id) => {
    return removeVehicule(id);
  });

  /**
   * Récupère les statistiques agrégées des véhicules.
   */
  handle('vehicules:getStats', async () => {
    return getVehiculesStats();
  });

  /**
   * Récupère les tendances évolutives des véhicules.
   */
  handle('vehicules:getTrends', async () => {
    return getVehiculesTrends();
  });

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   */
  handle('vehicules:getSparklines', async () => {
    return getVehiculesSparklines();
  });

  /**
   * Récupère tous les entretiens d’un véhicule.
   */
  handle('vehicules:getEntretiensByVehicule', async (event, vehiculeId) => {
    return getEntretiensByVehicule(vehiculeId);
  });

  /**
   * Enregistre un nouvel entretien pour un véhicule.
   */
  handle('vehicules:createEntretien', async (event, data) => {
    return createEntretien(data);
  });

  /**
   * Met à jour un entretien existant.
   */
  handle('vehicules:updateEntretien', async (event, { id, data }) => {
    return updateEntretien(id, data);
  });

  /**
   * Supprime un entretien.
   */
  handle('vehicules:deleteEntretien', async (event, id) => {
    return deleteEntretien(id);
  });

  /**
   * Met à jour le kilométrage d’un véhicule.
   */
  handle('vehicules:updateKilometrage', async (event, data) => {
    return updateVehiculeKilometrage(data);
  });

  /**
   * Vérifie si une immatriculation est unique.
   */
  handle('vehicules:isImmatriculationUnique', async (event, { immatriculation, excludeId }) => {
    return isImmatriculationUnique(immatriculation, excludeId);
  });
}
