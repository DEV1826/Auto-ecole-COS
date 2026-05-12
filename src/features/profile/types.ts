/**
 * @module features/profile/types
 * @description
 * Types, interfaces et validateurs Zod pour le module de profil utilisateur VitaCare.
 *
 * Ce fichier centralise :
 * - Les schémas de validation Zod pour chaque section de profil
 * - Les types inférés correspondants
 * - Les interfaces de props des composants de profil
 * - Les configurations de sections par rôle
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import type { Session, Utilisateur } from '@/types/auth.types';

// ─────────────────────────────────────────────────────────────────────────────
// SCHÉMAS DE BASE (réutilisables)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// TYPES DE PROPS PARTAGÉES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Props de base pour toutes les pages de profil par rôle.
 */
export interface ProfilePageProps {
  /** Session utilisateur complète */
  session: Session | null;
  /** Utilisateur connecté (fallback) */
  user: Utilisateur;
}

/**
 * Sections disponibles dans un profil.
 * Chaque section correspond à un onglet ou bloc d'informations.
 */
export type ProfileSection =
  | 'personal'
  | 'professional'
  | 'medical'
  | 'emergency'
  | 'availability'
  | 'pharmacy'
  | 'security'
  | 'preferences'
  | 'danger';

/** Jours de la semaine (fr) */
export const WEEK_DAYS = [
  { value: 'MONDAY', label: 'Lundi', short: 'Lun' },
  { value: 'TUESDAY', label: 'Mardi', short: 'Mar' },
  { value: 'WEDNESDAY', label: 'Mercredi', short: 'Mer' },
  { value: 'THURSDAY', label: 'Jeudi', short: 'Jeu' },
  { value: 'FRIDAY', label: 'Vendredi', short: 'Ven' },
  { value: 'SATURDAY', label: 'Samedi', short: 'Sam' },
  { value: 'SUNDAY', label: 'Dimanche', short: 'Dim' },
];
