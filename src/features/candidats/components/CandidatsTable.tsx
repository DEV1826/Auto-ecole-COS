// src/features/candidats/components/CandidatsTable.tsx

/**
 * @module features/candidats/components/CandidatsTable
 * @description
 * Tableau des candidats – version complète avec filtres, pagination, actions et enrichissements.
 * Permet de gérer les élèves de l’auto‑école avec une expérience riche.
 *
 * ## Fonctionnalités
 * - Colonnes adaptées selon la variante (admin / secretaire / moniteur)
 * - Filtres facettés intégrés (catégorie de permis, statut) via barre d’outils
 * - Recherche textuelle (nom, prénom, email)
 * - Pagination configurable ou limitation simple (`maxItems`)
 * - Bouton « Actualiser » et « Voir tout » optionnels
 * - Enrichissements pour afficher solde, leçons, examens
 * - Badges récapitulatifs : total candidats, actifs, nouvelles inscriptions ce mois
 * - État de chargement (skeleton), état vide avec action
 * - Entièrement responsive via conteneur `@container`
 *
 * @see {@link getCandidatsColumns} – Définition des colonnes
 * @see {@link CandidatsTableActions} – Callbacks d’actions
 * @see {@link CandidatsEnrichments} – Enrichissements (solde, leçons, examens)
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * <CandidatsTable
 *   candidats={candidats}
 *   variant="admin"
 *   enrichments={{
 *     getSolde: (c) => c.solde,
 *     getLeconsCount: (c) => c.lecons?.length,
 *     getExamensCount: (c) => c.examens?.length,
 *   }}
 *   actions={{
 *     onView: (c) => navigate(`/candidats/${c.id}`),
 *     onEdit: (c) => navigate(`/candidats/${c.id}/edit`),
 *     onAddPayment: (c) => navigate(`/paiements/create?candidatId=${c.id}`),
 *     onAddLesson: (c) => navigate(`/planning/create?candidatId=${c.id}`),
 *     onRegisterExam: (c) => navigate(`/examens/create?candidatId=${c.id}`),
 *     onViewDocuments: (c) => navigate(`/documents?candidatId=${c.id}`),
 *   }}
 *   showViewAll
 *   onViewAll={() => navigate('/candidats')}
 *   enableToolbar
 *   title="Gestion des candidats"
 * />
 * ```
 */

import * as React from 'react';
import { Users, RefreshCw, ChevronRight, Download } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/tables/data-table';
import {
  getCandidatsColumns,
  getAdminCandidatsColumns,
  getSecretaireCandidatsColumns,
  getMoniteurCandidatsColumns,
} from '@/components/tables/candidats/candidats-columns';
import type {
  CandidatsTableActions,
  CandidatsColumnConfig,
  CandidatsEnrichments,
} from '@/types/candidats.types';
import type { Candidat } from '@/types/candidats.types';
import { CATEGORIE_PERMIS_CONFIG, STATUT_CANDIDAT_CONFIG } from '@/types/enums';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @interface CandidatsTableProps
 * @description Propriétés du composant `CandidatsTable`.
 */
export interface CandidatsTableProps {
  /** Liste des candidats à afficher */
  candidats: Candidat[];

  /** État de chargement principal (affiche skeleton) */
  isLoading?: boolean;

  /** Callback de rafraîchissement des données (affiche un bouton rafraîchir) */
  onRefresh?: () => Promise<void>;

  /** Callbacks pour les actions de ligne (voir, éditer, ajouter paiement, etc.) */
  actions?: CandidatsTableActions;

  /** Enrichissements optionnels (solde, leçons, examens) */
  enrichments?: CandidatsEnrichments;

  /** Nombre maximal d’éléments affichés sans pagination (défaut: 5) */
  maxItems?: number;

  /** Activer la pagination complète (défaut: false) */
  enablePagination?: boolean;

  /** Taille de page par défaut (si pagination activée, défaut: 10) */
  defaultPageSize?: number;

  /** Options de taille de page disponibles */
  pageSizeOptions?: number[];

  /** Activer la barre d’outils (recherche + filtres facettés) – défaut: false */
  enableToolbar?: boolean;

  /** Encapsuler dans une `Card` (défaut: true) */
  asCard?: boolean;

  /** Titre affiché dans l’en-tête */
  title?: string;

  /** Description sous le titre */
  description?: string;

  /** Afficher le bouton « Voir tout » */
  showViewAll?: boolean;

  /** Callback du bouton « Voir tout » */
  onViewAll?: () => void;

  /** Callback du bouton « Ajouter candidat » */
  onAddClick?: () => void;

  /**  */
  onExport?: () => void;

  /** Variante d’affichage (influence les colonnes visibles) */
  variant?: 'admin' | 'secretaire' | 'moniteur';

  /** Configuration fine des colonnes (surcharge les valeurs par défaut) */
  columnConfig?: CandidatsColumnConfig;

  /** Classes CSS additionnelles sur le conteneur racine */
  className?: string;

