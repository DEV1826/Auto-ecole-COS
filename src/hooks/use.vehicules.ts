// src/hooks/use.vehicules.ts

/**
 * Hook personnalisé pour la gestion des véhicules et de leurs entretiens
 *
 * @module useVehicules
 * @description
 * Fournit un accès simplifié au store Zustand des véhicules.
 * Expose l’état (liste paginée, véhicule détaillé, statistiques, tendances,
 * sparklines, entretiens par véhicule) et toutes les actions
 * (CRUD, gestion des entretiens, mise à jour du kilométrage, etc.).
 *
 * @example
 * ```tsx
 * const { vehicules, loading, getAll, create, delete } = useVehicules();
 *
 * useEffect(() => {
 *   getAll({ page: 1, limit: 10 });
 * }, []);
 *
 * const handleCreate = async (data) => {
 *   await create(data);
 * };
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { useVehiculesStore } from '@/store/vehicules.store';
import type {
  Vehicule,
  Entretien,
  VehiculesStatsExtended,
  VehiculesTrends,
  VehiculesPaginatedResponse,
  VehiculesListParams,
  VehiculesSparklineData,
} from '@/types/vehicules.types';

// ===============================
// INTERFACE DE RETOUR DU HOOK
// ===============================

/**
 * Interface décrivant toutes les propriétés et méthodes retournées par `useVehicules`
 */
export interface UseVehicules {
  // ===== ÉTAT DE LA LISTE PAGINÉE =====
  /** Liste des véhicules de la page courante */
  vehicules: Vehicule[];
  /** Pagination (page, limit, total, totalPages) */
  pagination: { page: number; limit: number; total: number; totalPages: number };
  /** Indicateur de chargement de la liste */
  loading: boolean;
  /** Erreur lors du chargement de la liste */
  error: string | null;

  // ===== VÉHICULE DÉTAILLÉ =====
  /** Véhicule actuellement consulté (avec entretiens, leçons, dépenses) */
  currentVehicule: Vehicule | null;
  /** Indicateur de chargement du détail */
  detailLoading: boolean;
  /** Erreur lors du chargement du détail */
  detailError: string | null;

  // ===== STATISTIQUES =====
  /** Métriques agrégées complètes des véhicules */
  stats: VehiculesStatsExtended | null;
  /** Indicateur de chargement des statistiques */
  statsLoading: boolean;
  /** Erreur lors du chargement des statistiques */
  statsError: string | null;

  // ===== TENDANCES =====
  /** Tendances évolutives (mois vs précédent) */
  trends: VehiculesTrends | null;
  /** Indicateur de chargement des tendances */
  trendsLoading: boolean;
  /** Erreur lors du chargement des tendances */
  trendsError: string | null;

  // ===== SPARKLINES =====
  /** Données des sparklines (12 mois) */
  sparklines: VehiculesSparklineData | null;
  /** Indicateur de chargement des sparklines */
  sparklinesLoading: boolean;
  /** Erreur lors du chargement des sparklines */
  sparklinesError: string | null;

  // ===== ENTRETIENS =====
  /** Indicateur de chargement des entretiens */
  entretiensLoading: boolean;
  /** Erreur lors du chargement des entretiens */
  entretiensError: string | null;

  // ===== OPÉRATIONS CRUD PRINCIPALES =====
  /**
   * Récupère la liste paginée des véhicules avec filtres optionnels.
   * @param params - Pagination, filtres (categorie, statut, search) et tri
   */
  getAll: (params?: VehiculesListParams) => Promise<VehiculesPaginatedResponse>;
  /**
   * Récupère un véhicule par son ID avec ses relations.
   * @param id - Identifiant du véhicule
   */
  getById: (id: number) => Promise<Vehicule>;
  /**
   * Crée un nouveau véhicule.
   * @param data - Données du véhicule (immatriculation, marque, modèle, annee, categorie obligatoires)
   */
  create: (data: unknown) => Promise<Vehicule>;
  /**
   * Met à jour un véhicule existant (patch partiel).
   * @param id - Identifiant du véhicule
   * @param data - Champs à modifier
   */
  update: (id: number, data: unknown) => Promise<Vehicule>;
  /**
   * Supprime (désactive) un véhicule.
   * @param id - Identifiant du véhicule
   */
  delete: (id: number) => Promise<{ success: boolean; message: string }>;

