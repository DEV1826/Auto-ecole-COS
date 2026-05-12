// src/components/tables/vehicules/index.ts

/**
 * @module tables/vehicules/index
 * @description
 * Point d’entrée pour les colonnes du tableau des véhicules.
 * Exporte les deux variantes (`admin`, `secretaire`) ainsi que la fonction générique.
 *
 * @author Stive Junior
 * @version 1.0.0
 */

export {
  getVehiculesColumns,
  getAdminVehiculesColumns,
  getSecretaireVehiculesColumns,
} from './vehicules-columns';