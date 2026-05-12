/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/tables/rapports/rapports-columns.tsx

/**
 * @module tables/rapports/rapports-columns
 * @description
 * Colonnes réutilisables pour l’affichage des tableaux de rapports
 * (financier, candidats, leçons, véhicules).
 *
 * Chaque fonction retourne un tableau de `ColumnDef` adapté à la structure
 * des données du rapport correspondant.
 *
 * ## Types de rapports supportés
 * - `financier`   : tableau des métriques (période, paiements, dépenses, bénéfice)
 * - `candidats`   : tableau de répartition par statut (avec badges)
 * - `lecons`      : deux tableaux distincts (par type de leçon, par moniteur)
 * - `vehicules`   : tableau des métriques du parc (total, dispo, entretien, etc.)
 *
 * @see {@link RapportFinancier}
 * @see {@link RapportCandidats}
 * @see {@link RapportLecons}
 * @see {@link RapportVehicules}
 * @see {@link RapportsEnrichments}
 *
 * @author Stive Junior
 * @version 2.0.0
 */

import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { User, Clock, PieChart, Tag, TrendingUp, TrendingDown, Wallet, Car, Gauge, Wrench, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RapportFinancier, RapportLecons, RapportVehicules, RapportsEnrichments } from '@/types/rapports.types';

// ─────────────────────────────────────────────────────────────────────────────
// PARTIE 1 : RAPPORT FINANCIER (une ligne par période)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Type représentant une ligne du tableau financier.
 * On utilise directement `RapportFinancier` car une ligne = un rapport.
 */
export type RapportFinancierRow = RapportFinancier;

/**
 * Génère les colonnes pour le tableau financier.
 * Affiche la période, le total des paiements, le total des dépenses et le bénéfice.
 *
 * @param enrichments - Optionnels, pour formater les montants.
 * @returns Colonnes pour `RapportFinancierRow`
 *
 * @example
 * ```tsx
 * const columns = getRapportFinancierColumns();
 * <DataTable columns={columns} data={[rapport]} />
 * ```
 */
export function getRapportFinancierColumns(
    enrichments?: Pick<RapportsEnrichments, 'formatCurrency'>
): ColumnDef<RapportFinancierRow>[] {
    const formatCurrency = enrichments?.formatCurrency ?? ((m: number) => `${m.toLocaleString('fr-FR')} FCFA`);

    return [
        {
            accessorKey: 'periode',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Période" icon={Calendar} />,
            cell: ({ row }) => <span className="text-sm font-mono">{row.original.periode}</span>,
            enableSorting: true,
            size: 120,
        },
        {
            accessorKey: 'totalPaiements',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Total paiements" icon={TrendingUp} />,
            cell: ({ row }) => (
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(row.original.totalPaiements)}
                </span>
            ),
            enableSorting: true,
            size: 160,
        },
        {
            accessorKey: 'totalDepenses',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Total dépenses" icon={TrendingDown} />,
            cell: ({ row }) => (
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(row.original.totalDepenses)}
                </span>
            ),
            enableSorting: true,
            size: 160,
        },
        {
            accessorKey: 'benefice',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Bénéfice" icon={Wallet} />,
            cell: ({ row }) => {
                const benefice = row.original.benefice;
                return (
                    <span className={cn('text-sm font-bold', benefice >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                        {formatCurrency(benefice)}
                    </span>
                );
            },
            enableSorting: true,
            size: 160,
        },
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTIE 2 : RAPPORT CANDIDATS (répartition par statut)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Représente une ligne dans le tableau de répartition par statut.
 */
export interface StatutCandidatRow {
    statut: string;      // Code du statut (EN_COURS, RECU, etc.)
    label: string;       // Libellé localisé
    nombre: number;
}



/**
 * Configuration des couleurs et libellés pour les statuts de candidat.
 * @internal
 */
const STATUT_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
    EN_COURS: { label: 'En cours', bgColor: 'bg-blue-100 dark:bg-blue-500/20', textColor: 'text-blue-700 dark:text-blue-400' },
    RECU: { label: 'Reçu', bgColor: 'bg-emerald-100 dark:bg-emerald-500/20', textColor: 'text-emerald-700 dark:text-emerald-400' },
    ECHOUE: { label: 'Échoué', bgColor: 'bg-red-100 dark:bg-red-500/20', textColor: 'text-red-700 dark:text-red-400' },
    ABANDONNE: { label: 'Abandonné', bgColor: 'bg-gray-100 dark:bg-gray-800', textColor: 'text-gray-700 dark:text-gray-400' },
    EN_ATTENTE: { label: 'En attente', bgColor: 'bg-amber-100 dark:bg-amber-500/20', textColor: 'text-amber-700 dark:text-amber-400' },
};

/**
 * Génère les colonnes pour le tableau de répartition des candidats par statut.
 *
 * @param enrichments - Optionnel, pour personnaliser les libellés.
 * @returns Colonnes `label` (badge) et `nombre`.
 *
 * @example
 * ```tsx
 * const data = Object.entries(rapport.parStatut).map(([statut, nombre]) => ({
 *   statut,
 *   label: STATUT_CONFIG[statut]?.label ?? statut,
 *   nombre
 * }));
 * const columns = getStatutsCandidatsColumns();
 * <DataTable columns={columns} data={data} />
 * ```
 */
export function getStatutsCandidatsColumns(
    enrichments?: Pick<RapportsEnrichments, 'getStatutLabel'>
): ColumnDef<StatutCandidatRow>[] {
    const getLabel = enrichments?.getStatutLabel ?? ((statut: string) => STATUT_CONFIG[statut]?.label ?? statut);

    return [
        {
            accessorKey: 'label',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" icon={Tag} />,
            cell: ({ row }) => {
                const statutCode = row.original.statut;
                const cfg = STATUT_CONFIG[statutCode] ?? { bgColor: 'bg-gray-100', textColor: 'text-gray-700' };
                const label = getLabel(statutCode);
                return (
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.bgColor, cfg.textColor)}>
                        {label}
                    </span>
                );
            },
            enableSorting: true,
            size: 150,
        },
        {
            accessorKey: 'nombre',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" icon={PieChart} />,
            cell: ({ row }) => <span className="text-sm font-semibold tabular-nums">{row.original.nombre}</span>,
            enableSorting: true,
            size: 100,
        },
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTIE 3 : RAPPORT LEÇONS – par type et par moniteur
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Type pour une ligne du tableau des types de leçon.
 */
export interface TypeLeconRow {
    type: string;        // CODE, CONDUITE, CONDUITE_ACCOMPAGNEE
    label: string;
    valeur: number;      // Heures
}

/**
 * Configuration des couleurs et libellés pour les types de leçon.
 * @internal
 */
const TYPE_LECON_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
    CODE: { label: 'Code', bgColor: 'bg-indigo-100 dark:bg-indigo-500/20', textColor: 'text-indigo-700 dark:text-indigo-400' },
    CONDUITE: { label: 'Conduite', bgColor: 'bg-emerald-100 dark:bg-emerald-500/20', textColor: 'text-emerald-700 dark:text-emerald-400' },
    CONDUITE_ACCOMPAGNEE: { label: 'Conduite accompagnée', bgColor: 'bg-purple-100 dark:bg-purple-500/20', textColor: 'text-purple-700 dark:text-purple-400' },
};

