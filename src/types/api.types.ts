// src/types/api.types.ts

/**
 * @module types/api.types
 * @description
 * Extension de l'interface `Window` globale pour l'application Auto-École COS.
 * Expose les APIs Electron IPC au renderer via `window.api.*`.
 *
 * ## Architecture
 * Chaque sous-namespace correspond à un domaine métier :
 * - `auth` — Authentification, sessions, permissions, audit
 * - `candidats` — Candidats (élèves), documents, paiements/leçons/examens associés
 * - `documents` — Gestion documentaire (upload, téléchargement, statistiques)
 * - `paiements` — Encaissements, statistiques, sparklines, soldes
 *
 * ## Usage dans un composant React
 * ```ts
 * // Liste paginée de candidats
 * const { candidats } = await window.api.candidats.getAll({ page: 1, limit: 20 });
 *
 * // Créer un paiement
 * const paiement = await window.api.paiements.create({
 *   montant: 50000, mode: 'MOBILE_MONEY', candidatId: 42,
 * });
 *
 * // Statistiques documents
 * const stats = await window.api.documents.getStats();
 * ```
 *
 * @see {@link AuthApi} — src/types/auth.types.ts
 * @see {@link CandidatsApi} — src/types/candidats.types.ts
 * @see {@link DocumentsApi} — src/types/documents.types.ts
 * @see {@link PaiementsApi} — src/types/paiements.types.ts
 * @see {@link FormationsApi} — src/types/formations.types.ts
 * @see {@link FacturesApi} — src/types/factures.types.ts
 * @see {@link DepensesApi} — src/types/depenses.types.ts
 * @see {@link CaisseApi} — src/types/caisse.types.ts
 * @see {@link VehiculesApi} — src/types/vehicules.types.ts
 * @see {@link ExamensApi} — src/types/examens.types.ts
 * @see {@link LeconsApi} — src/types/planning.types.ts
 * @see {@link MoniteursApi} — src/types/moniteurs.types.ts
 * @see {@link AdminApi} — src/store/admin.types.ts
 *
 * @author Stive Junior
 * @version 3.0.0
 */

'use client';

import type { AuthApi } from './auth.types';
import type { CandidatsApi } from './candidats.types';
import type { DocumentsApi } from './documents.types';
import type { PaiementsApi } from './paiements.types';
import type { FormationsApi } from './formations.types';
import type { FacturesApi } from './factures.types';
import type { DepensesApi } from './depenses.types';
import type { CaisseApi } from './caisse.types';
import type { VehiculesApi } from './vehicules.types';
import type { ExamensApi } from './examens.types';
import type { LeconsApi } from './planning.types';
import type { MoniteursApi } from './moniteurs.types';
import type { AdminApi } from './admin.types';
import type { GlobalSearchResult, SearchResultItem } from './globalSearch.types';

// ─────────────────────────────────────────────────────────────────────────────
// Global Search API Type
// ─────────────────────────────────────────────────────────────────────────────

export interface GlobalSearchApi {
  /**
   * Recherche globale sur toutes les entités du système.
   * @param query - Terme de recherche (minimum 2 caractères)
   * @returns Résultats groupés par type d'entité
   */
  search: (query: string) => Promise<GlobalSearchResult<SearchResultItem>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Extension du type global Window
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  /**
   * API Electron exposée au renderer via `contextBridge.exposeInMainWorld`.
   *
   * @interface Window
   * @property {object} api - Namespace principal regroupant toutes les APIs IPC.
   * @property {AuthApi} api.auth - Authentification, sessions, permissions, audit.
   * @property {CandidatsApi} api.candidats - Gestion des candidats (CRUD + relations).
   * @property {DocumentsApi} api.documents - Gestion documentaire (upload, stats).
   * @property {PaiementsApi} api.paiements - Encaissements, statistiques, soldes.
   * @property {ExamensApi} api.examens - Gestion des examens.
   * @property {LeconsApi} api.planning - Gestion du planning des leçons.
   * @property {MoniteursApi} api.moniteurs - Gestion des moniteurs.
   * @property {GlobalSearchApi} api.globalSearch - Recherche globale sur toutes les entités.
   *
   * @example
   * ```ts
   * // Connexion utilisateur
   * const session = await window.api.auth.login({ email, password });
   *
   * // Candidats paginés
   * const { candidats } = await window.api.candidats.getAll({ page: 1, limit: 20 });
   *
   * // Créer un paiement
   * const p = await window.api.paiements.create({ montant: 50000, mode: 'ESPECES', candidatId: 1 });
   *
   * // Statistiques documents
   * const stats = await window.api.documents.getStats();
   *
   * // Recherche globale
   * const results = await window.api.globalSearch.search('Jean');
   * ```
   */
  interface Window {
    api: {
      /** @see {@link AuthApi} */
      auth: AuthApi;

      /** @see {@link CandidatsApi} */
      candidats: CandidatsApi;

      /** @see {@link DocumentsApi} */
      documents: DocumentsApi;

      /** @see {@link PaiementsApi} */
      paiements: PaiementsApi;

      /** @see {@link FormationsApi} */
      formations: FormationsApi;

      /** @see {@link FacturesApi} */
      factures: FacturesApi;

      /** @see {@link DepensesApi} */
      depenses: DepensesApi;

      /** @see {@link CaisseApi} */
      caisse: CaisseApi;

      /** @see {@link VehiculesApi} */
      vehicules: VehiculesApi;

      /** @see {@link ExamensApi} */
      examens: ExamensApi;

      /** @see {@link LeconsApi} */
      planning: LeconsApi;

      /** @see {@link MoniteursApi} */
      moniteurs: MoniteursApi;

      /** @see {@link AdminApi} */
      admin: AdminApi;

      /** @see {@link GlobalSearchApi} */
      globalSearch: GlobalSearchApi;
    };
  }
}

export {};
