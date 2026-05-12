// src/components/tables/paiements/paiements-columns.tsx

/**
 * @module tables/paiements/paiements-columns
 * @description
 * Colonnes pour le tableau des paiements de l’auto‑école COS.
 * Deux variantes disponibles :
 *
 * - `admin`      : affichage complet (date, candidat enrichi (avatar + nom + email),
 *                  montant, mode de paiement (badge), référence, facture (numéro), note, actions)
 * - `secretaire` : colonnes essentielles (date, candidat simplifié, montant, mode, actions)
 *
 * ## Architecture
 *
 * La colonne candidat utilise `createAvatarWithTextColumn` pour afficher l’avatar,
 * le nom complet et l’email/téléphone du candidat (via enrichissements).
 * Les badges de mode de paiement utilisent `MODE_PAIEMENT_CONFIG` depuis `enums.ts`.
 * Le montant est présenté en gras avec la devise FCFA.
 *
 * ## Colonnes disponibles
 *
 * | Colonne       | Variante        | Description                                      |
 * |---------------|-----------------|--------------------------------------------------|
 * | `date`        | toutes          | Date du paiement (formatée avec tooltip)         |
 * | `candidat`    | admin/secrétaire| Avatar + nom + email (admin) / nom seul (secr.)  |
 * | `montant`     | toutes          | Montant en FCFA (gras, couleur positive)         |
 * | `mode`        | toutes          | Badge (Espèces, Chèque, Virement, Carte, Mobile)|
 * | `reference`   | admin           | Référence externe (ex: numéro chèque, ID mobile) |
 * | `facture`     | admin           | Numéro de facture associée (via enrichissement)  |
 * | `note`        | admin           | Note / commentaire                               |
 * | `actions`     | admin/secrétaire| Menu (voir, modifier, supprimer, imprimer reçu)  |
 *
 * @see {@link PaiementsColumnsOptions}
 * @see {@link PaiementsEnrichments}
 * @see {@link PaiementsTableActions}
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * const columns = getAdminPaiementsColumns(actions, {
 *   getCandidatNomComplet: (p) => `${p.candidat?.prenom} ${p.candidat?.nom}`,
 *   getCandidatEmail: (p) => p.candidat?.email,
 *   getCandidatAvatarUrl: (p) => p.candidat?.avatarUrl,
 *   getFactureNumero: (p) => p.facture?.numero,
 * });
 * ```
 */

import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar,
  Coins,
  Receipt,
  FileText,
  StickyNote,
  Eye,
  Pencil,
  Printer,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { DataTableRowActions } from '@/components/tables/data-table-row-actions';
import { createAvatarWithTextColumn } from '@/components/tables/factory';
import { cn } from '@/lib/utils';
import type {
  Paiement,
  PaiementsEnrichments,
  PaiementsColumnsOptions,
  PaiementsTableActions,
} from '@/types/paiements.types';
import type { ModePaiement } from '@/types/enums';
import { MODE_PAIEMENT_CONFIG } from '@/types/enums';
import type { RowActionsConfig, CustomRowAction } from '@/components/tables/types';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formate un montant en FCFA avec notation compacte et couleur.
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
 * Colonne "Date" – avec tooltip précis.
 * @internal
 */