  /** Message personnalisé lorsque la liste est vide */
  emptyMessage?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule le nombre de candidats actifs (statut EN_COURS) pour le badge.
 * @internal
 */
function countActifs(candidats: Candidat[]): number {
  return candidats.filter((c) => c.statut === 'EN_COURS').length;
}

/**
 * Calcule le nombre de nouvelles inscriptions ce mois (dateInscription >= début mois).
 * @internal
 */
function countNewThisMonth(candidats: Candidat[]): number {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return candidats.filter((c) => new Date(c.dateInscription) >= startOfMonth).length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tableau des candidats – version complète avec filtres, pagination, actions.
 */
export function CandidatsTable({
  candidats,
  isLoading = false,
  onRefresh,
  actions = {},
  enrichments = {},
  maxItems = 5,
  enablePagination = false,
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  enableToolbar = false,
  asCard = true,
  title = 'Candidats récents',
  description,
  showViewAll = false,
  onViewAll,
  onAddClick,
  onExport,
  variant = 'admin',
  columnConfig,
  className,
  emptyMessage = 'Aucun candidat trouvé.',
}: CandidatsTableProps): React.JSX.Element {
  const isMobile = useIsMobile();
  const [refreshing, setRefreshing] = React.useState(false);

  // Limitation des données si pas de pagination
  const displayData = React.useMemo(
    () => (enablePagination ? candidats : candidats.slice(0, maxItems)),
    [candidats, enablePagination, maxItems]
  );

  // Métriques de résumé
  const totalCount = candidats.length;
  const actifsCount = React.useMemo(() => countActifs(candidats), [candidats]);
  const newThisMonthCount = React.useMemo(() => countNewThisMonth(candidats), [candidats]);

  // Génération des colonnes selon la variante
  const columns = React.useMemo(() => {
    switch (variant) {
      case 'admin':
        return getAdminCandidatsColumns(actions, enrichments, columnConfig);
      case 'secretaire':
        return getSecretaireCandidatsColumns(actions, enrichments, columnConfig);
      case 'moniteur':
        return getMoniteurCandidatsColumns(actions, enrichments, columnConfig);
      default:
        return getCandidatsColumns({ variant: 'admin', actions, enrichments, columnConfig });
    }
  }, [variant, actions, enrichments, columnConfig]);

  // ── Options pour les filtres facettés (catégorie, statut) ────────────────
  const categorieOptions = React.useMemo(() => {
    return Object.entries(CATEGORIE_PERMIS_CONFIG).map(([value, cfg]) => ({
      label: cfg.label,
      value,
      icon: cfg.icon,
    }));
  }, []);

  const statutOptions = React.useMemo(() => {
    return Object.entries(STATUT_CANDIDAT_CONFIG).map(([value, cfg]) => ({
      label: cfg.label,
      value,
      icon: cfg.icon,
    }));
  }, []);

  // ── Rafraîchissement ──────────────────────────────────────────────────────
  const handleRefresh = React.useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
      toast.success('Candidats actualisés');
    } catch {
      toast.error("Erreur lors de l'actualisation");
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  // ── Actions extra dans la toolbar (boutons refresh et voir tout) ──────────
  const extraActions = React.useMemo(
    () => (
      <div className="flex items-center gap-1.5 flex-wrap">
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Rafraîchir les candidats"
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
    ),
    [onRefresh, handleRefresh, refreshing, showViewAll, onViewAll]
  );

  // ── En‑tête de la carte ───────────────────────────────────────────────────
  const header = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center h-9 w-9 rounded-md bg-blue-700 text-white shrink-0">
          <Users className="h-4.5 w-4.5" />
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
                {totalCount} candidat{totalCount > 1 ? 's' : ''}
              </Badge>
            )}
            {!isMobile && (
              <>
                {actifsCount > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-0 text-[10px] h-4 gap-0.5"
                  >
                    {actifsCount} actif{actifsCount > 1 ? 's' : ''}
                  </Badge>
                )}
                {newThisMonthCount > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-0 text-[10px] h-4 gap-0.5"
                  >
                    {newThisMonthCount} nouveau{newThisMonthCount > 1 ? 'x' : ''} ce mois
                  </Badge>
                )}
              </>
            )}
          </div>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1">

        <Button variant="outline" size="sm" onClick={onExport} className="h-8 gap-1 text-xs">
          <Download className="h-3.5 w-3.5" />
          Exporter
        </Button>
        {extraActions}
      </div>
    </div>
  );

  // ── Contenu du tableau (intégration des filtres facettés) ─────────────────
  const tableContent = (
    <div
      className={cn('transition-all duration-100', refreshing && 'opacity-60 pointer-events-none')}
    >
      <DataTable
        columns={columns}
        data={displayData}
        isLoading={isLoading || refreshing}
        enableRowSelection={false}
        enablePagination={enablePagination}
        enableToolbar={enableToolbar}
        defaultPageSize={defaultPageSize}
        pageSizeOptions={enablePagination ? pageSizeOptions : undefined}
        searchColumn="nom"
        onAddClick={onAddClick}
        searchPlaceholder="Rechercher un candidat…"
        extraActions={undefined}
        onRowClick={actions.onView}
        emptyMessage={emptyMessage}
        onEmptyActionLabel="Actualiser"
        onEmptyClick={handleRefresh}
        EmptyActionIcon={RefreshCw}
        facetedFilters={
          enableToolbar
            ? [
              {
                columnId: 'categorie',
                title: 'Catégorie de permis',
                options: categorieOptions,
              },
              {
                columnId: 'statut',
                title: 'Statut',
                options: statutOptions,
              },
            ]
            : []
        }
        className="border-0 shadow-none"
      />
    </div>
  );

  // ── Rendu final ───────────────────────────────────────────────────────────
  if (asCard) {
    return (
      <Card className={cn('overflow-hidden shadow-sm rounded-md', className)}>
        <CardHeader className="pb-3 border-b">{header}</CardHeader>
        <CardContent className="pt-4">{tableContent}</CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('w-full flex flex-col gap-4', className)}>
      {header}
      {tableContent}
    </div>
  );
}