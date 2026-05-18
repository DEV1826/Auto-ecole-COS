// src/lib/validators/admin.validator.ts

/**
 * @module lib/validators/admin.validator
 * @description
 * Schémas de validation Zod pour l'administration (logs d'audit, configuration entreprise).
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
 * Périodes prédéfinies pour le filtrage des logs d'audit.
 */
export const PERIOD_VALUES = ['today', 'week', 'month', 'all'] as const;

/**
 * Statuts possibles pour les logs d'audit.
 */
export const STATUT_VALUES = ['SUCCESS', 'FAILED'] as const;

// ============================================================
// SCHÉMAS
// ============================================================

/**
 * Schéma pour les paramètres de la liste paginée des logs d'audit.
 * Tous les champs sont optionnels avec des valeurs par défaut.
 */
export const auditLogsListSchema = z.object({
  /** Page courante (1-indexed) */
  page: z.number().int().positive().default(1).optional(),
  /** Nombre d'éléments par page (max 200) */
  limit: z.number().int().positive().max(200).default(20).optional(),
  /** Filtrer par ID utilisateur */
  utilisateurId: positiveIntSchema.optional(),
  /** Filtrer par action (recherche partielle) */
  action: z.string().max(100).optional(),
  /** Filtrer par ressource (recherche partielle) */
  ressource: z.string().max(100).optional(),
  /** Filtrer par statut (SUCCESS | FAILED) */
  statut: z.enum(STATUT_VALUES).optional(),
  /** Date de début (inclus) */
  dateDebut: dateSchema.optional(),
  /** Date de fin (inclus) */
  dateFin: dateSchema.optional(),
  /** Période prédéfinie (remplace dateDebut/dateFin) */
  period: z.enum(PERIOD_VALUES).optional(),
  /** Recherche textuelle (action, ressource, description) */
  search: z.string().max(200).optional(),
});

/**
 * Schéma pour la mise à jour de la configuration de l'entreprise.
 * Tous les champs sont optionnels pour un patch partiel.
 */
export const updateCompanyConfigSchema = z.object({
  /** Nom officiel de l'auto-école */
  nom: z.string().min(1).max(255).optional(),
  /** Adresse postale */
  adresse: z.string().max(500).nullable().optional(),
  /** Numéro de téléphone principal */
  telephone: z.string().max(50).nullable().optional(),
  /** Email de contact */
  email: z.string().email().max(255).nullable().optional(),
  /** Site web */
  siteWeb: z.string().url().max(255).nullable().optional(),
  /** Numéro d'identification fiscale */
  numeroFiscal: z.string().max(100).nullable().optional(),
  /** Chemin du logo (stocké localement) */
  logoPath: z.string().max(500).nullable().optional(),
});

// ============================================================
// TYPES INFÉRÉS
// ============================================================

export type AuditLogsListInput = z.infer<typeof auditLogsListSchema>;
export type UpdateCompanyConfigInput = z.infer<typeof updateCompanyConfigSchema>;
