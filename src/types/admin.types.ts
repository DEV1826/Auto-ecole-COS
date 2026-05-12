// src/types/admin.types.ts

/**
 * @module types/admin.types
 * @description
 * Types complets pour l’administration du système Auto‑école COS.
 *
 * Ce module exporte :
 * - `PermissionDetail` : permissions individuelles (ressource + action)
 * - `AuditLogEntry` : entrée de log d’audit
 * - `CompanyConfig` : configuration de l’entreprise
 * - `AdminStats` : métriques pour le dashboard admin
 * - `AdminTrends` : tendances évolutives
 * - `AuditLogsColumnConfig` : configuration des colonnes pour les logs
 * - `AuditLogsTableActions` : actions sur les logs
 * - `AuditLogsColumnsOptions` : options pour la génération des colonnes
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @see {@link Utilisateur} – Utilisateurs du système
 * @see {@link Role} – Rôles utilisateur
 * @see {@link NiveauAcces} – Niveaux d’accès
 */

import type { Utilisateur } from '@/types/auth.types';

// ============================================================
// MODÈLES PRINCIPAUX
// ============================================================

/**
 * Permission individuelle – correspond au modèle Prisma `Permission`.
 *
 * @interface Permission
 * @description
 * Une permission associe un utilisateur à une ressource (ex: "candidats")
 * et une action (ex: "create", "read", "update", "delete").
 *
 * @property {number} id - Identifiant unique
 * @property {number} utilisateurId - Identifiant de l’utilisateur bénéficiaire
 * @property {string} ressource - Nom de la ressource (ex: "candidats", "paiements", "utilisateurs")
 * @property {string} action - Action autorisée (ex: "create", "read", "update", "delete")
 * @property {boolean} actif - Si la permission est active
 *
 * @example
 * ```ts
 * const perm: Permission = {
 *   id: 10,
 *   utilisateurId: 5,
 *   ressource: 'candidats',
 *   action: 'update',
 *   actif: true,
 * };
 * ```
 */
export interface Permission {
  id: number;
  utilisateurId: number;
  ressource: string;
  action: string;
  actif: boolean;
}

/**
 * Entrée de log d’audit – correspond au modèle Prisma `AuditLog`.
 *
 * @interface AuditLogEntry
 * @description
 * Enregistre toute action sensible effectuée par un utilisateur (connexion,
 * création, modification, suppression) avec son adresse IP et le résultat.
 *
 * @property {number} id - Identifiant unique
 * @property {number | null} utilisateurId - ID de l’utilisateur (null si anonyme)
 * @property {string} action - Code de l’action (ex: "LOGIN", "CREATE_CANDIDAT")
 * @property {string | null} ressource - Type de ressource concernée
 * @property {number | null} ressourceId - ID de la ressource
 * @property {string | null} description - Texte descriptif
 * @property {string | null} ipAddress - Adresse IP de l’utilisateur
 * @property {'SUCCESS' | 'FAILED'} statut - Succès ou échec
 * @property {Date} createdAt - Horodatage
 * @property {Pick<Utilisateur, 'id' | 'email' | 'nom' | 'prenom'> | null} utilisateur - Informations réduites de l’utilisateur
 *
 * @example
 * ```ts
 * const log: AuditLogEntry = {
 *   id: 100,
 *   utilisateurId: 5,
 *   action: 'LOGIN_SUCCESS',
 *   ressource: 'Utilisateur',
 *   ressourceId: 5,
 *   description: 'Connexion réussie depuis 192.168.1.1',
 *   ipAddress: '192.168.1.1',
 *   statut: 'SUCCESS',
 *   createdAt: new Date(),
 *   utilisateur: { id: 5, email: 'admin@cos.com', nom: 'Admin', prenom: 'Super' },
 * };
 * ```
 */
export interface AuditLogEntry {
  id: number;
  utilisateurId: number | null;
  action: string;
  ressource: string | null;
  ressourceId: number | null;
  description: string | null;
  ipAddress: string | null;
  statut: 'SUCCESS' | 'FAILED';
  createdAt: Date;
  utilisateur?: Pick<Utilisateur, 'id' | 'email' | 'nom' | 'prenom'> | null;
}

