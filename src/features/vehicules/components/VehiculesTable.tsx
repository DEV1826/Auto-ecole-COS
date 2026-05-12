// src/features/vehicules/components/VehiculesTable.tsx

/**
 * @module features/vehicules/components/VehiculesTable
 * @description
 * Tableau des véhicules – version complète avec filtres, pagination, actions et enrichissements.
 * Permet de visualiser, filtrer et gérer le parc automobile de l’auto‑école.
 *
 * ## Fonctionnalités
 * - Colonnes adaptées selon la variante (admin / secretaire)
 * - Filtre de période (optionnel) – basé sur la date d’acquisition
 * - Filtres facettés intégrés (catégorie de permis, statut, marque) via barre d’outils
 * - Pagination configurable ou limitation simple (`maxItems`)
 * - Bouton « Actualiser » et « Voir tout » optionnels
 * - Enrichissements pour afficher les logos de marques et la prochaine révision
 * - Badges récapitulatifs : total véhicules, disponibles, en entretien
 * - État de chargement (skeleton), état vide avec action
 * - Entièrement responsive via conteneur `@container`
 *
 * @see {@link getVehiculesColumns} – Définition des colonnes
 * @see {@link VehiculesTableActions} – Callbacks d’actions
 * @see {@link VehiculesEnrichments} – Enrichissements (logo, révision due)
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * // Dashboard admin
 * <VehiculesTable
 *   vehicules={vehicules}
 *   variant="admin"
 *   enrichments={{
 *     getAvatarUrl: (v) => `/images/brands/${v.marque.toLowerCase()}.svg`,
 *     getInitials: (v) => `${v.marque[0]}${v.modele[0]}`,
 *     getProchaineRevisionKm: (v) => v.prochaineRevisionKm,
 *     isRevisionDue: (v) => v.kilometrage >= (v.prochaineRevisionKm ?? Infinity),
 *   }}
 *   actions={{
 *     onView: (v) => navigate(`/vehicules/${v.id}`),
 *     onEdit: (v) => navigate(`/vehicules/${v.id}/edit`),
 *     onViewEntretiens: (v) => navigate(`/vehicules/${v.id}/entretiens`),
 *     onRecordMaintenance: (v) => navigate(`/vehicules/${v.id}/entretien/ajouter`),
 *   }}
 *   showViewAll
 *   onViewAll={() => navigate('/vehicules')}
 *   enableToolbar
 *   title="Gestion du parc"
 * />
 * ```
 */

import * as React from 'react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { RefreshCw, ChevronRight, PlusCircle, Car } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/tables/data-table';
import {
  getAdminVehiculesColumns,
  getSecretaireVehiculesColumns,
} from '@/components/tables/vehicules/vehicules-columns';
import type {
  Vehicule,
  VehiculesEnrichments,
  VehiculesTableActions,
  VehiculesColumnConfig,
} from '@/types/vehicules.types';
import { CATEGORIE_PERMIS_CONFIG, STATUT_VEHICULE_CONFIG } from '@/types/enums';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type VehiculesPeriodFilter = 'today' | 'week' | 'month' | 'all';

/**
 * @interface VehiculesTableProps
 * @description Propriétés du composant `VehiculesTable`.
 */
export interface VehiculesTableProps {
  /** Liste des véhicules à afficher */
  vehicules: Vehicule[];

  /** Variante d’affichage (influence les colonnes) */
  variant?: 'admin' | 'secretaire';

  /** Configuration fine des colonnes */
  columnConfig?: VehiculesColumnConfig;

  /** Enrichissements optionnels (logos, révision due) */
  enrichments?: VehiculesEnrichments;

  /** Callbacks d’actions sur les lignes */
  actions?: VehiculesTableActions;

  /**
   * Filtre de période basé sur `dateAcquisition`.
   * Défaut : `'all'` (pas de filtre temporel).
   */
  defaultPeriodFilter?: VehiculesPeriodFilter;

  /** Afficher le sélecteur de période (défaut: false – car moins utile pour les véhicules) */
  showPeriodFilter?: boolean;

  /** Nombre maximal d’éléments sans pagination (défaut: 5) */
  maxItems?: number;

  /** Activer la pagination (défaut: false) */
  enablePagination?: boolean;

  /** Taille de page par défaut si pagination activée (défaut: 10) */
  defaultPageSize?: number;

  /** Activer la barre d’outils (recherche + filtres facettés) (défaut: false) */
  enableToolbar?: boolean;

  /** Afficher le bouton « Voir tout » */
  showViewAll?: boolean;

  /** Callback du bouton « Voir tout » */
  onViewAll?: () => void;

