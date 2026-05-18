// src/lib/validators/documents.validator.ts

/**
 * @module lib/validators/documents.validator
 * @description
 * Schémas de validation Zod pour les opérations sur les documents.
 * Réutilise les schémas de base (`positiveIntSchema`, `dateSchema`, etc.)
 * définis dans `auth.validator.ts`.
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { z } from 'zod';
import { positiveIntSchema, dateSchema } from './auth.validator';

// ============================================================
// CONSTANTES
// ============================================================

/**
 * Types de documents autorisés.
 * @see {@link Document.type}
 */
export const DOCUMENT_TYPE_VALUES = [
  'permis',
  'carte_identite',
  'facture',
  'recu',
  'autre',
] as const;

/**
 * Périodes prédéfinies pour le filtrage.
 */
export const PERIOD_VALUES = ['today', 'week', 'month', 'all'] as const;

// ============================================================
// SCHÉMAS SPÉCIFIQUES
// ============================================================

/**
 * Schéma pour la création d’un document (téléversement).
 * - `candidatId` : identifiant du candidat propriétaire
 * - `type` : type de document (parmi DOCUMENT_TYPE_VALUES)
 * - `nomFichier` : nom original du fichier (max 255 caractères)
 * - `chemin` : chemin d’accès au fichier (max 500 caractères)
 * - `taille` : taille en octets (optionnel, ≥ 0)
 * - `mimeType` : type MIME (optionnel, max 100 caractères)
 * - `uploadedAt` : date de téléversement (par défaut maintenant)
 */
export const createDocumentSchema = z.object({
  candidatId: positiveIntSchema,
  type: z.enum(DOCUMENT_TYPE_VALUES, { message: 'Type de document invalide.' }),
  nomFichier: z.string().min(1, 'Le nom du fichier est requis.').max(255),
  chemin: z.string().min(1, 'Le chemin du fichier est requis.').max(500),
  taille: z.number().int().min(0).optional().nullable(),
  mimeType: z.string().max(100).optional().nullable(),
  uploadedAt: dateSchema.optional(),
});

/**
 * Schéma pour la mise à jour d’un document (rare, mais possible).
 * Seuls certains champs peuvent être modifiés.
 */
export const updateDocumentSchema = z.object({
  id: positiveIntSchema,
  type: z.enum(DOCUMENT_TYPE_VALUES).optional(),
  nomFichier: z.string().max(255).optional(),
  chemin: z.string().max(500).optional(),
  taille: z.number().int().min(0).optional().nullable(),
  mimeType: z.string().max(100).optional().nullable(),
});

/**
 * Schéma pour la suppression d’un document.
 */
export const deleteDocumentSchema = z.object({
  id: positiveIntSchema,
});

/**
 * Schéma pour la récupération de la liste paginée des documents.
 * Filtres : page, limit, type, candidatId, period, search.
 */
export const documentsListSchema = z.object({
  page: z.number().int().positive().default(1).optional(),
  limit: z.number().int().positive().max(200).default(20).optional(),
  type: z.enum(DOCUMENT_TYPE_VALUES).optional(),
  candidatId: positiveIntSchema.optional(),
  period: z.enum(PERIOD_VALUES).optional(),
  search: z.string().max(100).optional(),
});

// ============================================================
// TYPES INFÉRÉS
// ============================================================

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type DeleteDocumentInput = z.infer<typeof deleteDocumentSchema>;
export type DocumentsListInput = z.infer<typeof documentsListSchema>;