/**
 * Génère les colonnes pour le tableau de répartition des heures par type de leçon.
 *
 * @param enrichments - Optionnel, pour personnaliser les libellés et le formatage des heures.
 * @returns Colonnes `label` (badge) et `valeur` (heures)
 *
 * @example
 * ```tsx
 * const data = Object.entries(rapport.parType).map(([type, valeur]) => ({
 *   type,
 *   label: TYPE_LECON_CONFIG[type]?.label ?? type,
 *   valeur
 * }));
 * const columns = getTypeLeconsColumns();
 * <DataTable columns={columns} data={data} />
 * ```
 */
export function getTypeLeconsColumns(
    enrichments?: Pick<RapportsEnrichments, 'getTypeLeconLabel' | 'formatHeures'>
): ColumnDef<TypeLeconRow>[] {
    const getLabel = enrichments?.getTypeLeconLabel ?? ((type: string) => TYPE_LECON_CONFIG[type]?.label ?? type);
    const formatHeures = enrichments?.formatHeures ?? ((h: number) => (h % 1 === 0 ? h.toString() : h.toFixed(1)) + ' h');

    return [
        {
            accessorKey: 'label',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Type de leçon" icon={Tag} />,
            cell: ({ row }) => {
                const typeCode = row.original.type;
                const cfg = TYPE_LECON_CONFIG[typeCode] ?? { bgColor: 'bg-gray-100', textColor: 'text-gray-700' };
                const label = getLabel(typeCode);
                return (
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.bgColor, cfg.textColor)}>
                        {label}
                    </span>
                );
            },
            enableSorting: true,
            size: 200,
        },
        {
            accessorKey: 'valeur',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Heures" icon={Clock} />,
            cell: ({ row }) => <span className="text-sm font-semibold tabular-nums">{formatHeures(row.original.valeur)}</span>,
            enableSorting: true,
            size: 100,
        },
    ];
}

/**
 * Type pour une ligne du tableau des moniteurs (parMoniteur).
 */
export type MoniteurHeuresRow = RapportLecons['parMoniteur'][number];

