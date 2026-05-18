// /home/stive-junior/Auto-ecole-COS/src/store/formations.store.ts

/**
 * Store Zustand pour la gestion des formations (offres pédagogiques)
 *
 * @module formationsStore
 * @description
 * Gère l'état global des formations : liste paginée, formation détaillée,
 * statistiques, inscriptions mensuelles, candidats inscrits, tendances et sparklines.
 *
 * Toutes les interactions avec l'API Electron passent par `window.api.formations`.
 * Les données entrantes sont validées avec Zod (`formations.validator.ts`).
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { create } from 'zustand';
import type {
  Formation,
  FormationsStats,
  FormationsTrends,
  FormationsPaginatedResponse,
  FormationsListParams,
  MonthlyInscriptionData,
  FormationsSparklineData,
  PopularityStat,
} from '@/types/formations.types';
import type { Candidat } from '@/types/candidats.types';
import {
  createFormationSchema,
  updateFormationSchema,
  deleteFormationSchema,
  formationsListSchema,
} from '@/lib/validators/formations.validator';
import { validateOrThrow, safeValidate } from '@/lib/validators/utils.validator';
import { formatErrorMessage } from '@/lib/helpers/error.helper';

// ===============================
// TYPES INTERNES DU STORE
// ===============================

interface FormationsState {
  // Liste paginée
  formations: Formation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;

  // Formation détaillée (avec candidats et tarifs)
  currentFormation: (Formation & { candidatsInscrits?: Candidat[] }) | null;
  detailLoading: boolean;
  detailError: string | null;

  // Statistiques
  stats: FormationsStats | null;
  statsLoading: boolean;
  statsError: string | null;

  // Tendances
  trends: FormationsTrends | null;
  trendsLoading: boolean;
  trendsError: string | null;

  // Sparklines
  sparklines: FormationsSparklineData | null;
  sparklinesLoading: boolean;
  sparklinesError: string | null;

  // Inscriptions mensuelles pour une formation
  monthlyInscriptions: MonthlyInscriptionData[];
  monthlyInscriptionsLoading: boolean;
  monthlyInscriptionsError: string | null;

  // Candidats inscrits à une formation
  candidatsInscrits: Candidat[];
  candidatsInscritsLoading: boolean;
  candidatsInscritsError: string | null;
}

interface FormationsActions {
  // Opérations CRUD principales
  getAll: (params?: FormationsListParams) => Promise<FormationsPaginatedResponse>;
  getById: (id: number) => Promise<Formation & { candidatsInscrits?: Candidat[] }>;
  create: (data: unknown) => Promise<Formation>;
  update: (id: number, data: unknown) => Promise<Formation>;
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  // Statistiques, tendances et sparklines
  getStats: () => Promise<FormationsStats>;
  getTrends: () => Promise<FormationsTrends>;
  getSparklines: () => Promise<FormationsSparklineData>;

  // Relations spécifiques
  getMonthlyInscriptions: (formationId: number) => Promise<MonthlyInscriptionData[]>;
  getCandidatsByFormation: (formationId: number) => Promise<Candidat[]>;
  getPopularityStats: () => Promise<PopularityStat[]>;
  getNbInscriptions: (formationId: number) => Promise<number>;

  // Utilitaires
  clearErrors: () => void;
  resetCurrentFormation: () => void;
  resetMonthlyInscriptions: () => void;
  resetCandidatsInscrits: () => void;
}

type FormationsStore = FormationsState & FormationsActions;

// ===============================
// ÉTAT INITIAL
// ===============================

const initialState: FormationsState = {
  formations: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  loading: false,
  error: null,

  currentFormation: null,
  detailLoading: false,
  detailError: null,

  stats: null,
  statsLoading: false,
  statsError: null,

  trends: null,
  trendsLoading: false,
  trendsError: null,

  sparklines: null,
  sparklinesLoading: false,
  sparklinesError: null,

  monthlyInscriptions: [],
  monthlyInscriptionsLoading: false,
  monthlyInscriptionsError: null,

  candidatsInscrits: [],
  candidatsInscritsLoading: false,
  candidatsInscritsError: null,
};

// ===============================
// STORE PRINCIPAL
// ===============================

export const useFormationsStore = create<FormationsStore>()((set, get) => ({
  ...initialState,

  // ===============================
  // OPÉRATIONS CRUD PRINCIPALES
  // ===============================

  /**
   * Récupère la liste paginée des formations avec filtres optionnels.
   * Valide les paramètres via `formationsListSchema`.
   *
   * @param params - Pagination et filtres (page, limit, search, categorie, actif)
   * @returns Réponse paginée
   */
  getAll: async (params?: FormationsListParams) => {
    const validation = safeValidate(formationsListSchema, params || {});
    if (!validation.success) {
      const message = formatErrorMessage(validation.error, 'Paramètres de liste invalides');
      set({ error: message });
      throw new Error(message);
    }

    set({ loading: true, error: null });
    try {
      const response = await window.api.formations.getAll(validation.data);
      if (
        response &&
        typeof response === 'object' &&
        'formations' in response &&
        'total' in response
      ) {
        set({
          formations: response.formations,
          pagination: {
            page: response.page,
            limit: response.limit,
            total: response.total,
            totalPages: response.totalPages,
          },
          loading: false,
        });
        return response;
      } else {
        const formations = response as Formation[];
        set({
          formations: formations,
          pagination: {
            page: 1,
            limit: formations.length,
            total: formations.length,
            totalPages: 1,
          },
          loading: false,
        });
        return {
          formations: formations,
          total: formations.length,
          page: 1,
          limit: formations.length,
          totalPages: 1,
        };
      }
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des formations');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère une formation par son identifiant avec toutes ses relations.
   * Valide l'ID.
   *
   * @param id - Identifiant de la formation
   * @returns Formation complète (avec candidats inscrits et tarifs)
   */
  getById: async (id) => {
    if (!id || isNaN(id)) {
      throw new Error('Identifiant formation invalide');
    }
    set({ detailLoading: true, detailError: null });
    try {
      const formation = await window.api.formations.getById(id);
      set({ currentFormation: formation, detailLoading: false });
      return formation;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement de la formation');
      set({ detailLoading: false, detailError: message });
      throw new Error(message);
    }
  },

  /**
   * Crée une nouvelle formation.
   * Valide les données avec `createFormationSchema` avant l'appel.
   *
   * @param data - Données de la formation (conformes au schéma)
   * @returns Formation créée
   */
  create: async (data) => {
    const validated = validateOrThrow(createFormationSchema, data);
    // Assurer que actif a toujours une valeur booléenne (défaut: true)
    const payload = { ...validated, actif: validated.actif ?? true };
    set({ loading: true, error: null });
    try {
      const newFormation = await window.api.formations.create(payload);
      // Recharger la liste courante
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      set({ loading: false });
      return newFormation;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la création de la formation');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Met à jour une formation existante (patch partiel).
   * Valide les données avec `updateFormationSchema`.
   *
   * @param id - Identifiant de la formation
   * @param data - Champs à mettre à jour
   * @returns Formation mise à jour
   */
  update: async (id, data) => {
    const validated = validateOrThrow(updateFormationSchema, Object.assign({ id }, data));

    try {
      const updated = await window.api.formations.update(validated.id, validated);
      // Mettre à jour l'état local si la formation est la courante
      const { currentFormation } = get();
      if (currentFormation?.id === updated.id) {
        set({ currentFormation: { ...currentFormation, ...updated } });
      }
      // Recharger la liste
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      await get().getStats();

      return updated;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la mise à jour');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   * Supprime (désactive) une formation.
   * Valide l'ID.
   *
   * @param id - Identifiant de la formation
   * @returns Résultat de l'opération
   */
  delete: async (id) => {
    const validated = validateOrThrow(deleteFormationSchema, { id });
    set({ loading: true, error: null });
    try {
      const result = await window.api.formations.delete(validated.id);
      // Recharger la liste après suppression
      await get().getAll({ page: get().pagination.page, limit: get().pagination.limit });
      // Si la formation supprimée était celle affichée en détail, la vider
      const { currentFormation } = get();
      if (currentFormation?.id === validated.id) {
        set({ currentFormation: null });
      }
      set({ loading: false });
      return result;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors de la suppression');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  // ===============================
  // STATISTIQUES, TENDANCES ET SPARKLINES
  // ===============================

  /**
   * Récupère les statistiques agrégées des formations.
   *
   * @returns Métriques (total, actives, prix moyen, etc.)
   */
  getStats: async () => {
    set({ statsLoading: true, statsError: null });
    try {
      const stats = await window.api.formations.getStats();
      set({ stats, statsLoading: false });
      return stats;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des statistiques');
      set({ statsLoading: false, statsError: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère les tendances évolutives des formations.
   *
   * @returns Tendances en pourcentage
   */
  getTrends: async () => {
    set({ trendsLoading: true, trendsError: null });
    try {
      const trends = await window.api.formations.getTrends();
      set({ trends, trendsLoading: false });
      return trends;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des tendances');
      set({ trendsLoading: false, trendsError: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère les données des sparklines pour les 12 derniers mois.
   *
   * @returns Sparklines (formations actives, prix moyen, inscriptions)
   */
  getSparklines: async () => {
    set({ sparklinesLoading: true, sparklinesError: null });
    try {
      const sparklines = await window.api.formations.getSparklines();
      set({ sparklines, sparklinesLoading: false });
      return sparklines;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur lors du chargement des sparklines');
      set({ sparklinesLoading: false, sparklinesError: message });
      throw new Error(message);
    }
  },

  // ===============================
  // RELATIONS SPÉCIFIQUES
  // ===============================

  /**
   * Récupère le nombre d’inscriptions par mois pour une formation donnée.
   *
   * @param formationId - Identifiant de la formation
   * @returns Liste des inscriptions mensuelles
   */
  getMonthlyInscriptions: async (formationId) => {
    if (!formationId || isNaN(formationId)) throw new Error('ID formation invalide');
    set({ monthlyInscriptionsLoading: true, monthlyInscriptionsError: null });
    try {
      const data = await window.api.formations.getMonthlyInscriptions(formationId);
      set({ monthlyInscriptions: data, monthlyInscriptionsLoading: false });
      return data;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur chargement des inscriptions mensuelles');
      set({ monthlyInscriptionsLoading: false, monthlyInscriptionsError: message });
      throw new Error(message);
    }
  },

  /**
   * Récupère la liste des candidats inscrits à une formation.
   *
   * @param formationId - Identifiant de la formation
   * @returns Liste des candidats
   */
  getCandidatsByFormation: async (formationId) => {
    if (!formationId || isNaN(formationId)) throw new Error('ID formation invalide');
    set({ candidatsInscritsLoading: true, candidatsInscritsError: null });
    try {
      const candidats = await window.api.formations.getCandidatsByFormation(formationId);
      set({ candidatsInscrits: candidats, candidatsInscritsLoading: false });
      return candidats;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur chargement des candidats inscrits');
      set({ candidatsInscritsLoading: false, candidatsInscritsError: message });
      throw new Error(message);
    }
  },

  /**
   *
   * @returns Liste des stats
   */
  getPopularityStats: async () => {
    set({ loading: true, error: null });
    try {
      const data = await window.api.formations.getPopularityStats();
      set({ loading: false });
      return data;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur chargement popularité');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  /**
   *
   * @param formationId
   * @returns
   */
  getNbInscriptions: async (formationId) => {
    if (!formationId || isNaN(formationId)) throw new Error('ID formation invalide');
    set({ loading: true, error: null });
    try {
      const nb = await window.api.formations.getNbInscriptions(formationId);
      set({ loading: false });
      return nb;
    } catch (error) {
      const message = formatErrorMessage(error, 'Erreur chargement nombre inscriptions');
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  // ===============================
  // UTILITAIRES
  // ===============================

  /**
   * Efface toutes les erreurs du store.
   */
  clearErrors: () => {
    set({
      error: null,
      detailError: null,
      statsError: null,
      trendsError: null,
      sparklinesError: null,
      monthlyInscriptionsError: null,
      candidatsInscritsError: null,
    });
  },

  /**
   * Réinitialise la formation courante (ferme la vue détail).
   */
  resetCurrentFormation: () => {
    set({ currentFormation: null, detailError: null, detailLoading: false });
  },

  /**
   * Réinitialise les données d’inscriptions mensuelles.
   */
  resetMonthlyInscriptions: () => {
    set({
      monthlyInscriptions: [],
      monthlyInscriptionsError: null,
      monthlyInscriptionsLoading: false,
    });
  },

  /**
   * Réinitialise la liste des candidats inscrits.
   */
  resetCandidatsInscrits: () => {
    set({ candidatsInscrits: [], candidatsInscritsError: null, candidatsInscritsLoading: false });
  },
}));
