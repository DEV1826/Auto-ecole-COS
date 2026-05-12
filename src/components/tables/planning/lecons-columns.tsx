// src/components/tables/lecons/lecons-columns.tsx

/**
 * @module tables//lecons-columns
 * @description
 * Colonnes pour le tableau des leçons (planning) de l’auto‑école COS.
 * Trois variantes disponibles :
 *
 * - `admin`      : affichage complet (date, candidat enrichi, moniteur enrichi,
 *                  type, statut, véhicule, durée, actions)
 * - `secretaire` : colonnes essentielles (date, candidat, moniteur, type, statut, actions)
 * - `moniteur`   : vue restreinte (date, candidat, type, statut, actions limitées)
 *
 * ## Architecture
 *
 * Les colonnes Candidat et Moniteur utilisent `createAvatarWithTextColumn`
 * pour afficher avatar, nom et contact (via enrichissements).
 * La colonne Véhicule affiche une icône + immatriculation.
 * Les badges Type et Statut sont définis dans `enums.ts`.
 *
 * ## Colonnes disponibles
 *
 * | Colonne       | Variante        | Description                                      |
 * |---------------|-----------------|--------------------------------------------------|
 * | `date`        | toutes          | Date et heure (formatée avec tooltip)            |
 * | `candidat`    | toutes          | Avatar + nom + email (admin) / nom seul (secr.)  |
 * | `moniteur`    | admin/secrétaire| Avatar + nom (admin) / nom seul                 |
 * | `type`        | toutes          | Badge Code / Conduite / Accompagnée              |
 * | `statut`      | toutes          | Badge Planifiée / Effectuée / Annulée / Absence  |
 * | `vehicule`    | admin           | Icône + immatriculation (via enrichissement)     |
 * | `duree`       | admin           | Durée en minutes (ex: 60 min)                    |
 * | `actions`     | admin/secrétaire| Menu (voir, modifier, annuler, marquer effectué) |
 *
 * @see {@link LeconsColumnsOptions}
 * @see {@link LeconsEnrichments}
 * @see {@link LeconsTableActions}
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * const columns = getAdminLeconsColumns(actions, {
 *   getCandidatNomComplet: (l) => `${l.candidat?.prenom} ${l.candidat?.nom}`,
 *   getMoniteurNomComplet: (l) => `${l.moniteur?.prenom} ${l.moniteur?.nom}`,
 *   getVehiculeImmatriculation: (l) => l.vehicule?.immatriculation ?? '—',
 * });
 * ```
 */

import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Clock, Car, User, Eye, Pencil, XCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { DataTableRowActions } from '@/components/tables/data-table-row-actions';
import { createAvatarWithTextColumn } from '@/components/tables/factory';
import { cn } from '@/lib/utils';
import type { Lecon, LeconsEnrichments, LeconsColumnsOptions, LeconsTableActions } from '@/types/planning.types';
import type { TypeLecon, StatutLecon } from '@/types/enums';
import { TYPE_LECON_CONFIG, STATUT_LECON_CONFIG } from '@/types/enums';
import type { RowActionsConfig, CustomRowAction } from '@/components/tables/types';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formate la date et l’heure (ex: "15 mars 2025 à 10:00")
 * @internal
 */
function formatLeconDate(date: Date | string): string {
  const d = new Date(date);
  return format(d, "d MMM yyyy 'à' HH:mm", { locale: fr });
}

/**
 * Formate la durée (minutes → "1h30" ou "60 min")
 * @internal
 */
