// src/components/tables/formations/index.ts

/**
 * @module tables/formations/index
 * @description
 * Point d’entrée pour les colonnes du tableau des formations.
 * Exporte les deux variantes (`admin`, `secretaire`) ainsi que la fonction générique.
 *
 * @author Stive Junior
 * @version 1.0.0
 */

export {
  getFormationsColumns,
  getAdminFormationsColumns,
  getSecretaireFormationsColumns,
} from './formations-columns';
