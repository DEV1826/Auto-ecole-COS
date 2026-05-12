// src/components/tables/users/users-columns.tsx

/**
 * @module tables/users/users-columns
 * @description
 * Colonnes pour le tableau des utilisateurs de l’auto‑école COS.
 * Basé sur les types `Utilisateur` et `UtilisateurDetail` de `auth.types.ts`.
 *
 * Deux variantes disponibles :
 *
 * - `admin`      : affichage complet (avatar + nom + email, rôle, niveau, statut actif,
 *                  date de création, sessions actives, permissions, actions)
 * - `secretaire` : colonnes essentielles (avatar + nom, email, rôle, statut, actions)
 *
 * ## Architecture
 *
 * La colonne principale utilise `createAvatarWithTextColumn` pour afficher
 * l’avatar (via enrichissement), le nom complet et l’email de l’utilisateur.
 * Les badges pour le rôle et le niveau d’accès sont définis dans `enums.ts`.
 * Le statut actif/inactif est affiché avec des icônes colorées.
 *
 * ## Colonnes disponibles
 *
 * | Colonne            | Variante        | Description                                      |
 * |--------------------|-----------------|--------------------------------------------------|
 * | `userInfo`         | toutes          | Avatar + nom complet + email                     |
 * | `email`            | toutes          | Adresse email (si colonne principale masquée)    |
 * | `role`             | toutes          | Badge couleur (ADMIN, SECRETAIRE, MONITEUR)      |
 * | `niveau`           | admin           | Badge de niveau (SUPER_ADMIN, ADMIN, etc.)       |
 * | `actif`            | toutes          | Statut actif (icône + texte)                     |
 * | `createdAt`        | admin           | Date de création (formatée)                      |
 * | `sessionsActives`  | admin           | Nombre de sessions actives (via enrichissement)  |
 * | `permissions`      | admin           | Nombre de permissions (via enrichissement)       |
 * | `actions`          | admin/secretaire| Menu (voir, modifier, désactiver, permissions)   |
 *
 * @see {@link Utilisateur} – Modèle utilisateur
 * @see {@link UtilisateurDetail} – Détails avec permissions et sessions
 * @see {@link Role} – Énumération des rôles
 * @see {@link NiveauAcces} – Niveaux hiérarchiques
 *
 * @author Stive Junior
 * @version 3.0.0
 *
 * @example
 * ```tsx
 * const columns = getAdminUsersColumns(actions, {
 *   getAvatarUrl: (u) => `/api/avatar/${u.id}`,
 *   getInitials: (u) => `${u.prenom[0]}${u.nom[0]}`,
 *   getSessionsCount: (u) => u.sessionsActives ?? 0,
 *   getPermissionsCount: (u) => u.permissions?.length ?? 0,
 * });
 * ```
 */

import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar,
  Shield,
  Layers,
  UserCheck,
  UserX,
  Eye,
  Pencil,
  KeyRound,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { DataTableRowActions } from '@/components/tables/data-table-row-actions';
import { createAvatarWithTextColumn } from '@/components/tables/factory';
import { cn } from '@/lib/utils';
import type {
  Utilisateur,
  UtilisateursTableActions,
  UtilisateursColumnsOptions,
  UtilisateursColumnConfig,
  UsersEnrichments,
} from '@/types/auth.types';
import type { Role, NiveauAcces } from '@/types/enums';
import { ROLE_CONFIG, NIVEAU_ACCES_CONFIG } from '@/types/enums';
import type { RowActionsConfig, CustomRowAction } from '@/components/tables/types';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retourne le nom complet formaté.
 * @internal
 */
function getFullName(user: Utilisateur): string {
  return `${user.prenom} ${user.nom}`.trim();
}

/**
 * Retourne les initiales par défaut (première lettre du prénom et première du nom).
 * @internal
 */
