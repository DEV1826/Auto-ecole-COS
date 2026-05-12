// src/components/tables/paiements/index.ts

/**
 * @module tables/paiements/index
 * @description
 * Point d’entrée pour les colonnes du tableau des paiements.
 * Exporte les deux variantes (`admin`, `secretaire`) ainsi que la fonction générique.
 *
 * @author Stive Junior
 * @version 1.0.0
 */

export {
  getPaiementsColumns,
  getAdminPaiementsColumns,
  getSecretairePaiementsColumns,
} from './paiements-columns';
