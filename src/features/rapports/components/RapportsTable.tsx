// src/features/rapports/components/RapportsTable.tsx

/**
 * @module features/rapports/components/RapportsTable
 * @description
 * Tableau de rapports générique – affiche les données d’un rapport (financier, candidats, leçons, véhicules)
 * avec des colonnes adaptées automatiquement.
 *
 * ## Fonctionnalités
 * - Détection automatique des colonnes via le type de rapport
 * - Pagination configurable
 * - Barre d’outils avec recherche et filtres facettés (selon le type)
 * - Badges récapitulatifs (totaux, sommes, etc.)
 * - État de chargement, état vide, rafraîchissement
 * - Bouton « Voir tout » optionnel
 *
 * @see {@link RapportType} – Types de rapport supportés
 * @see {@link getRapportColumns} – Génération des colonnes
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * // Rapport financier
 * <RapportsTable
 *   type="financier"
 *   data={[rapportFinancier]}
 *   title="Synthèse financière"
 *   enableToolbar
 *   showViewAll
 *   onViewAll={() => navigate('/rapports/financier')}
 * />
 *
 * // Rapport leçons – par moniteur
 * <RapportsTable
 *   type="lecons_parMoniteur"
 *   data={rapport.parMoniteur}
 *   title="Heures par moniteur"
 *   enablePagination
 *   defaultPageSize={10}
 * />
 * ```
 */

import * as React from 'react';
import { RefreshCw, ChevronRight, TrendingUp, Users, Car, Clock } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/tables/data-table';
import {
    getRapportColumns,
    type RapportType,
    type RapportFinancierRow,
    type StatutCandidatRow,
    type TypeLeconRow,
    type MoniteurHeuresRow,
    type RapportVehiculesRow,
} from '@/components/tables/rapports';
import type { RapportsEnrichments } from '@/types/rapports.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Union des types de données possibles pour un rapport.
 */
export type RapportsTableData =
    | RapportFinancierRow[]
    | StatutCandidatRow[]
    | TypeLeconRow[]
    | MoniteurHeuresRow[]
    | RapportVehiculesRow[];

/**
 * @interface RapportsTableProps
 * @description Propriétés du composant `RapportsTable`.
 */
export interface RapportsTableProps {
    /** Type de rapport (détermine les colonnes) */
    type: RapportType;

    /** Données du rapport (doivent correspondre au type) */
    data: RapportsTableData;

    /** Enrichissements optionnels (formatage des montants, heures, etc.) */
    enrichments?: RapportsEnrichments;

    /** Nombre maximal d’éléments sans pagination (défaut: 10) */
    maxItems?: number;

    /** Activer la pagination (défaut: true) */
    enablePagination?: boolean;

    /** Taille de page par défaut (défaut: 10) */
    defaultPageSize?: number;

    /** Activer la barre d’outils (recherche + filtres) (défaut: true) */
    enableToolbar?: boolean;

    /** Afficher le bouton « Voir tout » */
    showViewAll?: boolean;

