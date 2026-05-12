// src/components/tables/examens/index.ts

/**
 * @module tables/examens/index
 * @description
 * Point d’entrée pour les colonnes du tableau des examens.
 * Exporte les trois variantes (`admin`, `secretaire`, `moniteur`) ainsi que la fonction générique.
 *
 * @author Stive Junior
 * @version 1.0.0
 */

export {
  getExamensColumns,
  getAdminExamensColumns,
  getSecretaireExamensColumns,
  getMoniteurExamensColumns,
} from './examens-columns';