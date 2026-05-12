// src/components/tables/factory/index.ts

/**
 * @module tables/factory
 * @description Point d'entrée pour l'usine à colonnes
 */

export {
  createEditableColumn,
  createBadgeColumn,
  createAvatarColumn,
  createAvatarWithTextColumn,
} from './column-factory';
export { EditableCell } from './editable-cell';
export type * from './types';
