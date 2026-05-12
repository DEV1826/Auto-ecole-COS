// src/components/tables/examens/examens-columns.tsx

/**
 * @module tables/examens/examens-columns
 * @description
 * Colonnes pour le tableau des examens (code ou conduite) de l’auto‑école COS.
 * Trois variantes disponibles :
 *
 * - `admin`      : affichage complet (date, type, candidat enrichi (avatar + nom + email),
 *                  résultat, note, centre, actions)
 * - `secretaire` : colonnes essentielles (date, type, candidat simplifié, résultat, actions)
 * - `moniteur`   : vue restreinte (date, type, candidat simplifié, résultat, note)
 *
 * ## Architecture
 *
 * La colonne candidat utilise `createAvatarWithTextColumn` pour afficher l’avatar,
 * le nom complet et l’email/téléphone du candidat (via enrichissements).
 * Les badges pour le type d’examen (`CODE` / `CONDUIT`) et le résultat
 * (`RECU` / `AJOURNE` / `EN_ATTENTE`) sont configurés depuis `enums.ts`.
 *
 * ## Colonnes disponibles
 *
 * | Colonne       | Variante        | Description                                      |
 * |---------------|-----------------|--------------------------------------------------|
 * | `date`        | toutes          | Date/heure de l’examen (formatée avec tooltip)   |
 * | `type`        | toutes          | Badge Code / Conduite                            |
 * | `candidat`    | admin/secrétaire| Avatar + nom + email (admin) / nom seul (secrétaire)|
 * | `resultat`    | toutes          | Badge Reçu / Ajourné / En attente                |
 * | `note`        | admin/moniteu   | Note sur 20 (avec tooltip si commentaire)       |
 * | `centre`      | admin           | Lieu d’examen                                    |
 * | `actions`     | admin/secrétaire| Menu (voir, modifier, supprimer, imprimer)       |
 *
 * @see {@link ExamensColumnsOptions}
 * @see {@link ExamensEnrichments}
 * @see {@link ExamensTableActions}
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * const columns = getAdminExamensColumns(actions, {
 *   getCandidatNomComplet: (e) => `${e.candidat?.prenom} ${e.candidat?.nom}`,
 *   getCandidatEmail: (e) => e.candidat?.email,
 *   getCandidatAvatarUrl: (e) => e.candidat?.avatarUrl,
 * });
 * ```
 */

import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, MapPin, Eye, Pencil, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { DataTableRowActions } from '@/components/tables/data-table-row-actions';
import { createAvatarWithTextColumn } from '@/components/tables/factory';
import { cn } from '@/lib/utils';
import type {
  Examen,
  ExamensEnrichments,
  ExamensColumnsOptions,
  ExamensTableActions,
} from '@/types/examens.types';
import type { TypeExamen, ResultatExamen } from '@/types/enums';
import { TYPE_EXAMEN_CONFIG, RESULTAT_EXAMEN_CONFIG } from '@/types/enums';
import type { RowActionsConfig, CustomRowAction } from '@/components/tables/types';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formate la date/heure de l’examen (ex: "15 mai 2025 à 09:00")
 * @internal
 */