function getDefaultInitials(user: Utilisateur): string {
  return `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase();
}

/**
 * Formate une date en `d MMM yyyy`.
 * @internal
 */
function formatDate(date: Date | string | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return format(d, 'd MMM yyyy', { locale: fr });
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNES COMMUNES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonne principale : avatar + nom complet + email.
 * Utilise `createAvatarWithTextColumn` et les enrichissements.
 * @internal
 */
function colUserInfo(enrichments: UsersEnrichments = {}): ColumnDef<Utilisateur> {
  const { getAvatarUrl, getInitials, getDisplayName } = enrichments;
  const avatarUrl = getAvatarUrl ?? (() => undefined);
  const initials = getInitials ?? getDefaultInitials;
  const displayName = getDisplayName ?? getFullName;
  const getEmail = (u: Utilisateur) => u.email;

  return createAvatarWithTextColumn<Utilisateur>({
    accessorKey: 'email',
    title: 'Utilisateur',
    icon: Shield,
    getAvatarUrl: avatarUrl,
    getInitials: initials,
    getPrimaryText: (u) => displayName(u),
    getSecondaryText: getEmail,
    avatarSize: 'md',
    enableSorting: true,
    size: 280,
    cellClassName: 'min-w-0',
  });
}

/**
 * Colonne "Rôle" – badge coloré depuis ROLE_CONFIG.
 * @internal
 */
function colRole(): ColumnDef<Utilisateur> {
  return {
    accessorKey: 'role',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rôle" icon={Shield} />,
    cell: ({ row }) => {
      const role = row.original.role as Role;
      const cfg = ROLE_CONFIG[role];
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
 * Colonne "Niveau d’accès" – badge depuis NIVEAU_ACCES_CONFIG.
 * @internal
 */
function colNiveau(): ColumnDef<Utilisateur> {
  return {
    accessorKey: 'niveau',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Niveau" icon={Layers} />,
    cell: ({ row }) => {
      const niveau = row.original.niveau as NiveauAcces;
      const cfg = NIVEAU_ACCES_CONFIG[niveau];
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
 * Colonne "Actif" – icône + texte.
 * @internal
 */
function colActif(): ColumnDef<Utilisateur> {
  return {
    accessorKey: 'actif',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" />,
    cell: ({ row }) => {
      const actif = row.original.actif;
      return (
        <div className="flex items-center gap-1.5">
          {actif ? (
            <UserCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          ) : (
            <UserX className="h-3.5 w-3.5 text-red-500 shrink-0" />
          )}
          <span
            className={cn(
              'text-xs font-medium',
              actif ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            )}
          >
            {actif ? 'Actif' : 'Inactif'}
          </span>
        </div>
      );
    },
    enableSorting: true,
    size: 100,
    filterFn: (row, id, value: string[]) => value.includes(String(row.getValue(id))),
  };
}

/**
 * Colonne "Date de création" – formatée avec tooltip.
 * @internal
 */
function colCreatedAt(): ColumnDef<Utilisateur> {
  return {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Créé le" icon={Calendar} />
    ),
    cell: ({ row }) => {
      const raw = row.original.createdAt;
      if (!raw) return <span className="text-xs text-muted-foreground">—</span>;
      const date = new Date(raw);
      if (isNaN(date.getTime())) return <span className="text-xs text-muted-foreground">—</span>;
      const formatted = formatDate(raw);
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
    size: 120,
  };
}

/**
 * Colonne "Sessions actives" – nombre avec badge (via enrichissement).
 * @param getSessionsCount - Fonction retournant le nombre de sessions actives
 * @internal
 */
function colSessionsActives(getSessionsCount: (u: Utilisateur) => number): ColumnDef<Utilisateur> {
  return {
    id: 'sessionsActives',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sessions" icon={Lock} />,
    cell: ({ row }) => {
      const count = getSessionsCount(row.original);
      if (!count) return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 text-xs border-0"
        >
          {count} active{count > 1 ? 's' : ''}
        </Badge>
      );
    },
    enableSorting: true,
    sortingFn: (a, b) => getSessionsCount(a.original) - getSessionsCount(b.original),
    size: 110,
  };
}

/**
 * Colonne "Permissions" – nombre (via enrichissement).
 * @param getPermissionsCount - Fonction retournant le nombre de permissions
 * @internal
 */
function colPermissions(getPermissionsCount: (u: Utilisateur) => number): ColumnDef<Utilisateur> {
  return {
    id: 'permissions',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Permissions" icon={KeyRound} />
    ),
    cell: ({ row }) => {
      const count = getPermissionsCount(row.original);
      if (!count) return <span className="text-xs text-muted-foreground">—</span>;
      return <span className="text-xs font-mono">{count}</span>;
    },
    enableSorting: true,
    sortingFn: (a, b) => getPermissionsCount(a.original) - getPermissionsCount(b.original),
    size: 100,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNE D’ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère la colonne d’actions selon la variante.
 * @param actions - Callbacks d’actions
 * @param variant - Rôle (admin ou secretaire)
 * @internal
 */
function colActions(
  actions?: UtilisateursTableActions,
  variant: 'admin' | 'secretaire' = 'admin'
): ColumnDef<Utilisateur> {
  return {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const user = row.original;
      const customActions: CustomRowAction<Utilisateur>[] = [];

      if (actions?.onView) {
        customActions.push({
          label: 'Voir le détail',
          icon: <Eye className="mr-2 h-4 w-4" />,
          onClick: (u) => actions.onView!(u),
        });
      }
      if (actions?.onEdit && variant === 'admin') {
        customActions.push({
          label: 'Modifier',
          icon: <Pencil className="mr-2 h-4 w-4" />,
          onClick: (u) => actions.onEdit!(u),
        });
      }
      if (actions?.onResetPassword && variant === 'admin') {
        customActions.push({
          label: 'Réinitialiser le mot de passe',
          icon: <KeyRound className="mr-2 h-4 w-4" />,
          onClick: (u) => actions.onResetPassword!(u),
        });
      }
      if (actions?.onViewPermissions && variant === 'admin') {
        customActions.push({
          label: 'Gérer les permissions',
          icon: <Shield className="mr-2 h-4 w-4" />,
          onClick: (u) => actions.onViewPermissions!(u),
        });
      }

      const rowActionsConfig: RowActionsConfig<Utilisateur> = {
        customActions,
        onDelete: variant === 'admin' ? actions?.onDelete : undefined,
      };
      return <DataTableRowActions row={user} actions={rowActionsConfig} />;
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
 * Génère le tableau de colonnes pour le tableau des utilisateurs.
 *
 * @param options - Options de configuration (variant, actions, enrichments, columnConfig)
 * @returns Tableau de `ColumnDef<Utilisateur>` pour TanStack Table
 *
 * @example
 * ```tsx
 * const columns = getUsersColumns({
 *   variant: 'admin',
 *   actions: { onView: (u) => navigate(`/admin/users/${u.id}`) },
 *   enrichments: { getSessionsCount: (u) => u.sessionsActives },
 * });
 * ```
 */
export function getUsersColumns({
  variant = 'admin',
  actions,
  enrichments = {},
  columnConfig = {},
}: UtilisateursColumnsOptions): ColumnDef<Utilisateur>[] {
  const {
    showFullName = true,
    showEmail = true,
    showRole = true,
    showNiveau = true,
    showActif = true,
    showCreatedAt = true,
    showActions = true,
    showSessionsActives = false, // par défaut masquée
    showPermissions = false,
  } = columnConfig;

  const { getSessionsCount, getPermissionsCount } = enrichments;

  const cols: ColumnDef<Utilisateur>[] = [];

  // Colonne principale (avatar + nom + email)
  if (showFullName) cols.push(colUserInfo(enrichments));
  // Colonne email séparée (si on veut la cacher de la principale)
  if (showEmail && !showFullName) {
    cols.push({
      accessorKey: 'email',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      cell: ({ row }) => <span className="text-sm">{row.original.email}</span>,
      enableSorting: true,
      size: 200,
    });
  }

  if (showRole) cols.push(colRole());
  if (showNiveau && variant === 'admin') cols.push(colNiveau());
  if (showActif) cols.push(colActif());
  if (showCreatedAt && variant === 'admin') cols.push(colCreatedAt());
  if (showSessionsActives && getSessionsCount && variant === 'admin')
    cols.push(colSessionsActives(getSessionsCount));
  if (showPermissions && getPermissionsCount && variant === 'admin')
    cols.push(colPermissions(getPermissionsCount));
  if (showActions && actions && Object.keys(actions).length > 0)
    cols.push(colActions(actions, variant));

  return cols;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRÉ-SETS PAR RÔLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonnes pour la vue administrateur (toutes colonnes + enrichissements complets)
 */
export function getAdminUsersColumns(
  actions?: UtilisateursTableActions,
  enrichments?: UsersEnrichments,
  columnConfig?: UtilisateursColumnConfig
): ColumnDef<Utilisateur>[] {
  return getUsersColumns({
    variant: 'admin',
    actions,
    enrichments,
    columnConfig: {
      showFullName: true,
      showEmail: true,
      showRole: true,
      showNiveau: true,
      showActif: true,
      showCreatedAt: true,
      showSessionsActives: !!enrichments?.getSessionsCount,
      showPermissions: !!enrichments?.getPermissionsCount,
      showActions: true,
      ...columnConfig,
    },
  });
}

/**
 * Colonnes pour la vue secrétaire (essentielles)
 */
export function getSecretaireUsersColumns(
  actions?: UtilisateursTableActions,
  enrichments?: UsersEnrichments,
  columnConfig?: UtilisateursColumnConfig
): ColumnDef<Utilisateur>[] {
  return getUsersColumns({
    variant: 'secretaire',
    actions,
    enrichments,
    columnConfig: {
      showFullName: true,
      showEmail: true,
      showRole: true,
      showNiveau: false,
      showActif: true,
      showCreatedAt: false,
      showSessionsActives: false,
      showPermissions: false,
      showActions: true,
      ...columnConfig,
    },
  });
}
