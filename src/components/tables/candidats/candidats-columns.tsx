// src/components/tables/candidats/candidats-columns.tsx

/**
 * @module tables/candidats/candidats-columns
 * @description
 * Colonnes pour le tableau des candidats (élèves) de l’auto‑école COS.
 * Trois variantes disponibles :
 *
 * - `admin`      : affichage complet (avatar + nom + email, téléphone, catégorie, statut,
 *                  date d’inscription, solde dû, leçons, examens, actions)
 * - `secretaire` : colonnes adaptées à la gestion quotidienne (identité, catégorie, statut,
 *                  date d’inscription, solde, actions)
 * - `moniteur`   : colonnes réduites (identité, catégorie, statut, leçons, actions)
 *
 * ## Architecture
 *
 * Ce module suit exactement le même pattern que `users-columns.tsx`.
 *
 * ## Colonnes disponibles
 *
 * | Colonne            | Variante        | Description                                      |
 * |--------------------|-----------------|--------------------------------------------------|
 * | `avatar`           | toutes          | Avatar + Nom complet + Email (colonne principale)|
 * | `phone`            | admin/secrétaire| Numéro de téléphone                              |
 * | `categorie`        | toutes          | Catégorie de permis (badge coloré)               |
 * | `statut`           | toutes          | Statut du candidat (badge coloré)                |
 * | `dateInscription`  | toutes          | Date d’inscription (format lisible)              |
 * | `solde`            | admin/secrétaire| Montant restant dû (enrichissement)              |
 * | `leconsCount`      | admin/moniteu   | Nombre de leçons effectuées (enrichissement)     |
 * | `examensCount`     | admin           | Nombre d’examens passés (enrichissement)         |
 * | `actions`          | toutes          | Menu d’actions contextuelles                     |
 *
 * @see {@link CandidatsColumnsOptions} Options de configuration
 * @see {@link CandidatsTableActions} Callbacks d’actions
 * @see {@link CandidatsEnrichments} Enrichissements optionnels
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * // Variante admin
 * const columns = getCandidatsColumns({
 *   variant: 'admin',
 *   actions: { onView: (c) => navigate(`/candidats/${c.id}`) },
 *   enrichments: { getSolde: (c) => c.solde, getLeconsCount: (c) => c.lecons?.length },
 * });
 *
 * // Variante secretaire
 * const columns = getCandidatsColumns({
 *   variant: 'secretaire',
 *   actions: { onAddPayment: (c) => navigate(`/paiements/create?candidatId=${c.id}`) },
 *   enrichments: { getSolde: (c) => c.solde },
 * });
 * ```
 */

import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Phone,
  Calendar,
  CreditCard,
  BookOpen,
  ClipboardList,
  Eye,
  Pencil,
  PlusCircle,
  FileText,
  Car,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { DataTableRowActions } from '@/components/tables/data-table-row-actions';
import { createAvatarWithTextColumn } from '@/components/tables/factory';
import { cn, getAvatarUrl } from '@/lib/utils';
import type { CategoriePermis, StatutCandidat } from '@/types/enums';
import { CATEGORIE_PERMIS_CONFIG, STATUT_CANDIDAT_CONFIG } from '@/types/enums';
import type { Candidat, CandidatsEnrichments } from '@/types/candidats.types';
import type { RowActionsConfig, CustomRowAction } from '@/components/tables/types';
import type { CandidatsColumnsOptions, CandidatsTableActions } from '@/types/candidats.types';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retourne les initiales à partir du nom et prénom.
 * @internal
 */
function getInitials(candidat: Candidat): string {
  return `${(candidat.prenom ?? '')[0] ?? ''}${(candidat.nom ?? '')[0] ?? ''}`.toUpperCase();
}

/**
 * Formatte un nombre en notation compacte (k, M) ou en devise FCFA.
 * @internal
 */
function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M FCFA`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k FCFA`;
  return `${value} FCFA`;
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNES COMMUNES (toutes variantes)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonne "Téléphone" – lien tel:.
 * @internal
 */