    /** Callback du bouton « Voir tout » */
    onViewAll?: () => void;

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
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule des statistiques récapitulatives selon le type de rapport.
 * @internal
 */
function getStats(
    type: RapportType,
    data: RapportsTableData
): { label: string; value: string; colorClass?: string }[] {
    switch (type) {
        case 'financier': {
            const rows = data as RapportFinancierRow[];
            const totalPaiements = rows.reduce((s, r) => s + r.totalPaiements, 0);
            const totalDepenses = rows.reduce((s, r) => s + r.totalDepenses, 0);
            const benefice = rows.reduce((s, r) => s + r.benefice, 0);
            const format = (n: number) =>
                n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1_000 ? (n / 1_000).toFixed(1) + 'k' : n.toString();
            return [
                { label: 'Total encaissé', value: format(totalPaiements) + ' FCFA', colorClass: 'text-emerald-600' },
                { label: 'Total dépensé', value: format(totalDepenses) + ' FCFA', colorClass: 'text-red-600' },
                { label: 'Bénéfice', value: format(benefice) + ' FCFA', colorClass: benefice >= 0 ? 'text-emerald-600' : 'text-red-600' },
            ];
        }
        case 'candidats': {
            const rows = data as StatutCandidatRow[];
            const total = rows.reduce((s, r) => s + r.nombre, 0);
            return [{ label: 'Total candidats', value: total.toString() }];
        }
        case 'lecons_parType': {
            const rows = data as TypeLeconRow[];
            const totalHeures = rows.reduce((s, r) => s + r.valeur, 0);
            return [{ label: 'Total heures', value: totalHeures.toFixed(1) + ' h' }];
        }
        case 'lecons_parMoniteur': {
            const rows = data as MoniteurHeuresRow[];
            const totalHeures = rows.reduce((s, r) => s + r.heures, 0);
            return [{ label: 'Total heures', value: totalHeures.toFixed(1) + ' h' }];
        }
        case 'vehicules': {
            const rows = data as RapportVehiculesRow[];
            const total = rows.reduce((s, r) => s + r.totalVehicules, 0);
            return [{ label: 'Total véhicules', value: total.toString() }];
        }
        default:
            return [];
    }
}

/**
 * Détermine la colonne de recherche par défaut selon le type.
 * @internal
 */
function getSearchColumn(type: RapportType): string {
    switch (type) {
        case 'financier':
            return 'periode';
        case 'candidats':
            return 'label';
        case 'lecons_parType':
            return 'label';
        case 'lecons_parMoniteur':
            return 'moniteurNom';
        case 'vehicules':
            return 'marque';
        default:
            return 'nom';
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tableau de rapports générique – version complète avec colonnes automatiques.
 */
export function RapportsTable({
    type,
    data,
    enrichments,
    maxItems = 10,
    enablePagination = true,
    defaultPageSize = 10,
    enableToolbar = true,
    showViewAll = false,
    onViewAll,
    title,
    description,
    asCard = true,
    isLoading = false,
    onRefresh,
    emptyMessage = 'Aucune donnée disponible pour ce rapport.',
    className,
}: RapportsTableProps): React.JSX.Element {
    const [refreshing, setRefreshing] = React.useState(false);

    // ── Limitation des données si pas de pagination ─────────────────────────
    const displayData = React.useMemo(
        () => (enablePagination ? data : (data).slice(0, maxItems)),
        [data, enablePagination, maxItems]
    );

    // ── Colonnes ───────────────────────────────────────────────────────────
    const columns = React.useMemo(
        () => getRapportColumns(type, enrichments),
        [type, enrichments]
    );

    // ── Statistiques récapitulatives ──────────────────────────────────────
    const stats = React.useMemo(() => getStats(type, data), [type, data]);

    // ── Rafraîchissement ─────────────────────────────────────────────────
    const handleRefresh = React.useCallback(async () => {
        if (!onRefresh) return;
        setRefreshing(true);
        try {
            await onRefresh();
            toast.success('Rapport actualisé');
        } catch {
            toast.error("Erreur lors de l'actualisation");
        } finally {
            setRefreshing(false);
        }
    }, [onRefresh]);

    // ── Actions en barre d’outils ─────────────────────────────────────────
    const extraActions = (
        <div className="flex items-center gap-1.5 flex-wrap">
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
                {/* Icône dynamique selon le type */}
                <div className="flex items-center justify-center h-9 w-9 rounded-md bg-blue-700 text-white shrink-0">
                    {type === 'financier' && <TrendingUp className="h-4.5 w-4.5" />}
                    {type === 'candidats' && <Users className="h-4.5 w-4.5" />}
                    {(type === 'lecons_parType' || type === 'lecons_parMoniteur') && <Clock className="h-4.5 w-4.5" />}
                    {type === 'vehicules' && <Car className="h-4.5 w-4.5" />}
                </div>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={cn('font-semibold leading-tight', asCard ? 'text-base' : 'text-lg')}>
                            {title || (type === 'financier' ? 'Rapport financier' :
                                type === 'candidats' ? 'Répartition des candidats' :
                                    type === 'lecons_parType' ? 'Heures par type de leçon' :
                                        type === 'lecons_parMoniteur' ? 'Heures par moniteur' :
                                            'État du parc')}
                        </h3>
                        {/* Badges récapitulatifs */}
                        {stats.map((stat, idx) => (
                            <Badge
                                key={idx}
                                variant="outline"
                                className={cn('text-[10px] h-4 px-1.5 border-0 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300', stat.colorClass)}
                            >
                                {stat.label} : {stat.value}
                            </Badge>
                        ))}
                    </div>
                    {description && <p className="text-xs text-muted-foreground">{description}</p>}
                </div>
            </div>
            <div className="flex items-center gap-1">
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
                pageSizeOptions={[5, 10, 20, 50, 100]}
                searchColumn={getSearchColumn(type)}
                searchPlaceholder="Rechercher…"
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
            <Card className={cn('@container/rapport overflow-hidden shadow-sm rounded-md', className)}>
                <CardHeader className="pb-3 border-b">{header}</CardHeader>
                <CardContent className="pt-4">{tableContent}</CardContent>
            </Card>
        );
    }

    return (
        <div className={cn('@container/rapport w-full flex flex-col gap-4', className)}>
            {header}
            {tableContent}
        </div>
    );
}