  // ===== STATISTIQUES, TENDANCES ET SPARKLINES =====
  /** Récupère les statistiques agrégées complètes des véhicules */
  getStats: () => Promise<VehiculesStatsExtended>;
  /** Récupère les tendances évolutives */
  getTrends: () => Promise<VehiculesTrends>;
  /** Récupère les données des sparklines (12 mois) */
  getSparklines: () => Promise<VehiculesSparklineData>;

  // ===== GESTION DES ENTRETIENS =====
  /** Récupère tous les entretiens d’un véhicule (avec cache) */
  getEntretiensByVehicule: (vehiculeId: number) => Promise<Entretien[]>;
  /** Crée un nouvel entretien pour un véhicule */
  createEntretien: (data: unknown) => Promise<Entretien>;
  /** Met à jour un entretien existant */
  updateEntretien: (id: number, data: unknown) => Promise<Entretien>;
  /** Supprime un entretien */
  deleteEntretien: (id: number) => Promise<{ success: boolean; message: string }>;

  // ===== MISE À JOUR DU KILOMÉTRAGE =====
  /** Met à jour le kilométrage d’un véhicule */
  updateKilometrage: (data: unknown) => Promise<Vehicule>;

  // ===== UTILITAIRES =====
  /** Vérifie si une immatriculation est unique (pour validation formulaire) */
  isImmatriculationUnique: (immatriculation: string, excludeId?: number) => Promise<boolean>;
  /** Efface toutes les erreurs du store */
  clearErrors: () => void;
  /** Réinitialise le véhicule courant (ferme la vue détail) */
  resetCurrentVehicule: () => void;
  /** Vide tous les caches (entretiens, immatriculation) */
  clearCaches: () => void;

  // ===== PROPRIÉTÉS DÉRIVÉES (convenience) =====
  /** Premier véhicule de la liste courante */
  firstVehicule: Vehicule | null;
  /** Nombre total de véhicules */
  totalVehicules: number;
  /** Indique si une opération est en cours (loading global) */
  isBusy: boolean;
}

// ===============================
// HOOK PRINCIPAL
// ===============================

/**
 * Hook d’accès complet à la gestion des véhicules.
 *
 * @returns {UseVehicules} Toutes les propriétés et actions du store véhicules
 */
export const useVehicules = (): UseVehicules => {
  const store = useVehiculesStore();

  // Propriétés dérivées
  const firstVehicule = store.vehicules.length > 0 ? store.vehicules[0] : null;
  const totalVehicules = store.pagination.total;
  const isBusy =
    store.loading ||
    store.detailLoading ||
    store.statsLoading ||
    store.trendsLoading ||
    store.sparklinesLoading ||
    store.entretiensLoading;

  return {
    // État liste
    vehicules: store.vehicules,
    pagination: store.pagination,
    loading: store.loading,
    error: store.error,

    // Détail
    currentVehicule: store.currentVehicule,
    detailLoading: store.detailLoading,
    detailError: store.detailError,

    // Statistiques
    stats: store.stats,
    statsLoading: store.statsLoading,
    statsError: store.statsError,

    // Tendances
    trends: store.trends,
    trendsLoading: store.trendsLoading,
    trendsError: store.trendsError,

    // Sparklines
    sparklines: store.sparklines,
    sparklinesLoading: store.sparklinesLoading,
    sparklinesError: store.sparklinesError,

    // État des actions spécifiques
    entretiensLoading: store.entretiensLoading,
    entretiensError: store.entretiensError,

    // Actions CRUD
    getAll: store.getAll,
    getById: store.getById,
    create: store.create,
    update: store.update,
    delete: store.delete,

    // Statistiques, tendances, sparklines
    getStats: store.getStats,
    getTrends: store.getTrends,
    getSparklines: store.getSparklines,

    // Gestion des entretiens
    getEntretiensByVehicule: store.getEntretiensByVehicule,
    createEntretien: store.createEntretien,
    updateEntretien: store.updateEntretien,
    deleteEntretien: store.deleteEntretien,

    // Mise à jour kilométrage
    updateKilometrage: store.updateKilometrage,

    // Utilitaires
    isImmatriculationUnique: store.isImmatriculationUnique,
    clearErrors: store.clearErrors,
    resetCurrentVehicule: store.resetCurrentVehicule,
    clearCaches: store.clearCaches,

    // Dérivées
    firstVehicule,
    totalVehicules,
    isBusy,
  };
};