/**
 * Configuration de l’entreprise – correspond au modèle Prisma `CompanyConfig`.
 *
 * @interface CompanyConfig
 * @description
 * Paramètres généraux de l’auto‑école : nom, adresse, contact,
 * informations fiscales, logo.
 *
 * @property {number} id - Identifiant unique
 * @property {string} nom - Nom officiel de l’auto‑école
 * @property {string | null} adresse - Adresse postale
 * @property {string | null} telephone - Numéro de téléphone principal
 * @property {string | null} email - Email de contact
 * @property {string | null} siteWeb - Site internet
 * @property {string | null} numeroFiscal - Numéro d’identification fiscale
 * @property {string | null} logoPath - Chemin du logo (stocké localement)
 * @property {Date} createdAt - Date de création
 * @property {Date} updatedAt - Dernière mise à jour
 *
 * @example
 * ```ts
 * const config: CompanyConfig = {
 *   id: 1,
 *   nom: 'COS Auto-École',
 *   adresse: '123 Avenue de la Conduite, Yaoundé',
 *   telephone: '+237 6 00 00 00 00',
 *   email: 'contact@cos-autoecole.com',
 *   siteWeb: 'https://www.cos-autoecole.com',
 *   numeroFiscal: 'CI-2025-001234',
 *   logoPath: '/images/logo-cos.png',
 *   createdAt: new Date('2024-01-01'),
 *   updatedAt: new Date('2024-01-01'),
 * };
 * ```
 */
export interface CompanyConfig {
  id: number;
  nom: string;
  adresse?: string | null;
  telephone?: string | null;
  email?: string | null;
  siteWeb?: string | null;
  numeroFiscal?: string | null;
  logoPath?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// CONFIGURATION DES COLONNES POUR LE TABLEAU DES LOGS D’AUDIT
// ============================================================

/**
 * Configuration de visibilité des colonnes dans le tableau des logs d’audit.
 *
 * @interface AuditLogsColumnConfig
 * @property {boolean} [showUtilisateur] - Afficher le nom de l’utilisateur (défaut : true)
 * @property {boolean} [showAction] - Afficher l’action (défaut : true)
 * @property {boolean} [showRessource] - Afficher la ressource (défaut : true)
 * @property {boolean} [showDescription] - Afficher la description (défaut : true)
 * @property {boolean} [showIpAddress] - Afficher l’adresse IP (défaut : false)
 * @property {boolean} [showStatut] - Afficher le statut (badge) (défaut : true)
 * @property {boolean} [showCreatedAt] - Afficher la date de création (défaut : true)
 * @property {boolean} [showActions] - Afficher le menu d’actions (défaut : false, logs généralement non modifiables)
 */
export interface AuditLogsColumnConfig {
  showUtilisateur?: boolean;
  showAction?: boolean;
  showRessource?: boolean;
  showDescription?: boolean;
  showIpAddress?: boolean;
  showStatut?: boolean;
  showCreatedAt?: boolean;
  showActions?: boolean;
}

/**
 * Callbacks d’actions pour le tableau des logs d’audit.
 *
 * @interface AuditLogsTableActions
 * @property {(log: AuditLogEntry) => void} [onViewDetails] - Voir les détails complets (JSON)
 * @property {(userId: number) => void} [onFilterByUser] - Filtrer par cet utilisateur
 */
export interface AuditLogsTableActions {
  onViewDetails?: (log: AuditLogEntry) => void;
  onFilterByUser?: (userId: number) => void;
}

/**
 * Options pour la génération des colonnes du tableau des logs d’audit.
 *
 * @interface AuditLogsColumnsOptions
 * @property {AuditLogsColumnConfig} [columnConfig] - Surcharge de la visibilité des colonnes
 * @property {AuditLogsTableActions} [actions] - Callbacks d’actions
 * @property {'admin' | 'auditor'} [variant] - Profil utilisateur
 *   - `admin` : toutes les colonnes, y compris IP et actions
 *   - `auditor` : colonnes essentielles (utilisateur, action, ressource, statut, date)
 */
export interface AuditLogsColumnsOptions {
  columnConfig?: AuditLogsColumnConfig;
  actions?: AuditLogsTableActions;
  variant?: 'admin' | 'auditor';
}
