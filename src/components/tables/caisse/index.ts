// src/components/tables/caisse/index.ts

/**
 * @module tables/caisse/index
 * @description
 * Point d’entrée pour les colonnes du tableau des mouvements de caisse.
 * Exporte les deux variantes (`admin`, `secretaire`) ainsi que la fonction générique.
 *
 * @author Stive Junior
 * @version 1.0.0
 */

export {
  getCaisseColumns,
  getAdminCaisseColumns,
  getSecretaireCaisseColumns,
} from './caisse-columns';
