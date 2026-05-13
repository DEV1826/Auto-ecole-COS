// src/components/tables/factures/factures-columns.tsx

/**
 * @module tables/factures/factures-columns
 * @description
 * Colonnes pour le tableau des factures de l’auto‑école COS.
 * Deux variantes disponibles :
 *
 * - `admin`      : affichage complet (numéro, candidat enrichi (avatar + nom + email),
 *                  montant total, montant payé, statut, dates, échéance, actions)
 * - `secretaire` : colonnes essentielles (numéro, candidat simplifié, montant total, statut, actions)
 *
 * ## Architecture
 *
 * La colonne candidat utilise `createAvatarWithTextColumn` pour afficher l’avatar,
 * le nom complet et l’email/téléphone du candidat (via enrichissements).
 * Le montant payé est calculé via l’enrichissement `getMontantPaye`.
 * Les badges de statut utilisent `STATUT_FACTURE_CONFIG` depuis `enums.ts`.
 *
 * ## Colonnes disponibles
 *
 * | Colonne          | Variante        | Description                                      |
 * |------------------|-----------------|--------------------------------------------------|
 * | `numero`         | toutes          | Numéro de facture                                |
 * | `candidat`       | admin/secrétaire| Avatar + nom + email (admin) / nom seul (secrétaire)|
 * | `montantTotal`   | toutes          | Montant total (formaté FCFA)                     |
 * | `montantPaye`    | admin           | Montant déjà réglé (via enrichissement)          |
 * | `statut`         | toutes          | Badge En attente / Partiellement payée / Payée / Annulée |
 * | `dateEmission`   | admin           | Date d’émission (formatée)                       |
 * | `dateEcheance`   | admin           | Date d’échéance (optionnelle)                    |
 * | `actions`        | admin/secrétaire| Menu (voir, télécharger PDF, ajouter paiement, etc.) |
 *
 * @see {@link FacturesColumnsOptions}
 * @see {@link FacturesEnrichments}
 * @see {@link FacturesTableActions}
 *
 * @author Stive Junior
 * @version .0.0
 *
 * @example
 * ```tsx
 * const columns = getAdminFacturesColumns(actions, {
 *   getCandidatNomComplet: (f) => `${f.candidat?.prenom} ${f.candidat?.nom}`,
 *   getCandidatEmail: (f) => f.candidat?.email,
 *   getCandidatAvatarUrl: (f) => f.candidat?.avatarUrl,
 *   getMontantPaye: (f) => f.paiements?.reduce((sum, p) => sum + p.montant, 0) ?? 0,
 * });
 * ```
 */

import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  FileText,
  User,
  Calendar,
  CreditCard,
  Eye,
  Pencil,
  Download,
  PlusCircle,
  History,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { DataTableRowActions } from '@/components/tables/data-table-row-actions';
import { createAvatarWithTextColumn } from '@/components/tables/factory';
import { cn } from '@/lib/utils';
import type {
  Facture,
  FacturesEnrichments,
  FacturesColumnsOptions,
  FacturesTableActions,
} from '@/types/factures.types';
import type { StatutFacture } from '@/types/enums';
import { STATUT_FACTURE_CONFIG } from '@/types/enums';
import type { RowActionsConfig, CustomRowAction } from '@/components/tables/types';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formate un montant en FCFA avec notation compacte.
 * @internal
 */
function formatCurrency(montant: number): string {
  if (montant >= 1_000_000) return (montant / 1_000_000).toFixed(1) + 'M FCFA';
  if (montant >= 1_000) return (montant / 1_000).toFixed(1) + 'k FCFA';
  return montant.toLocaleString('fr-FR') + ' FCFA';
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNES FIXES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonne "Numéro de facture"
 * @internal
 */
function colNumero(): ColumnDef<Facture> {
  return {
    accessorKey: 'numero',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="N° Facture" icon={FileText} />
    ),
    cell: ({ row }) => <span className="text-xs font-mono font-medium">{row.original.numero}</span>,
    enableSorting: true,
    size: 130,
  };
}

/**
 * Colonne "Montant total"
 * @internal
 */
function colMontantTotal(): ColumnDef<Facture> {
  return {
    accessorKey: 'montantTotal',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Montant total" icon={CreditCard} />
    ),
    cell: ({ row }) => (
      <span className="text-xs font-semibold tabular-nums">
        {formatCurrency(row.original.montantTotal)}
      </span>
    ),
    enableSorting: true,
    size: 120,
  };
}

/**
 * Colonne "Montant payé" (via enrichissement)
 * @param getMontantPaye - Fonction retournant le montant déjà payé
 * @internal
 */