  /** Afficher le bouton « Ajouter un véhicule » */
  showAddButton?: boolean;

  /** Callback du bouton « Ajouter un véhicule » */
  onAddClick?: () => void;

  /** En‑tête : titre principal */
  title?: string;

  /** Description sous le titre */
  description?: string;

  /** Encapsuler dans une `Card` (défaut: true) */
  asCard?: boolean;

  /** État de chargement principal */
  isLoading?: boolean;

  /** Callback de rafraîchissement (affiche un bouton) */
  onRefresh?: () => Promise<void>;

  /** Message personnalisé lorsque la liste est vide */
  emptyMessage?: string;

  /** Classes additionnelles */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Options de période
// ─────────────────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS: {
  value: VehiculesPeriodFilter;
  label: string;
  short: string;
}[] = [
    { value: 'today', label: "Aujourd'hui", short: 'Auj.' },
    { value: 'week', label: 'Cette semaine', short: 'Sem.' },
    { value: 'month', label: 'Ce mois', short: 'Mois' },
    { value: 'all', label: 'Tous', short: 'Tous' },
  ];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Filtre les véhicules selon la période d’acquisition.
 * @internal
 */
function filterByPeriod(
  vehicules: Vehicule[],
  period: VehiculesPeriodFilter
): Vehicule[] {
  if (period === 'all') return vehicules;

  const now = new Date();
  let from: Date;
  let to: Date;

  switch (period) {
    case 'today':
      from = startOfDay(now);
      to = endOfDay(now);
      break;
    case 'week':
      from = startOfWeek(now, { weekStartsOn: 1 });
      to = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'month':
      from = startOfMonth(now);
      to = endOfMonth(now);
      break;
    default:
      return vehicules;
  }

  return vehicules.filter((v) => {
    if (!v.dateAcquisition) return false;
    const acquisition = new Date(v.dateAcquisition);
    return isWithinInterval(acquisition, { start: from, end: to });
  });
}

/**
 * Calcule rapidement le nombre de véhicules disponibles.
 * @internal
 */
function countDisponibles(vehicules: Vehicule[]): number {
  return vehicules.filter((v) => v.statut === 'DISPONIBLE').length;
}

/**
 * Calcule le nombre de véhicules en entretien.
 * @internal
 */
