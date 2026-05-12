// src/components/tables/documents/index.ts

/**
 * @module tables/documents/index
 * @description
 * Point d’entrée pour les colonnes du tableau des documents.
 * Exporte les trois variantes de colonnes (`admin`, `secretaire`, `candidat`)
 * ainsi que la fonction générique `getDocumentsColumns`.
 *
 * @author Stive Junior
 * @version 1.0.0
 */

export {
  getDocumentsColumns,
  getAdminDocumentsColumns,
  getSecretaireDocumentsColumns,
  getCandidatDocumentsColumns,
} from './documents-columns';