function colPhone(): ColumnDef<Candidat> {
  return {
    accessorKey: 'telephone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Téléphone" icon={Phone} />
    ),
    cell: ({ row }) => {
      const phone = row.original.telephone;
      if (!phone) return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <div className="flex items-center gap-1.5">
          <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
          <a href={`tel:${phone}`} className="text-xs hover:text-primary transition-colors">
            {phone}
          </a>
        </div>
      );
    },
    enableSorting: false,
    size: 130,
  };
}

/**
 * Colonne "Catégorie de permis" – badge coloré.
 * @internal
 */
function colCategorie(): ColumnDef<Candidat> {
  return {
    accessorKey: 'categorie',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Permis" icon={Car} />,
    cell: ({ row }) => {
      const categorie = row.original.categorie as CategoriePermis;
      const cfg = CATEGORIE_PERMIS_CONFIG[categorie];
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
    size: 100,
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  };
}

/**
 * Colonne "Statut" – badge coloré.
 * @internal
 */
function colStatut(): ColumnDef<Candidat> {
  return {
    accessorKey: 'statut',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" />,
    cell: ({ row }) => {
      const statut = row.original.statut as StatutCandidat;
      const cfg = STATUT_CANDIDAT_CONFIG[statut];
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
 * Colonne "Date d’inscription" – formatée avec tooltip.
 * @internal
 */
function colDateInscription(): ColumnDef<Candidat> {
  return {
    accessorKey: 'dateInscription',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Inscrit le" icon={Calendar} />
    ),
    cell: ({ row }) => {
      const raw = row.original.dateInscription;
      if (!raw) return <span className="text-xs text-muted-foreground">—</span>;
      const date = new Date(raw);
      if (isNaN(date.getTime())) return <span className="text-xs text-muted-foreground">—</span>;
      const formatted = format(date, 'd MMM yyyy', { locale: fr });
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-xs cursor-default">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="capitalize">{formatted}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              {format(date, "d MMMM yyyy 'à' HH:mm", { locale: fr })}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    enableSorting: true,
    size: 110,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNES AVEC ENRICHISSEMENTS (optionnelles)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonne "Solde restant dû" – via enrichissement.
 * @param getSolde - Fonction retournant le montant dû
 * @internal
 */
function colSolde(getSolde: (c: Candidat) => number): ColumnDef<Candidat> {
  return {
    id: 'solde',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Solde dû" icon={CreditCard} />
    ),
    cell: ({ row }) => {
      const solde = getSolde(row.original);
      if (solde <= 0) return <span className="text-xs text-emerald-600">Soldé</span>;
      return <span className="text-xs font-medium text-amber-600">{formatCurrency(solde)}</span>;
    },
    enableSorting: true,
    sortingFn: (a, b) => getSolde(a.original) - getSolde(b.original),
    size: 110,
  };
}

/**
 * Colonne "Leçons effectuées" – via enrichissement.
 * @param getLeconsCount - Fonction retournant le nombre de leçons
 * @internal
 */
function colLeconsCount(getLeconsCount: (c: Candidat) => number): ColumnDef<Candidat> {
  return {
    id: 'leconsCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Leçons" icon={BookOpen} />
    ),
    cell: ({ row }) => {
      const count = getLeconsCount(row.original);
      return (<span className="text-xs tabular-nums">{count}</span>);


    },
    enableSorting: true,
    sortingFn: (a, b) => getLeconsCount(a.original) - getLeconsCount(b.original),
    size: 80,
  };
}

/**
 * Colonne "Examens passés" – via enrichissement.
 * @param getExamensCount - Fonction retournant le nombre d’examens
 * @internal
 */
function colExamensCount(getExamensCount: (c: Candidat) => number): ColumnDef<Candidat> {
  return {
    id: 'examensCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Examens" icon={ClipboardList} />
    ),
    cell: ({ row }) => {
      const count = getExamensCount(row.original);
      return <span className="text-xs tabular-nums">{count}</span>;
    },
    enableSorting: true,
    sortingFn: (a, b) => getExamensCount(a.original) - getExamensCount(b.original),
    size: 90,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNE PRINCIPALE (avatar + nom complet + email)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonne principale : Avatar + Nom complet + Email.
 * Affiche l’avatar (via DiceBear) et les informations d’identité.
 * @param showEmail - Inclure l’email dans la colonne (admin/secrétaire seulement)
 * @internal
 */
function colPrincipal(showEmail: boolean = true): ColumnDef<Candidat> {
  return createAvatarWithTextColumn<Candidat>({
    accessorKey: 'nom',
    title: 'Candidat',
    getAvatarUrl: (c) => getAvatarUrl(`${c.prenom} ${c.nom}`),
    getInitials: (c) => getInitials(c),
    getPrimaryText: (c) => `${c.prenom} ${c.nom}`,
    getSecondaryText: (c) => (showEmail ? (c.email ?? '—') : undefined),
    avatarSize: 'md',
    enableSorting: true,
    size: 240,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNE D’ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère la colonne d’actions.
 * @param actions - Callbacks d’actions
 * @internal
 */
function colActions(actions?: CandidatsTableActions): ColumnDef<Candidat> {
  return {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const candidat = row.original;
      const customActions: CustomRowAction<Candidat>[] = [];

      if (actions?.onView) {
        customActions.push({
          label: 'Voir le détail',
          icon: <Eye className="mr-2 h-4 w-4" />,
          onClick: (c) => actions.onView!(c),
        });
      }
      if (actions?.onEdit) {
        customActions.push({
          label: 'Modifier',
          icon: <Pencil className="mr-2 h-4 w-4" />,
          onClick: (c) => actions.onEdit!(c),
        });
      }
      if (actions?.onAddPayment) {
        customActions.push({
          label: 'Ajouter un paiement',
          icon: <PlusCircle className="mr-2 h-4 w-4" />,
          onClick: (c) => actions.onAddPayment!(c),
        });
      }
      if (actions?.onAddLesson) {
        customActions.push({
          label: 'Ajouter une leçon',
          icon: <BookOpen className="mr-2 h-4 w-4" />,
          onClick: (c) => actions.onAddLesson!(c),
        });
      }
      if (actions?.onRegisterExam) {
        customActions.push({
          label: 'Inscrire à un examen',
          icon: <ClipboardList className="mr-2 h-4 w-4" />,
          onClick: (c) => actions.onRegisterExam!(c),
        });
      }
      if (actions?.onViewDocuments) {
        customActions.push({
          label: 'Voir les documents',
          icon: <FileText className="mr-2 h-4 w-4" />,
          onClick: (c) => actions.onViewDocuments!(c),
        });
      }

      const rowActionsConfig: RowActionsConfig<Candidat> = {
        customActions,
        onDelete: actions?.onDelete,
      };
      return <DataTableRowActions row={candidat} actions={rowActionsConfig} />;
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
 * Génère le tableau de colonnes pour le tableau des candidats COS.
 *
 * Les colonnes retournées dépendent de la variante (`variant`) et des `columnConfig`
 * et `enrichments` fournis.
 *
 * ## Ordre des colonnes par variante
 * - **admin**     : identité (nom + email), téléphone, catégorie, statut, date, solde, leçons, examens, actions
 * - **secretaire** : identité (nom + email), téléphone, catégorie, statut, date, solde, actions
 * - **moniteur**  : identité (nom uniquement), catégorie, statut, date, leçons, actions
 *
 * @param options - Options de configuration (variant, actions, enrichments, columnConfig)
 * @returns Tableau de `ColumnDef<Candidat>` pour TanStack Table
 *
 * @example
 * ```tsx
 * const columns = getCandidatsColumns({
 *   variant: 'admin',
 *   actions: { onView: (c) => console.log(c) },
 *   enrichments: { getSolde: (c) => 50000 },
 * });
 * ```
 */
export function getCandidatsColumns({
  variant = 'admin',
  actions,
  enrichments = {},
  columnConfig = {},
}: CandidatsColumnsOptions): ColumnDef<Candidat>[] {
  const { getSolde, getLeconsCount, getExamensCount } = enrichments;

  const {
    showFullName = true,
    showEmail = true,
    showPhone = true,
    showDateInscription = true,
    showCategorie = true,
    showStatut = true,
    showSolde = true,
    showLeconsCount = true,
    showExamensCount = true,
    showActions = true,
  } = columnConfig;

  const cols: ColumnDef<Candidat>[] = [];

  // Colonne identité (avatar + nom + éventuellement email)
  if (showFullName) {
    cols.push(colPrincipal(showEmail && variant !== 'moniteur'));
  }

  if (showPhone && variant !== 'moniteur') cols.push(colPhone());
  if (showCategorie) cols.push(colCategorie());
  if (showStatut) cols.push(colStatut());
  if (showDateInscription) cols.push(colDateInscription());

  // Colonnes avec enrichissements
  if (showSolde && getSolde && variant !== 'moniteur') cols.push(colSolde(getSolde));
  if (showLeconsCount && getLeconsCount && (variant === 'admin' || variant === 'moniteur'))
    cols.push(colLeconsCount(getLeconsCount));
  if (showExamensCount && getExamensCount && variant === 'admin')
    cols.push(colExamensCount(getExamensCount));

  if (showActions && actions && Object.keys(actions).length > 0) cols.push(colActions(actions));

  return cols;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRÉ-SETS PAR RÔLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonnes pour le tableau des candidats – vue administrateur.
 *
 * Inclut : identité (avatar + nom + email), téléphone, catégorie, statut,
 * date d’inscription, solde, leçons, examens et actions.
 *
 * @param actions - Callbacks d’actions (admin)
 * @param enrichments - Enrichissements (solde, leçons, examens)
 * @returns Colonnes complètes pour vue admin
 */
export function getAdminCandidatsColumns(
  actions?: CandidatsTableActions,
  enrichments?: CandidatsEnrichments,
  columnConfig = {}
): ColumnDef<Candidat>[] {
  return getCandidatsColumns({
    variant: 'admin',
    actions,
    enrichments,
    columnConfig: {
      showFullName: true,
      showEmail: true,
      showPhone: true,
      showCategorie: true,
      showStatut: true,
      showDateInscription: true,
      showSolde: true,
      showLeconsCount: true,
      showExamensCount: true,
      showActions: true,
      ...columnConfig,
    },
  });
}

/**
 * Colonnes pour le tableau des candidats – vue secrétaire.
 *
 * Inclut : identité (avatar + nom + email), téléphone, catégorie, statut,
 * date d’inscription, solde (si disponible) et actions.
 *
 * @param actions - Callbacks d’actions (secrétaire)
 * @param enrichments - Enrichissements (solde)
 * @returns Colonnes adaptées au secrétaire
 */
export function getSecretaireCandidatsColumns(
  actions?: CandidatsTableActions,
  enrichments?: CandidatsEnrichments,
  columnConfig = {}
): ColumnDef<Candidat>[] {
  return getCandidatsColumns({
    variant: 'secretaire',
    actions,
    enrichments,
    columnConfig: {
      showFullName: true,
      showEmail: true,
      showPhone: true,
      showCategorie: true,
      showStatut: true,
      showDateInscription: true,
      showSolde: !!enrichments?.getSolde,
      showLeconsCount: false,
      showExamensCount: false,
      showActions: true,
      ...columnConfig,
    },
  });
}

/**
 * Colonnes pour le tableau des candidats – vue moniteur.
 *
 * Inclut : identité (avatar + nom, sans email), catégorie, statut,
 * date d’inscription, leçons (si disponible) et actions réduites.
 *
 * @param actions - Callbacks d’actions (moniteur : voir, ajouter leçon)
 * @param enrichments - Enrichissements (leçons)
 * @returns Colonnes réduites pour le moniteur
 */
export function getMoniteurCandidatsColumns(
  actions?: CandidatsTableActions,
  enrichments?: CandidatsEnrichments,
  columnConfig = {}
): ColumnDef<Candidat>[] {
  return getCandidatsColumns({
    variant: 'moniteur',
    actions,
    enrichments,
    columnConfig: {
      showFullName: true,
      showEmail: false,
      showPhone: false,
      showCategorie: true,
      showStatut: true,
      showDateInscription: true,
      showSolde: false,
      showLeconsCount: !!enrichments?.getLeconsCount,
      showExamensCount: false,
      showActions: true,
      ...columnConfig,
    },
  });
}
