// src/components/tables/rapports/index.ts

/**
 * @module tables/rapports/index
 * @description
 * Point d’entrée pour les colonnes des tableaux de rapports.
 * Exporte toutes les fonctions de génération de colonnes ainsi que les types associés.
 *
 * @author Stive Junior
 * @version 1.0.0
 */

export {
  getRapportFinancierColumns,
  getStatutsCandidatsColumns,
  getTypeLeconsColumns,
  getMoniteursHeuresColumns,
  getRapportVehiculesColumns,
  getRapportColumns,
} from './rapports-columns';

export type {
  RapportType,
  RapportFinancierRow,
  StatutCandidatRow,
  TypeLeconRow,
  MoniteurHeuresRow,
  RapportVehiculesRow,
} from './rapports-columns';