function colMontantPaye(getMontantPaye: (f: Facture) => number): ColumnDef<Facture> {
  return {
    id: 'montantPaye',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Montant payé" icon={CreditCard} />
    ),
    cell: ({ row }) => {
      const paye = getMontantPaye(row.original);
      return (
        <span className="text-xs text-emerald-600 dark:text-emerald-400">
          {formatCurrency(paye)}
        </span>
      );
    },
    enableSorting: true,
    sortingFn: (a, b) => getMontantPaye(a.original) - getMontantPaye(b.original),
    size: 120,
  };
}

/**
 * Colonne "Statut" – badge coloré depuis enums.ts
 * @internal
 */
function colStatut(): ColumnDef<Facture> {
  return {
    accessorKey: 'statut',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" />,
    cell: ({ row }) => {
      const statut = row.original.statut as StatutFacture;
      const cfg = STATUT_FACTURE_CONFIG[statut];
      if (!cfg) return <span className="text-xs text-muted-foreground">—</span>;
      const Icon = cfg.icon;
      return (
        <Badge
          variant="outline"
          className={cn('gap-1.5 text-xs font-medium border-0', cfg.bgColor, cfg.textColor)}
        >
          <Icon className={cn('h-3 w-3 shrink-0', cfg.textColor)} />
          {cfg.label}
        </Badge>
      );
    },
    enableSorting: true,
    size: 140,
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  };
}

/**
 * Colonne "Date d'émission" – formatée
 * @internal
 */
function colDateEmission(): ColumnDef<Facture> {
  return {
    accessorKey: 'dateEmission',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Émis le" icon={Calendar} />
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.dateEmission);
      if (isNaN(date.getTime())) return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <span className="text-xs capitalize">{format(date, 'd MMM yyyy', { locale: fr })}</span>
      );
    },
    enableSorting: true,
    size: 110,
  };
}

/**
 * Colonne "Date d'échéance" – formatée (optionnelle)
 * @internal
 */
function colDateEcheance(): ColumnDef<Facture> {
  return {
    accessorKey: 'dateEcheance',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Échéance" icon={Calendar} />
    ),
    cell: ({ row }) => {
      const raw = row.original.dateEcheance;
      if (!raw) return <span className="text-xs text-muted-foreground">—</span>;
      const date = new Date(raw);
      if (isNaN(date.getTime())) return <span className="text-xs text-muted-foreground">—</span>;
      const isOverdue = date < new Date() && row.original.statut !== 'PAYEE';
      return (
        <span className={cn('text-xs capitalize', isOverdue && 'text-red-600 dark:text-red-400')}>
          {format(date, 'd MMM yyyy', { locale: fr })}
        </span>
      );
    },
    enableSorting: true,
    size: 110,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNE CANDIDAT AVEC AVATAR ET COORDONNÉES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonne "Candidat" enrichie (avatar + nom + email/téléphone) pour admin.
 * @param enrichments - Fonctions d’enrichissement
 * @internal
 */
function colCandidatEnriched(enrichments: FacturesEnrichments): ColumnDef<Facture> {
  const {
    getCandidatNomComplet,
    getCandidatEmail,
    getCandidatTelephone,
    getCandidatAvatarUrl,
    getCandidatInitials,
  } = enrichments;
  if (!getCandidatNomComplet) {
    return {
      id: 'candidat',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Candidat" icon={User} />
      ),
      cell: () => <span className="text-xs text-muted-foreground">—</span>,
      enableSorting: false,
      size: 200,
    };
  }
  return createAvatarWithTextColumn<Facture>({
    accessorKey: 'candidatId',
    title: 'Candidat',
    icon: User,
    getAvatarUrl: () => getCandidatAvatarUrl?.() ?? '',
    getInitials: () => getCandidatInitials?.() ?? '?',
    getPrimaryText: () => getCandidatNomComplet(),
    getSecondaryText: () => {
      const email = getCandidatEmail?.();
      const phone = getCandidatTelephone?.();
      if (email && phone) return `${email} · ${phone}`;
      return email ?? phone ?? '';
    },
    avatarSize: 'md',
    enableSorting: false,
    size: 280,
  });
}

/**
 * Colonne "Candidat" simplifiée (nom seul) pour secrétaire.
 * @param getNomComplet - Fonction retournant le nom complet
 * @internal
 */