function formatExamenDate(date: Date | string): string {
  const d = new Date(date);
  return format(d, "d MMM yyyy 'à' HH:mm", { locale: fr });
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNES FIXES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonne "Date" – formatée avec tooltip détaillé.
 * @internal
 */
function colDate(): ColumnDef<Examen> {
  return {
    accessorKey: 'date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" icon={Calendar} />,
    cell: ({ row }) => {
      const raw = row.original.date;
      const date = new Date(raw);
      if (isNaN(date.getTime())) return <span className="text-xs text-muted-foreground">—</span>;
      const formatted = format(date, 'd MMM yyyy', { locale: fr });
      const full = formatExamenDate(date);
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
 * Colonne "Type" – badge Code / Conduite (depuis enums.ts)
 * @internal
 */
function colType(): ColumnDef<Examen> {
  return {
    accessorKey: 'type',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => {
      const type = row.original.type as TypeExamen;
      const cfg = TYPE_EXAMEN_CONFIG[type];
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
    size: 110,
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  };
}

/**
 * Colonne "Résultat" – badge (Reçu / Ajourné / En attente)
 * @internal
 */
function colResultat(): ColumnDef<Examen> {
  return {
    accessorKey: 'resultat',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Résultat" />,
    cell: ({ row }) => {
      const resultat = row.original.resultat as ResultatExamen;
      const cfg = RESULTAT_EXAMEN_CONFIG[resultat];
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
    size: 120,
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  };
}

/**
 * Colonne "Note" – affichée avec tooltip si note ajoutée.
 * @internal
 */
function colNote(): ColumnDef<Examen> {
  return {
    accessorKey: 'note',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Note" />,
    cell: ({ row }) => {
      const note = row.original.note;
      if (note === undefined || note === null)
        return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs font-semibold tabular-nums cursor-default">{note}/20</span>
            </TooltipTrigger>
            {row.original.notes && <TooltipContent>{row.original.notes}</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      );
    },
    enableSorting: true,
    size: 80,
  };
}

/**
 * Colonne "Centre" – lieu d’examen (admin seulement)
 * @internal
 */
function colCentre(): ColumnDef<Examen> {
  return {
    accessorKey: 'centre',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Centre" icon={MapPin} />,
    cell: ({ row }) => {
      const centre = row.original.centre;
      if (!centre) return <span className="text-xs text-muted-foreground">—</span>;
      return <span className="text-xs">{centre}</span>;
    },
    enableSorting: true,
    size: 160,
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
function colCandidatEnriched(enrichments: ExamensEnrichments): ColumnDef<Examen> {
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
      header: ({ column }) => <DataTableColumnHeader column={column} title="Candidat" />,
      cell: () => <span className="text-xs text-muted-foreground">—</span>,
      enableSorting: false,
      size: 200,
    };
  }
  return createAvatarWithTextColumn<Examen>({
    accessorKey: 'candidatId',
    title: 'Candidat',
    getAvatarUrl: (e) => getCandidatAvatarUrl?.(e) ?? '',
    getInitials: (e) => getCandidatInitials?.(e) ?? '?',
    getPrimaryText: (e) => getCandidatNomComplet(e),
    getSecondaryText: (e) => {
      const email = getCandidatEmail?.(e);
      const phone = getCandidatTelephone?.(e);
      if (email && phone) return `${email} · ${phone}`;
      return email ?? phone ?? '';
    },
    avatarSize: 'md',
    enableSorting: false,
    size: 280,
  });
}

/**
 * Colonne "Candidat" simplifiée (nom seul) pour secrétaire ou moniteur.
 * @param getNomComplet - Fonction retournant le nom complet
 * @internal
 */
function colCandidatSimple(getNomComplet: (e: Examen) => string): ColumnDef<Examen> {
  return {
    id: 'candidat',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Candidat" />,
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
 * @param variant - Rôle (influence les actions affichées)
 * @internal
 */
function colActions(
  actions?: ExamensTableActions,
  variant: 'admin' | 'secretaire' | 'moniteur' = 'admin'
): ColumnDef<Examen> {
  return {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const examen = row.original;
      const customActions: CustomRowAction<Examen>[] = [];

      if (actions?.onView) {
        customActions.push({
          label: 'Voir le détail',
          icon: <Eye className="mr-2 h-4 w-4" />,
          onClick: (e) => actions.onView!(e),
        });
      }
      if (actions?.onEdit && variant !== 'moniteur') {
        customActions.push({
          label: 'Modifier',
          icon: <Pencil className="mr-2 h-4 w-4" />,
          onClick: (e) => actions.onEdit!(e),
        });
      }
      if (actions?.onPrintCertificate && variant === 'admin') {
        customActions.push({
          label: 'Imprimer l’attestation',
          icon: <Printer className="mr-2 h-4 w-4" />,
          onClick: (e) => actions.onPrintCertificate!(e),
        });
      }

      const rowActionsConfig: RowActionsConfig<Examen> = {
        customActions,
        onDelete: variant !== 'moniteur' ? actions?.onDelete : undefined,
      };
      return <DataTableRowActions row={examen} actions={rowActionsConfig} />;
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
 * Génère le tableau de colonnes pour le tableau des examens.
 *
 * @param options - Configuration (variant, actions, enrichments, columnConfig)
 * @returns Tableau de colonnes TanStack Table
 */
export function getExamensColumns({
  variant = 'admin',
  actions,
  enrichments = {},
  columnConfig = {},
}: ExamensColumnsOptions): ColumnDef<Examen>[] {
  const {
    showDate = true,
    showType = true,
    showCandidat = true,
    showResultat = true,
    showNote = true,
    showCentre = false,
    showActions = true,
  } = columnConfig;

  const cols: ColumnDef<Examen>[] = [];

  if (showDate) cols.push(colDate());
  if (showType) cols.push(colType());
  if (showResultat) cols.push(colResultat());

  // Colonne candidat
  if (showCandidat) {
    if (variant === 'admin' && enrichments.getCandidatNomComplet) {
      cols.push(colCandidatEnriched(enrichments));
    } else if (enrichments.getCandidatNomComplet) {
      cols.push(colCandidatSimple(enrichments.getCandidatNomComplet));
    } else {
      cols.push({
        id: 'candidat',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Candidat" />,
        cell: () => <span className="text-xs text-muted-foreground">—</span>,
        enableSorting: false,
        size: 180,
      });
    }
  }

  if (showNote && (variant === 'admin' || variant === 'moniteur')) cols.push(colNote());
  if (showCentre && variant === 'admin') cols.push(colCentre());
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
export function getAdminExamensColumns(
  actions?: ExamensTableActions,
  enrichments?: ExamensEnrichments,
  columnConfig = {}
): ColumnDef<Examen>[] {
  return getExamensColumns({
    variant: 'admin',
    actions,
    enrichments,
    columnConfig: {
      showDate: true,
      showType: true,
      showCandidat: true,
      showResultat: true,
      showNote: true,
      showCentre: true,
      showActions: true,
      ...columnConfig,
    },
  });
}

/**
 * Colonnes pour la vue secrétaire (colonnes essentielles + candidat simple)
 */
export function getSecretaireExamensColumns(
  actions?: ExamensTableActions,
  enrichments?: ExamensEnrichments,
  columnConfig = {}
): ColumnDef<Examen>[] {
  return getExamensColumns({
    variant: 'secretaire',
    actions,
    enrichments,
    columnConfig: {
      showDate: true,
      showType: true,
      showCandidat: true,
      showResultat: true,
      showNote: false,
      showCentre: false,
      showActions: true,
      ...columnConfig,
    },
  });
}

/**
 * Colonnes pour la vue moniteur (date, type, candidat, résultat, note)
 */
export function getMoniteurExamensColumns(
  actions?: ExamensTableActions,
  enrichments?: ExamensEnrichments,
  columnConfig = {}
): ColumnDef<Examen>[] {
  return getExamensColumns({
    variant: 'moniteur',
    actions,
    enrichments,
    columnConfig: {
      showDate: true,
      showType: true,
      showCandidat: true,
      showResultat: true,
      showNote: true,
      showCentre: false,
      showActions: false,
      ...columnConfig,
    },
  });
}
