// src/components/tables/factures/index.ts

/**
 * @module tables/factures/index
 * @description
 * Point d’entrée pour les colonnes du tableau des factures.
 * Exporte les deux variantes (`admin`, `secretaire`) ainsi que la fonction générique.
 *
 * @author Stive Junior
 * @version 1.0.0
 */

export {
  getFacturesColumns,
  getAdminFacturesColumns,
  getSecretaireFacturesColumns,
} from './factures-columns';