function countEnEntretien(vehicules: Vehicule[]): number {
  return vehicules.filter((v) => v.statut === 'EN_ENTRETIEN').length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tableau des véhicules – version complète avec filtres, pagination, actions.
 */
export function VehiculesTable({
  vehicules,
  variant = 'admin',
  columnConfig,
  enrichments = {},
  actions = {},
  defaultPeriodFilter = 'all',
  showPeriodFilter = false, // désactivé par défaut car moins pertinent
  maxItems = 5,
  enablePagination = false,
  defaultPageSize = 10,
  enableToolbar = false,
  showViewAll = false,
  onViewAll,
  showAddButton = false,
  onAddClick,
  title = 'Véhicules',
  description,
  asCard = true,
  isLoading = false,
  onRefresh,
  emptyMessage = 'Aucun véhicule trouvé.',
  className,
}: VehiculesTableProps): React.JSX.Element {
  const isMobile = useIsMobile();
  const [periodFilter, setPeriodFilter] = React.useState<VehiculesPeriodFilter>(defaultPeriodFilter);
  const [refreshing, setRefreshing] = React.useState(false);

  // ── Filtrage avec transition ───────────────────────────────────────────
  const triggerTransition = React.useCallback((fn: () => void) => {
    setRefreshing(true);
    const t = setTimeout(() => {
      fn();
      setRefreshing(false);
    }, 120);
    return () => clearTimeout(t);
  }, []);

  const handlePeriodChange = React.useCallback(
    (value: string) => {
      if (!value || value === periodFilter) return;
      triggerTransition(() => setPeriodFilter(value as VehiculesPeriodFilter));
    },
    [periodFilter, triggerTransition]
  );

  // ── Données filtrées et affichées ─────────────────────────────────────
  const filteredVehicules = React.useMemo(
    () => filterByPeriod(vehicules, periodFilter),
    [vehicules, periodFilter]
  );

  const displayData = React.useMemo(
    () => (enablePagination ? filteredVehicules : filteredVehicules.slice(0, maxItems)),
    [filteredVehicules, enablePagination, maxItems]
  );

  // ── Statistiques rapides ──────────────────────────────────────────────
  const totalCount = filteredVehicules.length;
  const disponiblesCount = React.useMemo(() => countDisponibles(filteredVehicules), [filteredVehicules]);
  const entretienCount = React.useMemo(() => countEnEntretien(filteredVehicules), [filteredVehicules]);

  // ── Colonnes ───────────────────────────────────────────────────────────
  const columns = React.useMemo(() => {
    if (variant === 'admin') {
      return getAdminVehiculesColumns(actions, enrichments, columnConfig);
    }
    return getSecretaireVehiculesColumns(actions, enrichments, columnConfig);
  }, [variant, actions, enrichments, columnConfig]);

  // ── Rafraîchissement ─────────────────────────────────────────────────
  const handleRefresh = React.useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
      toast.success('Véhicules actualisés');
    } catch {
      toast.error("Erreur lors de l'actualisation");
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  // ── Options pour les filtres facettés (catégories, statuts, marques) ───
  const categoryOptions = React.useMemo(() => {
    return Object.entries(CATEGORIE_PERMIS_CONFIG).map(([value, cfg]) => ({
      label: cfg.label,
      value,
      icon: cfg.icon,
    }));
  }, []);

  const statutOptions = React.useMemo(() => {
    return Object.entries(STATUT_VEHICULE_CONFIG).map(([value, cfg]) => ({
      label: cfg.label,
      value,
      icon: cfg.icon,
    }));
  }, []);

  // Extraction des marques uniques pour le filtre
  const marqueOptions = React.useMemo(() => {
    const marques = new Set(vehicules.map((v) => v.marque));
    return Array.from(marques).map((m) => ({ label: m, value: m }));
  }, [vehicules]);

  // ── Barre d’outils supplémentaire (période + boutons) ────────────────
  const extraActions = (
    <div className="flex items-center gap-1.5 flex-wrap">
      {showPeriodFilter && (
        <>
          <Select value={periodFilter} onValueChange={handlePeriodChange}>
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {isMobile ? opt.short : opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Separator orientation="vertical" className="h-6 hidden @[480px]/veh:block" />
        </>
      )}
      {onRefresh && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Rafraîchir"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
        </Button>
      )}
      {showViewAll && onViewAll && (
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={onViewAll}>
          Voir tout
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );

  // ── En‑tête de la carte ──────────────────────────────────────────────
  const header = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center h-9 w-9 rounded-xs bg-blue-700 text-white shrink-0">
          <Car className="h-4.5 w-4.5" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={cn('font-semibold leading-tight', asCard ? 'text-base' : 'text-lg')}>
              {title}
            </h3>
            {totalCount > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 border-0 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
              >
                {totalCount} véhicule{totalCount > 1 ? 's' : ''}
              </Badge>
            )}
            {disponiblesCount > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 border-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
              >
                {disponiblesCount} dispo
              </Badge>
            )}
            {entretienCount > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 border-0 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
              >
                {entretienCount} entretien
              </Badge>
            )}
          </div>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {showAddButton && onAddClick && (
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={onAddClick}>
            <PlusCircle className="h-3.5 w-3.5" />
            Ajouter
          </Button>
        )}
        {extraActions}
      </div>
    </div>
  );

  // ── Contenu du tableau ───────────────────────────────────────────────
  const tableContent = (
    <div className={cn('transition-all duration-120 ease-in-out')}>
      <DataTable
        columns={columns}
        data={displayData}
        isLoading={isLoading || refreshing}
        enableRowSelection={false}
        enablePagination={enablePagination}
        enableToolbar={enableToolbar}
        defaultPageSize={defaultPageSize}
        pageSizeOptions={[5, 10, 20, 50]}
        searchColumn="immatriculation"
        searchPlaceholder="Rechercher par immatriculation…"
        addButtonText="Nouveau véhicule"
        onAddClick={onAddClick}
        onRowClick={(row) => actions.onView && actions.onView(row)}
        facetedFilters={
          enableToolbar
            ? [
              {
                columnId: 'categorie',
                title: 'Catégorie de permis',
                options: categoryOptions,
              },
              {
                columnId: 'statut',
                title: 'Statut',
                options: statutOptions,
              },
              {
                columnId: 'marque',
                title: 'Marque',
                options: marqueOptions,
              },
            ]
            : []
        }
        emptyMessage={emptyMessage}
        onEmptyActionLabel="Actualiser"
        onEmptyClick={handleRefresh}
        EmptyActionIcon={RefreshCw}
        className="border-0 shadow-none"
      />
    </div>
  );

  // ── Rendu final ──────────────────────────────────────────────────────
  if (asCard) {
    return (
      <Card className={cn('@container/veh overflow-hidden shadow-sm rounded-xs', className)}>
        <CardHeader className="pb-3 border-b">{header}</CardHeader>
        <CardContent className="pt-4">{tableContent}</CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('@container/veh w-full flex flex-col gap-4', className)}>
      {header}
      {tableContent}
    </div>
  );
}