/**
 * Génère les colonnes pour le tableau des heures par moniteur.
 *
 * @param enrichments - Optionnel, pour formater les heures.
 * @returns Colonnes `moniteurNom` et `heures`.
 *
 * @example
 * ```tsx
 * const columns = getMoniteursHeuresColumns();
 * <DataTable columns={columns} data={rapport.parMoniteur} />
 * ```
 */
export function getMoniteursHeuresColumns(
    enrichments?: Pick<RapportsEnrichments, 'formatHeures'>
): ColumnDef<MoniteurHeuresRow>[] {
    const formatHeures = enrichments?.formatHeures ?? ((h: number) => (h % 1 === 0 ? h.toString() : h.toFixed(1)) + ' h');

    return [
        {
            accessorKey: 'moniteurNom',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Moniteur" icon={User} />,
            cell: ({ row }) => <span className="text-sm font-medium">{row.original.moniteurNom}</span>,
            enableSorting: true,
            size: 250,
        },
        {
            accessorKey: 'heures',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Heures" icon={Clock} />,
            cell: ({ row }) => <span className="text-sm font-semibold tabular-nums">{formatHeures(row.original.heures)}</span>,
            enableSorting: true,
            size: 120,
        },
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTIE 4 : RAPPORT VÉHICULES (une ligne par rapport)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Type représentant une ligne du rapport véhicules.
 */
export type RapportVehiculesRow = RapportVehicules;

/**
 * Génère les colonnes pour le tableau des métriques des véhicules.
 *
 * @param enrichments - Optionnel, pour formater les kilométrages.
 * @returns Colonnes pour `RapportVehiculesRow`
 *
 * @example
 * ```tsx
 * const columns = getRapportVehiculesColumns();
 * <DataTable columns={columns} data={[rapport]} />
 * ```
 */
export function getRapportVehiculesColumns(
    enrichments?: Pick<RapportsEnrichments, 'formatKm'>
): ColumnDef<RapportVehiculesRow>[] {
    const formatKm = enrichments?.formatKm ?? ((km: number) => km.toLocaleString('fr-FR') + ' km');

    return [
        {
            accessorKey: 'totalVehicules',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Total véhicules" icon={Car} />,
            cell: ({ row }) => <span className="text-sm font-semibold">{row.original.totalVehicules}</span>,
            enableSorting: true,
            size: 130,
        },
        {
            accessorKey: 'disponibles',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Disponibles" icon={Car} />,
            cell: ({ row }) => <span className="text-sm text-emerald-600">{row.original.disponibles}</span>,
            enableSorting: true,
            size: 120,
        },
        {
            accessorKey: 'enEntretien',
            header: ({ column }) => <DataTableColumnHeader column={column} title="En entretien" icon={Wrench} />,
            cell: ({ row }) => <span className="text-sm text-amber-600">{row.original.enEntretien}</span>,
            enableSorting: true,
            size: 120,
        },
        {
            accessorKey: 'horsService',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Hors service" icon={Car} />,
            cell: ({ row }) => <span className="text-sm text-red-600">{row.original.horsService}</span>,
            enableSorting: true,
            size: 120,
        },
        {
            accessorKey: 'kilometrageMoyen',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Kilométrage moyen" icon={Gauge} />,
            cell: ({ row }) => <span className="text-sm tabular-nums">{formatKm(row.original.kilometrageMoyen)}</span>,
            enableSorting: true,
            size: 160,
        },
        {
            accessorKey: 'entretiensAnnee',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Entretiens / an" icon={Calendar} />,
            cell: ({ row }) => <span className="text-sm">{row.original.entretiensAnnee}</span>,
            enableSorting: true,
            size: 130,
        },
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// FONCTION GÉNÉRIQUE (facultative) pour obtenir les colonnes selon le type
// ─────────────────────────────────────────────────────────────────────────────

export type RapportType = 'financier' | 'candidats' | 'lecons_parType' | 'lecons_parMoniteur' | 'vehicules';

/**
 * Retourne les colonnes adaptées au type de rapport demandé.
 *
 * @param type - Le type de colonnes souhaité.
 * @param enrichments - Enrichissements optionnels (formatage, libellés).
 * @returns Colonnes correspondantes.
 *
 * @example
 * ```tsx
 * const columns = getRapportColumns('lecons_parMoniteur');
 * ```
 */
export function getRapportColumns(
    type: RapportType,
    enrichments?: RapportsEnrichments
): ColumnDef<any>[] {
    switch (type) {
        case 'financier':
            return getRapportFinancierColumns(enrichments);
        case 'candidats':
            return getStatutsCandidatsColumns(enrichments);
        case 'lecons_parType':
            return getTypeLeconsColumns(enrichments);
        case 'lecons_parMoniteur':
            return getMoniteursHeuresColumns(enrichments);
        case 'vehicules':
            return getRapportVehiculesColumns(enrichments);
        default:
            return [];
    }
}