function colCandidatSimple(getNomComplet: (f: Facture) => string): ColumnDef<Facture> {
  return {
    id: 'candidat',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Candidat" icon={User} />,
    cell: ({ row }) => <span className="text-xs">{getNomComplet(row.original) || '—'}</span>,
    enableSorting: false,
    size: 200,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNE D’ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère la colonne d’actions selon la variante.
 * @param actions - Callbacks d’actions
 * @param variant - Rôle
 * @internal
 */
function colActions(
  actions?: FacturesTableActions,
  variant: 'admin' | 'secretaire' = 'admin'
): ColumnDef<Facture> {
  return {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const facture = row.original;
      const customActions: CustomRowAction<Facture>[] = [];

      if (actions?.onView)
        customActions.push({
          label: 'Voir le détail',
          icon: <Eye className="mr-2 h-4 w-4" />,
          onClick: (f) => actions.onView!(f),
        });
      if (actions?.onEdit && variant === 'admin')
        customActions.push({
          label: 'Modifier',
          icon: <Pencil className="mr-2 h-4 w-4" />,
          onClick: (f) => actions.onEdit!(f),
        });
      if (actions?.onDownloadPDF)
        customActions.push({
          label: 'Télécharger PDF',
          icon: <Download className="mr-2 h-4 w-4" />,
          onClick: (f) => actions.onDownloadPDF!(f),
        });
      if (actions?.onAddPayment)
        customActions.push({
          label: 'Ajouter un paiement',
          icon: <PlusCircle className="mr-2 h-4 w-4" />,
          onClick: (f) => actions.onAddPayment!(f),
        });
      if (actions?.onViewPayments)
        customActions.push({
          label: 'Voir les paiements',
          icon: <History className="mr-2 h-4 w-4" />,
          onClick: (f) => actions.onViewPayments!(f),
        });

      const rowActionsConfig: RowActionsConfig<Facture> = {
        customActions,
        onDelete: actions?.onDelete,
      };
      return <DataTableRowActions row={facture} actions={rowActionsConfig} />;
    },
    enableSorting: false,
    enableHiding: false,
    size: 50,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FONCTION PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère le tableau de colonnes pour le tableau des factures.
 *
 * @param options - Configuration (variant, actions, enrichments, columnConfig)
 * @returns Tableau de colonnes TanStack Table
 */
export function getFacturesColumns({
  variant = 'admin',
  actions,
  enrichments = {},
  columnConfig = {},
}: FacturesColumnsOptions): ColumnDef<Facture>[] {
  const {
    showNumero = true,
    showCandidat = true,
    showMontant = true,
    showStatut = true,
    showDateEmission = true,
    showDateEcheance = false,
    showMontantPaye = true,
    showActions = true,
  } = columnConfig;

  const cols: ColumnDef<Facture>[] = [];

  if (showNumero) cols.push(colNumero());

  // Colonne candidat
  if (showCandidat) {
    if (variant === 'admin' && enrichments.getCandidatNomComplet) {
      cols.push(colCandidatEnriched(enrichments));
    } else if (variant === 'secretaire' && enrichments.getCandidatNomComplet) {
      cols.push(colCandidatSimple(enrichments.getCandidatNomComplet));
    } else {
      cols.push({
        id: 'candidat',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Candidat" icon={User} />
        ),
        cell: () => <span className="text-xs text-muted-foreground">—</span>,
        enableSorting: false,
        size: 180,
      });
    }
  }

  if (showMontant) cols.push(colMontantTotal());
  if (showMontantPaye && variant === 'admin' && enrichments.getMontantPaye)
    cols.push(colMontantPaye(enrichments.getMontantPaye));
  if (showStatut) cols.push(colStatut());
  if (showDateEmission && variant === 'admin') cols.push(colDateEmission());
  if (showDateEcheance && variant === 'admin') cols.push(colDateEcheance());
  if (showActions && actions && Object.keys(actions).length > 0)
    cols.push(colActions(actions, variant));

  return cols;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRÉ‑SETS PAR RÔLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonnes pour la vue administrateur (toutes colonnes + candidat enrichi)
 */
export function getAdminFacturesColumns(
  actions?: FacturesTableActions,
  enrichments?: FacturesEnrichments,
  columnConfig = {}
): ColumnDef<Facture>[] {
  return getFacturesColumns({
    variant: 'admin',
    actions,
    enrichments,
    columnConfig: {
      showNumero: true,
      showCandidat: true,
      showMontant: true,
      showStatut: true,
      showDateEmission: true,
      showDateEcheance: true,
      showMontantPaye: true,
      showActions: true,
      ...columnConfig,
    },
  });
}

/**
 * Colonnes pour la vue secrétaire (colonnes essentielles + candidat simple)
 */
export function getSecretaireFacturesColumns(
  actions?: FacturesTableActions,
  enrichments?: FacturesEnrichments,
  columnConfig = {}
): ColumnDef<Facture>[] {
  return getFacturesColumns({
    variant: 'secretaire',
    actions,
    enrichments,
    columnConfig: {
      showNumero: true,
      showCandidat: true,
      showMontant: true,
      showStatut: true,
      showDateEmission: false,
      showDateEcheance: false,
      showMontantPaye: false,
      showActions: true,
      ...columnConfig,
    },
  });
}
