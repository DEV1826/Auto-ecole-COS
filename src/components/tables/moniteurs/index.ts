// src/components/tables/moniteurs/index.ts

/**
 * @module tables/moniteurs/index
 * @description
 * Point d’entrée pour les colonnes du tableau des moniteurs.
 * Exporte les deux variantes (`admin`, `secretaire`) ainsi que la fonction générique.
 *
 * @author Stive Junior
 * @version 1.0.0
 */

export {
  getMoniteursColumns,
  getAdminMoniteursColumns,
  getSecretaireMoniteursColumns,
} from './moniteurs-columns';
