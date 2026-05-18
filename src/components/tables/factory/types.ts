/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/tables/factory/types.ts

/**
 * @module tables/factory/types
 * @description Types partagés pour l'usine à colonnes – compatibles avec DataTable
 * @author Stive Junior
 * @version 2.0.0
 */

import { z } from 'zod';

/**
 * Types d'édition supportés pour les cellules inline
 */
export type EditType =
  | 'text'
  | 'number'
  | 'textarea'
  | 'select'
  | 'multi-select'
  | 'date'
  | 'datetime'
  | 'time'
  | 'switch'
  | 'checkbox'
  | 'radio'
  | 'slider'
  | 'color'
  | 'email'
  | 'phone'
  | 'url'
  | 'password'
  | 'file'
  | 'image';

/**
 * Option pour les sélecteurs (select, multi-select)
 */
export interface SelectOption {
  /** Libellé affiché */
  label: string;
  /** Valeur associée */
  value: string | number;
  /** Désactiver l'option */
  disabled?: boolean;
  /** Icône optionnelle */
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Configuration d'une colonne éditable (métier)
 * @template TData – Type des données de la ligne
 * @template TValue – Type de la valeur de la colonne
 */
export interface EditableColumnConfig<TData, TValue = any> {
  /** Clé d'accès dans l'objet TData (ex: 'firstName') */
  accessorKey: keyof TData & string;
  /** Titre affiché dans l'en-tête */
  title: string;
  /** Icône optionnelle dans l'en-tête */
  icon?: React.ComponentType<{ className?: string }>;
  /** Type d'édition (détermine le composant UI) */
  editType: EditType;
  /** Options pour les types 'select' ou 'multi-select' */
  options?: SelectOption[];
  /** Schéma Zod pour validation (optionnel) */
  schema?: z.ZodType<TValue>;
  /** Validation personnalisée asynchrone ou synchrone */
  validate?: (value: TValue, row: TData) => string | null | Promise<string | null>;
  /** Fonction appelée lors de la sauvegarde (doit persister les données) */
  onSave: (row: TData, value: TValue) => Promise<void>;
  /** Formateur d'affichage en mode lecture (ex: formatage de date) */
  format?: (value: TValue, row: TData) => React.ReactNode;
  /** Placeholder pour les champs de saisie */
  placeholder?: string;
  /** Désactiver l'édition (lecture seule) */
  readOnly?: boolean;
  /** Autoriser le tri sur cette colonne */
  enableSorting?: boolean;
  /** Autoriser le masquage de cette colonne */
  enableHiding?: boolean;
  /** Largeur fixe de la colonne (en pixels) */
  size?: number;
  /** Classes CSS additionnelles pour la cellule */
  cellClassName?: string;
  /** Texte d'aide (description) */
  description?: string;
  /** Valeur minimale (pour number/slider) */
  min?: number;
  /** Valeur maximale (pour number/slider) */
  max?: number;
  /** Pas d'incrémentation (pour number) */
  step?: number;
  /** Unité de mesure (affichée pour slider ou number) */
  unit?: string;
}

/**
 * Configuration pour une colonne de type badge (affichage non éditable)
 * @template TData
 */
export interface BadgeColumnConfig<TData> {
  /** Clé d'accès */
  accessorKey: keyof TData & string;
  /** Titre */
  title: string;
  /** Fonction retournant la variante du badge en fonction de la valeur */
  getColor: (
    value: any
  ) =>
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'ghost'
    | 'link'
    | 'success'
    | 'warning'
    | 'error';
  /** Fonction retournant le libellé à afficher */
  getLabel: (value: any) => string;
  /** Autoriser le tri */
  enableSorting?: boolean;
  /** Autoriser le masquage */
  enableHiding?: boolean;
}

/**
 * Configuration pour une colonne d'avatar (affichage non éditable)
 * @template TData
 */
export interface AvatarColumnConfig<TData> {
  /** Clé d'accès (URL de l'avatar) */
  accessorKey: keyof TData & string;
  /** Titre */
  title: string;
  /** Fonction retournant les initiales à partir de la ligne */
  getInitials: (row: TData) => string;
  /** Fonction optionnelle pour obtenir l'URL de l'avatar (par défaut utilise accessorKey) */
  getAvatarUrl?: (row: TData) => string | undefined;
  /** Autoriser le tri */
  enableSorting?: boolean;
  /** Autoriser le masquage */
  enableHiding?: boolean;
  /** Largeur de la colonne en px */
  size?: number;
}

export interface AvatarWithTextColumnConfig<TData> {
  /** Clé d'accès dans les données (utilisée pour le tri) */
  accessorKey: keyof TData | string;
  /** Titre de la colonne (en-tête) */
  title: string;
  /** Icône optionnelle dans l'en-tête */
  icon?: React.ComponentType<{ className?: string }>;
  /**
   * Récupère l'URL de l'avatar depuis la ligne.
   * Retourner `undefined` pour afficher les initiales.
   */
  getAvatarUrl: (row: TData) => string | undefined;
  /**
   * Récupère les initiales affichées quand l'avatar est absent.
   * @example `(row) => row.patient.firstName[0] + row.patient.lastName[0]`
   */
  getInitials: (row: TData) => string;
  /**
   * Texte principal (nom, titre).
   * @example `(row) => row.patient.fullName`
   */
  getPrimaryText: (row: TData) => string;
  /**
   * Texte secondaire optionnel (sous-titre, spécialité, numéro).
   * Affiché en dessous du texte principal, plus petit et grisé.
   * @example `(row) => row.patient.phone`
   */
  getSecondaryText?: (row: TData) => string | undefined;
  /**
   * Badge optionnel affiché après le texte principal.
   * @example `(row) => ({ label: "Nouveau", color: "bg-blue-100 text-blue-700" })`
   */
  getBadge?: (row: TData) => { label: string; colorClass?: string } | undefined;
  /** Taille de l'avatar : 'sm' (h-7 w-7) ou 'md' (h-9 w-9, défaut) */
  avatarSize?: 'sm' | 'md';
  img?: boolean;
  /** Activer le tri (défaut : true) */
  enableSorting?: boolean;
  /** Activer le masquage (défaut : true) */
  enableHiding?: boolean;
  /** Largeur de la colonne en px */
  size?: number;
  /** Classes CSS additionnelles sur la cellule */
  cellClassName?: string;
}