function formatDuree(minutes: number): string {
  if (minutes >= 60) {
    const heures = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins === 0 ? `${heures}h` : `${heures}h${mins}`;
  }
  return `${minutes} min`;
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNES FIXES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonne "Date" – formatée avec tooltip détaillé.
 * @internal
 */
function colDate(): ColumnDef<Lecon> {
  return {
    accessorKey: 'date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" icon={Calendar} />,
    cell: ({ row }) => {
      const raw = row.original.date;
      const date = new Date(raw);
      if (isNaN(date.getTime())) return <span className="text-xs text-muted-foreground">—</span>;
      const formattedShort = format(date, 'd MMM HH:mm', { locale: fr });
      const full = formatLeconDate(date);
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-xs cursor-default">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="capitalize">{formattedShort}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>{full}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    enableSorting: true,
    size: 120,
  };
}

/**
 * Colonne "Type" – badge depuis enums.ts
 * @internal
 */
function colType(): ColumnDef<Lecon> {
  return {
    accessorKey: 'type',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => {
      const type = row.original.type as TypeLecon;
      const cfg = TYPE_LECON_CONFIG[type];
      if (!cfg) return <span className="text-xs text-muted-foreground">—</span>;
      const Icon = cfg.icon;
      return (
        <Badge variant="outline" className={cn('gap-1.5 text-xs font-medium border-0', cfg.bgColor, cfg.textColor)}>
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
 * Colonne "Statut" – badge depuis enums.ts
 * @internal
 */
function colStatut(): ColumnDef<Lecon> {
  return {
    accessorKey: 'statut',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" />,
    cell: ({ row }) => {
      const statut = row.original.statut as StatutLecon;
      const cfg = STATUT_LECON_CONFIG[statut];
      if (!cfg) return <span className="text-xs text-muted-foreground">—</span>;
      const Icon = cfg.icon;
      return (
        <Badge variant="outline" className={cn('gap-1.5 text-xs font-medium border-0', cfg.bgColor, cfg.textColor)}>
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
 * Colonne "Durée" (admin seulement)
 * @internal
 */
function colDuree(): ColumnDef<Lecon> {
  return {
    accessorKey: 'duree',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Durée" icon={Clock} />,
    cell: ({ row }) => <span className="text-xs tabular-nums">{formatDuree(row.original.duree)}</span>,
    enableSorting: true,
    size: 80,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNE CANDIDAT (AVEC AVATAR ET COORDONNÉES)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonne "Candidat" enrichie (avatar + nom + email/téléphone) pour admin/secretaire.
 * @internal
 */
function colCandidat(enrichments: LeconsEnrichments, variant: 'admin' | 'secretaire' | 'moniteur'): ColumnDef<Lecon> {
  const { getCandidatNomComplet, getCandidatEmail, getCandidatTelephone, getCandidatAvatarUrl, getCandidatInitials } = enrichments;
  if (!getCandidatNomComplet) {
    return {
      id: 'candidat',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Candidat" icon={User} />,
      cell: () => <span className="text-xs text-muted-foreground">—</span>,
      enableSorting: false,
      size: 180,
    };
  }
  // Admin : avatar + coordonnées
  if (variant === 'admin' && getCandidatAvatarUrl && getCandidatInitials) {
    return createAvatarWithTextColumn<Lecon>({
      accessorKey: 'candidatId',
      title: 'Candidat',
      getAvatarUrl: (l) => getCandidatAvatarUrl!(l),
      getInitials: (l) => getCandidatInitials!(l),
      getPrimaryText: (l) => getCandidatNomComplet(l),
      getSecondaryText: (l) => {
        const email = getCandidatEmail?.(l);
        const phone = getCandidatTelephone?.(l);
        if (email && phone) return `${email} · ${phone}`;
        return email ?? phone ?? '';
      },
      avatarSize: 'md',
      enableSorting: false,
      size: 260,
    });
  }
  // Secrétaire ou moniteur : version texte simplifiée
  return {
    id: 'candidat',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Candidat" icon={User} />,
    cell: ({ row }) => <span className="text-xs">{getCandidatNomComplet(row.original) || '—'}</span>,
    enableSorting: false,
    size: 200,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNE MONITEUR (AVEC AVATAR)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonne "Moniteur" enrichie (avatar + nom) pour admin/secretaire.
 * @internal
 */
function colMoniteur(enrichments: LeconsEnrichments, variant: 'admin' | 'secretaire' | 'moniteur'): ColumnDef<Lecon> {
  const { getMoniteurNomComplet, getMoniteurAvatarUrl, getMoniteurInitials } = enrichments;
  if (!getMoniteurNomComplet) {
    return {
      id: 'moniteur',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Moniteur" icon={User} />,
      cell: () => <span className="text-xs text-muted-foreground">—</span>,
      enableSorting: false,
      size: 180,
    };
  }
  if (variant === 'admin' && getMoniteurAvatarUrl && getMoniteurInitials) {
    return createAvatarWithTextColumn<Lecon>({
      accessorKey: 'moniteurId',
      title: 'Moniteur',
      getAvatarUrl: (l) => getMoniteurAvatarUrl!(l),
      getInitials: (l) => getMoniteurInitials!(l),
      getPrimaryText: (l) => getMoniteurNomComplet(l),
      avatarSize: 'md',
      enableSorting: false,
      size: 220,
    });
  }
  return {
    id: 'moniteur',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Moniteur" icon={User} />,
    cell: ({ row }) => <span className="text-xs">{getMoniteurNomComplet(row.original) || '—'}</span>,
    enableSorting: false,
    size: 180,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNE VÉHICULE (AVEC ICÔNE)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonne "Véhicule" – icône + immatriculation (admin seulement)
 * @internal
 */
function colVehicule(enrichments: LeconsEnrichments): ColumnDef<Lecon> {
  const { getVehiculeImmatriculation, getVehiculeAvatarUrl, getVehiculeLibelle } = enrichments;
  if (!getVehiculeImmatriculation) {
    return {
      id: 'vehicule',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Véhicule" icon={Car} />,
      cell: () => <span className="text-xs text-muted-foreground">—</span>,
      enableSorting: false,
      size: 130,
    };
  }
  return {
    id: 'vehicule',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Véhicule" icon={Car} />,
    cell: ({ row }) => {
      const immat = getVehiculeImmatriculation(row.original);
      const libelle = getVehiculeLibelle?.(row.original);
      const avatarUrl = getVehiculeAvatarUrl?.(row.original);
      return (
        <div className="flex items-center gap-1.5">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-5 w-5 object-contain" />
          ) : (
            <Car className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs font-mono cursor-default">{immat}</span>
              </TooltipTrigger>
              {libelle && <TooltipContent>{libelle}</TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
    enableSorting: false,
    size: 130,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNE D’ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère la colonne d’actions selon la variante.
 * @internal
 */
function colActions(actions?: LeconsTableActions, variant: 'admin' | 'secretaire' | 'moniteur' = 'admin'): ColumnDef<Lecon> {
  return {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const lecon = row.original;
      const customActions: CustomRowAction<Lecon>[] = [];

      if (actions?.onView) {
        customActions.push({ label: 'Voir le détail', icon: <Eye className="mr-2 h-4 w-4" />, onClick: (l) => actions.onView!(l) });
      }
      if (actions?.onEdit && variant !== 'moniteur') {
        customActions.push({ label: 'Modifier', icon: <Pencil className="mr-2 h-4 w-4" />, onClick: (l) => actions.onEdit!(l) });
      }
      if (actions?.onCancel && lecon.statut === 'PLANIFIEE') {
        customActions.push({ label: 'Annuler', icon: <XCircle className="mr-2 h-4 w-4" />, onClick: (l) => actions.onCancel!(l) });
      }
      if (actions?.onMarkDone && (lecon.statut === 'PLANIFIEE' || lecon.statut === 'ANNULEE')) {
        customActions.push({ label: 'Marquer effectuée', icon: <CheckCircle className="mr-2 h-4 w-4" />, onClick: (l) => actions.onMarkDone!(l) });
      }
      if (actions?.onReportAbsence && lecon.statut === 'PLANIFIEE') {
        customActions.push({ label: 'Signaler absence', icon: <AlertCircle className="mr-2 h-4 w-4" />, onClick: (l) => actions.onReportAbsence!(l) });
      }

      const rowActionsConfig: RowActionsConfig<Lecon> = { customActions };
      return <DataTableRowActions row={lecon} actions={rowActionsConfig} />;
    },
    enableSorting: false,
    enableHiding: false,
    size: 50,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FONCTION PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────

export function getLeconsColumns({
  variant = 'admin',
  actions,
  enrichments = {},
  columnConfig = {},
}: LeconsColumnsOptions): ColumnDef<Lecon>[] {
  const {
    showDate = true,
    showCandidat = true,
    showMoniteur = true,
    showType = true,
    showStatut = true,
    showVehicule = false,
    showDuree = false,
    showActions = true,
  } = columnConfig;

  const cols: ColumnDef<Lecon>[] = [];

  if (showDate) cols.push(colDate());
  if (showCandidat) cols.push(colCandidat(enrichments, variant));
  if (showMoniteur && variant !== 'moniteur') cols.push(colMoniteur(enrichments, variant));
  if (showType) cols.push(colType());
  if (showStatut) cols.push(colStatut());
  if (showVehicule) cols.push(colVehicule(enrichments));
  if (showDuree) cols.push(colDuree());
  if (showActions && actions && Object.keys(actions).length > 0) cols.push(colActions(actions, variant));

  return cols;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRÉ‑SETS PAR RÔLE
// ─────────────────────────────────────────────────────────────────────────────

export function getAdminLeconsColumns(
  actions?: LeconsTableActions,
  enrichments?: LeconsEnrichments,
  columnConfig = {}
): ColumnDef<Lecon>[] {
  return getLeconsColumns({
    variant: 'admin',
    actions,
    enrichments,
    columnConfig: {
      showDate: true,
      showCandidat: true,
      showMoniteur: true,
      showType: true,
      showStatut: true,
      showVehicule: true,
      showDuree: true,
      showActions: true,
      ...columnConfig,
    },
  });
}

export function getSecretaireLeconsColumns(
  actions?: LeconsTableActions,
  enrichments?: LeconsEnrichments,
  columnConfig = {}
): ColumnDef<Lecon>[] {
  return getLeconsColumns({
    variant: 'secretaire',
    actions,
    enrichments,
    columnConfig: {
      showDate: true,
      showCandidat: true,
      showMoniteur: true,
      showType: true,
      showStatut: true,
      showVehicule: false,
      showDuree: false,
      showActions: true,
      ...columnConfig,
    },
  });
}

export function getMoniteurLeconsColumns(
  actions?: LeconsTableActions,
  enrichments?: LeconsEnrichments,
  columnConfig = {}
): ColumnDef<Lecon>[] {
  return getLeconsColumns({
    variant: 'moniteur',
    actions,
    enrichments,
    columnConfig: {
      showDate: true,
      showCandidat: true,
      showMoniteur: false,
      showType: true,
      showStatut: true,
      showVehicule: false,
      showDuree: true,
      showActions: true,
      ...columnConfig,
    },
  });
}