function colDate(): ColumnDef<Paiement> {
  return {
    accessorKey: 'date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" icon={Calendar} />,
    cell: ({ row }) => {
      const raw = row.original.date;
      const date = new Date(raw);
      if (isNaN(date.getTime())) return <span className="text-xs text-muted-foreground">—</span>;
      const formatted = format(date, 'd MMM yyyy', { locale: fr });
      const full = format(date, "d MMMM yyyy 'à' HH:mm", { locale: fr });
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-xs cursor-default">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="capitalize">{formatted}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>{full}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    enableSorting: true,
    size: 110,
  };
}

/**
 * Colonne "Montant" – en gras avec devise.
 * @internal
 */
function colMontant(): ColumnDef<Paiement> {
  return {
    accessorKey: 'montant',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Montant" icon={Coins} />,
    cell: ({ row }) => {
      const montant = row.original.montant;
      return (
        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
          {formatCurrency(montant)}
        </span>
      );
    },
    enableSorting: true,
    size: 130,
  };
}

/**
 * Colonne "Mode de paiement" – badge depuis enums.ts
 * @internal
 */
function colMode(): ColumnDef<Paiement> {
  return {
    accessorKey: 'mode',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Mode" />,
    cell: ({ row }) => {
      const mode = row.original.mode as ModePaiement;
      const cfg = MODE_PAIEMENT_CONFIG[mode];
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
    size: 130,
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  };
}

/**
 * Colonne "Référence" – admin seulement.
 * @internal
 */
function colReference(): ColumnDef<Paiement> {
  return {
    accessorKey: 'reference',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Référence" icon={FileText} />
    ),
    cell: ({ row }) => {
      const ref = row.original.reference;
      if (!ref) return <span className="text-xs text-muted-foreground">—</span>;
      return <span className="text-xs font-mono">{ref}</span>;
    },
    enableSorting: true,
    size: 140,
  };
}

/**
 * Colonne "Note" – admin seulement, avec tooltip si trop long.
 * @internal
 */
function colNote(): ColumnDef<Paiement> {
  return {
    accessorKey: 'note',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Note" icon={StickyNote} />
    ),
    cell: ({ row }) => {
      const note = row.original.note;
      if (!note) return <span className="text-xs text-muted-foreground">—</span>;
      const truncated = note.length > 40 ? note.slice(0, 40) + '…' : note;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs cursor-default">{truncated}</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{note}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    enableSorting: false,
    size: 150,
  };
}

/**
 * Colonne "Facture" – numéro de facture via enrichissement.
 * @param getFactureNumero - Fonction retournant le numéro de facture
 * @internal
 */
function colFacture(getFactureNumero: (p: Paiement) => string): ColumnDef<Paiement> {
  return {
    id: 'facture',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Facture" icon={Receipt} />
    ),
    cell: ({ row }) => {
      const numero = getFactureNumero(row.original);
      if (!numero) return <span className="text-xs text-muted-foreground">—</span>;
      return <span className="text-xs font-mono">{numero}</span>;
    },
    enableSorting: false,
    size: 120,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNE CANDIDAT (AVEC AVATAR ET COORDONNÉES) – via enrichissements
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonne "Candidat" enrichie : avatar + nom complet + email/téléphone.
 * @param enrichments - Fonctions d’enrichissement
 * @internal
 */
function colCandidatEnriched(enrichments: PaiementsEnrichments): ColumnDef<Paiement> {
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
  return createAvatarWithTextColumn<Paiement>({
    accessorKey: 'candidatId',
    title: 'Candidat',
    icon: User,
    getAvatarUrl: (p) => getCandidatAvatarUrl?.(p) ?? '',
    getInitials: (p) => getCandidatInitials?.(p) ?? '?',
    getPrimaryText: (p) => getCandidatNomComplet(p),
    getSecondaryText: (p) => {
      const email = getCandidatEmail?.(p);
      const phone = getCandidatTelephone?.(p);
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
function colCandidatSimple(getNomComplet: (p: Paiement) => string): ColumnDef<Paiement> {
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
 * Génère la colonne d’actions.
 * @param actions - Callbacks d’actions
 * @param variant - Rôle
 * @internal
 */
function colActions(
  actions?: PaiementsTableActions,
  variant: 'admin' | 'secretaire' = 'admin'
): ColumnDef<Paiement> {
  return {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const paiement = row.original;
      const customActions: CustomRowAction<Paiement>[] = [];

      if (actions?.onView)
        customActions.push({
          label: 'Voir le détail',
          icon: <Eye className="mr-2 h-4 w-4" />,
          onClick: (p) => actions.onView!(p),
        });
      if (actions?.onEdit && variant === 'admin')
        customActions.push({
          label: 'Modifier',
          icon: <Pencil className="mr-2 h-4 w-4" />,
          onClick: (p) => actions.onEdit!(p),
        });
      if (actions?.onPrintReceipt)
        customActions.push({
          label: 'Imprimer le reçu',
          icon: <Printer className="mr-2 h-4 w-4" />,
          onClick: (p) => actions.onPrintReceipt!(p),
        });
      if (actions?.onViewFacture && variant === 'admin')
        customActions.push({
          label: 'Voir la facture',
          icon: <Receipt className="mr-2 h-4 w-4" />,
          onClick: (p) => actions.onViewFacture!(p),
        });

      const rowActionsConfig: RowActionsConfig<Paiement> = {
        customActions,
        onDelete: variant === 'admin' ? actions?.onDelete : undefined,
      };
      return <DataTableRowActions row={paiement} actions={rowActionsConfig} />;
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
 * Génère le tableau de colonnes pour le tableau des paiements.
 *
 * @param options - Configuration (variant, actions, enrichments, columnConfig)
 * @returns Tableau de colonnes TanStack Table
 */
export function getPaiementsColumns({
  variant = 'admin',
  actions,
  enrichments = {},
  columnConfig = {},
}: PaiementsColumnsOptions): ColumnDef<Paiement>[] {
  const {
    showDate = true,
    showCandidat = true,
    showMontant = true,
    showMode = true,
    showReference = false,
    showFacture = false,
    showNote = false,
    showActions = true,
  } = columnConfig;

  const cols: ColumnDef<Paiement>[] = [];

  if (showDate) cols.push(colDate());

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

  if (showMontant) cols.push(colMontant());
  if (showMode) cols.push(colMode());
  if (showReference && variant === 'admin') cols.push(colReference());
  if (showFacture && variant === 'admin' && enrichments.getFactureNumero)
    cols.push(colFacture(enrichments.getFactureNumero));
  if (showNote && variant === 'admin') cols.push(colNote());
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
export function getAdminPaiementsColumns(
  actions?: PaiementsTableActions,
  enrichments?: PaiementsEnrichments,
  columnConfig = {}
): ColumnDef<Paiement>[] {
  return getPaiementsColumns({
    variant: 'admin',
    actions,
    enrichments,
    columnConfig: {
      showDate: true,
      showCandidat: true,
      showMontant: true,
      showMode: true,
      showReference: true,
      showFacture: !!enrichments?.getFactureNumero,
      showNote: true,
      showActions: true,
      ...columnConfig,
    },
  });
}

/**
 * Colonnes pour la vue secrétaire (colonnes essentielles)
 */
export function getSecretairePaiementsColumns(
  actions?: PaiementsTableActions,
  enrichments?: PaiementsEnrichments,
  columnConfig = {}
): ColumnDef<Paiement>[] {
  return getPaiementsColumns({
    variant: 'secretaire',
    actions,
    enrichments,
    columnConfig: {
      showDate: true,
      showCandidat: true,
      showMontant: true,
      showMode: true,
      showReference: false,
      showFacture: false,
      showNote: false,
      showActions: true,
      ...columnConfig,
    },
  });
}
