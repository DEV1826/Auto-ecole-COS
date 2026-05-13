// src/components/tables/documents/documents-columns.tsx
'use client';

/**
 * @module tables/documents/documents-columns
 * @description
 * Colonnes pour le tableau des documents de l’auto‑école COS.
 * Trois variantes disponibles :
 *
 * - `admin`      : affichage complet (nom fichier, type, taille, date,
 *                  colonne candidat enrichie (avatar + nom + email), actions)
 * - `secretaire` : colonnes essentielles (nom fichier, type, candidat simplifié, actions)
 * - `candidat`   : vue restreinte (nom fichier, date, téléchargement)
 *
 * ## Architecture
 *
 * La colonne principale utilise `createAvatarWithTextColumn` pour afficher
 * une icône SVG selon le type de document (permis, carte d’identité, facture, reçu)
 * et ses informations de base (nom du fichier, taille).
 *
 * La colonne candidat (admin/secrétaire) affiche l’avatar et les coordonnées
 * via les enrichissements fournis.
 *
 * ## Colonnes disponibles
 *
 * | Colonne       | Variante        | Description                                      |
 * |---------------|-----------------|--------------------------------------------------|
 * | `documentInfo`| toutes          | Icône type + nom fichier + taille                |
 * | `type`        | admin/secrétariat| Badge du type de document                        |
 * | `taille`      | admin           | Taille formatée (Ko/Mo)                          |
 * | `uploadedAt`  | admin/candidat  | Date de téléversement                            |
 * | `candidat`    | admin/secrétaire| Avatar + nom + email/téléphone (via enrichissements)|
 * | `actions`     | admin/secrétaire| Menu d’actions (télécharger, supprimer, aperçu)  |
 *
 * @see {@link DocumentsColumnsOptions} Options de configuration
 * @see {@link DocumentsTableActions} Callbacks d’actions
 * @see {@link DocumentsEnrichments} Enrichissements optionnels (candidat)
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * // Variante admin avec enrichissements complets
 * const columns = getAdminDocumentsColumns(
 *   actions,
 *   {
 *     getCandidatNomComplet: (doc) => `${doc.candidat?.prenom} ${doc.candidat?.nom}`,
 *     getCandidatEmail: (doc) => doc.candidat?.email,
 *     getCandidatAvatarUrl: (doc) => doc.candidat?.avatarUrl,
 *     getCandidatInitials: (doc) => `${doc.candidat?.prenom?.[0]}${doc.candidat?.nom?.[0]}`,
 *   }
 * );
 * ```
 */

import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, FileText, Download, Eye, Printer, HardDrive, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { DataTableRowActions } from '@/components/tables/data-table-row-actions';
import { createAvatarWithTextColumn } from '@/components/tables/factory';
import { cn } from '@/lib/utils';
import type { Document, DocumentsEnrichments } from '@/types/documents.types';
import type { DocumentsTableActions, DocumentsColumnsOptions } from '@/types/documents.types';
import type { RowActionsConfig, CustomRowAction } from '@/components/tables/types';
import { useTheme } from 'next-themes';



// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION DES TYPES DE DOCUMENTS (pour les icônes SVG)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mappe un type de document vers le chemin de l’icône SVG (clair/sombre).
 * @internal
 */
function getDocumentIconPath(type: string): { light: string; dark: string } {
  switch (type) {
    case 'permis':
      return { light: '/images/icons/file-image.svg', dark: '/images/icons/file-image-dark.svg' };
    case 'carte_identite':
      return { light: '/images/icons/file-image.svg', dark: '/images/icons/file-image-dark.svg' };
    case 'facture':
      return { light: '/images/icons/pdf.svg', dark: '/images/icons/pdf.svg' };
    case 'recu':
      return { light: '/images/icons/file-image.svg', dark: '/images/icons/file-image-dark.svg' };
    default:
      return { light: '/images/icons/file-image.svg', dark: '/images/icons/file-image-dark.svg' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formate la taille en octets en Ko ou Mo.
 * @internal
 */
function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return '—';
  if (bytes >= 1_000_000) return (bytes / 1_000_000).toFixed(1) + ' Mo';
  if (bytes >= 1_000) return (bytes / 1_000).toFixed(1) + ' Ko';
  return bytes + ' o';
}

/**
 * Retourne la configuration d’affichage d’un type de document.
 * @internal
 */
function getDocumentTypeConfig(type: string) {
  const configs: Record<string, { label: string; bgColor: string; textColor: string }> = {
    permis: {
      label: 'Permis',
      bgColor: 'bg-blue-100 dark:bg-blue-500/20',
      textColor: 'text-blue-700 dark:text-blue-400',
    },
    carte_identite: {
      label: 'Carte d’identité',
      bgColor: 'bg-indigo-100 dark:bg-indigo-500/20',
      textColor: 'text-indigo-700 dark:text-indigo-400',
    },
    facture: {
      label: 'Facture',
      bgColor: 'bg-amber-100 dark:bg-amber-500/20',
      textColor: 'text-amber-700 dark:text-amber-400',
    },
    recu: {
      label: 'Reçu',
      bgColor: 'bg-emerald-100 dark:bg-emerald-500/20',
      textColor: 'text-emerald-700 dark:text-emerald-400',
    },
  };
  return (
    configs[type] ?? {
      label: type,
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      textColor: 'text-gray-700 dark:text-gray-400',
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNES COMMUNES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonne principale : icône SVG + nom du fichier + taille.
 * Utilise `createAvatarWithTextColumn` avec une icône custom (SVG).
 * @internal
 */
function colDocumentInfo(): ColumnDef<Document> {


  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { resolvedTheme } = useTheme();


  const isDark = resolvedTheme === 'dark';

  return createAvatarWithTextColumn<Document>({
    accessorKey: 'nomFichier',
    title: 'Document',
    icon: FileText,
    getAvatarUrl: (doc) => !isDark ? getDocumentIconPath(doc.type).light : getDocumentIconPath(doc.type).dark,
    getInitials: () => '📄',
    getPrimaryText: (doc) => doc.nomFichier,
    getSecondaryText: (doc) => formatBytes(doc.taille),
    avatarSize: 'md',
    enableSorting: true,
    size: 320,
    cellClassName: 'min-w-0',
  });
}

/**
 * Colonne "Type" – badge coloré.
 * @internal
 */
function colType(): ColumnDef<Document> {
  return {
    accessorKey: 'type',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => {
      const type = row.original.type;
      const cfg = getDocumentTypeConfig(type);
      return (
        <Badge
          variant="outline"
          className={cn('gap-1.5 text-xs font-medium border-0', cfg.bgColor, cfg.textColor)}
        >
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
 * Colonne "Taille" formatée (admin seulement).
 * @internal
 */
function colTaille(): ColumnDef<Document> {
  return {
    accessorKey: 'taille',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Taille" icon={HardDrive} />
    ),
    cell: ({ row }) => (
      <span className="text-xs tabular-nums">{formatBytes(row.original.taille)}</span>
    ),
    enableSorting: true,
    size: 100,
  };
}

/**
 * Colonne "Date de téléversement" – formatée avec tooltip.
 * @internal
 */
function colUploadedAt(): ColumnDef<Document> {
  return {
    accessorKey: 'uploadedAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Téléversé le" icon={Calendar} />
    ),
    cell: ({ row }) => {
      const raw = row.original.uploadedAt;
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
    size: 120,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNE CANDIDAT (AVEC AVATAR ET COORDONNÉES) – via enrichissements
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonne "Candidat" enrichie : avatar + nom complet + email/téléphone.
 * Utilise `createAvatarWithTextColumn` avec les données du candidat.
 * @param enrichments - Ensemble des fonctions d’enrichissement
 * @internal
 */
function colCandidatEnriched(enrichments: DocumentsEnrichments): ColumnDef<Document> {
  const {
    getCandidatNomComplet,
    getCandidatEmail,
    getCandidatTelephone,
    getCandidatAvatarUrl,
    getCandidatInitials,
  } = enrichments;

  // Fallback si aucune fonction n’est fournie
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

  return createAvatarWithTextColumn<Document>({
    accessorKey: 'candidatId', // clé virtuelle
    title: 'Candidat',
    icon: User,
    getAvatarUrl: (doc) => getCandidatAvatarUrl?.(doc) ?? '',
    getInitials: (doc) => getCandidatInitials?.(doc) ?? '?',
    getPrimaryText: (doc) => getCandidatNomComplet(doc),
    getSecondaryText: (doc) => {
      const email = getCandidatEmail?.(doc);
      const phone = getCandidatTelephone?.(doc);
      if (email && phone) return `${email} · ${phone}`;
      return email ?? phone ?? '';
    },
    avatarSize: 'md',
    enableSorting: false,
    size: 260,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNE CANDIDAT SIMPLIFIÉE (sans avatar, pour secrétaire)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonne "Candidat" simplifiée : texte uniquement.
 * @param getNomComplet - Fonction retournant le nom du candidat
 * @internal
 */
function colCandidatSimple(getNomComplet: (doc: Document) => string): ColumnDef<Document> {
  return {
    id: 'candidat',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Candidat" icon={User} />,
    cell: ({ row }) => {
      const nom = getNomComplet(row.original);
      return <span className="text-xs">{nom || '—'}</span>;
    },
    enableSorting: false,
    size: 180,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COLONNE D’ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère la colonne d’actions.
 * @param actions - Callbacks d’actions
 * @param variant - Variante (candidat n’a que téléchargement + aperçu)
 * @internal
 */
function colActions(
  actions?: DocumentsTableActions,
  variant: 'admin' | 'secretaire' | 'candidat' = 'admin'
): ColumnDef<Document> {
  return {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const doc = row.original;
      const customActions: CustomRowAction<Document>[] = [];

      if (actions?.onView) {
        customActions.push({
          label: 'Aperçu',
          icon: <Eye className="mr-2 h-4 w-4" />,
          onClick: (d) => actions.onView!(d),
        });
      }
      if (actions?.onDownload) {
        customActions.push({
          label: 'Télécharger',
          icon: <Download className="mr-2 h-4 w-4" />,
          onClick: (d) => actions.onDownload!(d),
        });
      }
      if (actions?.onPrint && variant !== 'candidat') {
        customActions.push({
          label: 'Imprimer',
          icon: <Printer className="mr-2 h-4 w-4" />,
          onClick: (d) => actions.onPrint!(d),
        });
      }

      const rowActionsConfig: RowActionsConfig<Document> = {
        customActions,
        onDelete: variant !== 'candidat' ? actions?.onDelete : undefined,
      };
      return <DataTableRowActions row={doc} actions={rowActionsConfig} />;
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
 * Génère le tableau de colonnes pour le tableau des documents COS.
 *
 * @param options - Options de configuration (variant, actions, enrichments, columnConfig)
 * @returns Tableau de `ColumnDef<Document>` pour TanStack Table
 *
 * @example
 * ```tsx
 * const columns = getDocumentsColumns({
 *   variant: 'admin',
 *   actions: { onDownload: (d) => console.log(d) },
 *   enrichments: {
 *     getCandidatNomComplet: (d) => d.candidat?.nom,
 *     getCandidatAvatarUrl: (d) => d.candidat?.avatarUrl,
 *   },
 * });
 * ```
 */
export function getDocumentsColumns({
  variant = 'admin',
  actions,
  enrichments = {},
  columnConfig = {},
}: DocumentsColumnsOptions): ColumnDef<Document>[] {
  const {
    showNomFichier = true,
    showType = true,
    showTaille = false,
    showUploadedAt = true,
    showCandidat = variant !== 'candidat',
    showActions = true,
  } = columnConfig;


  const cols: ColumnDef<Document>[] = [];

  if (showNomFichier) cols.push(colDocumentInfo());
  if (showType && variant !== 'candidat') cols.push(colType());
  if (showTaille && variant === 'admin') cols.push(colTaille());
  if (showUploadedAt && (variant === 'admin' || variant === 'candidat')) cols.push(colUploadedAt());

  // Colonne candidat selon la variante et les enrichissements disponibles
  if (showCandidat && variant !== 'candidat') {
    if (variant === 'admin' && enrichments.getCandidatNomComplet) {
      // Vue admin : avatar + coordonnées
      cols.push(colCandidatEnriched(enrichments));
    } else if (variant === 'secretaire' && enrichments.getCandidatNomComplet) {
      // Vue secrétaire : version texte simplifiée
      cols.push(colCandidatSimple(enrichments.getCandidatNomComplet));
    } else if (variant === 'secretaire' || variant === 'admin') {
      // Fallback si pas d’enrichissement : simple texte "—"
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

  if (showActions && actions && Object.keys(actions).length > 0) {
    cols.push(colActions(actions, variant));
  }

  return cols;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRÉ-SETS PAR RÔLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonnes pour le tableau des documents – vue administrateur.
 * Inclut : nom fichier (icône), type, taille, date, candidat enrichi (avatar + coordonnées), actions.
 *
 * @param actions - Callbacks d’actions (télécharger, supprimer, aperçu, imprimer)
 * @param enrichments - Enrichissements du candidat (nom complet, avatar, email, téléphone, initiales)
 * @param columnConfig - Configuration fine des colonnes
 * @returns Colonnes complètes pour vue admin
 */
export function getAdminDocumentsColumns(
  actions?: DocumentsTableActions,
  enrichments?: DocumentsEnrichments,
  columnConfig = {}
): ColumnDef<Document>[] {
  return getDocumentsColumns({
    variant: 'admin',
    actions,
    enrichments,
    columnConfig: {
      showNomFichier: true,
      showType: true,
      showTaille: true,
      showUploadedAt: true,
      showCandidat: true,
      showActions: true,
      ...columnConfig,
    },
  });
}

/**
 * Colonnes pour le tableau des documents – vue secrétaire.
 * Inclut : nom fichier (icône), type, candidat (nom uniquement), actions.
 *
 * @param actions - Callbacks d’actions (télécharger, aperçu)
 * @param enrichments - Enrichissements pour le nom du candidat
 * @param columnConfig - Configuration fine
 * @returns Colonnes adaptées au secrétaire
 */
export function getSecretaireDocumentsColumns(
  actions?: DocumentsTableActions,
  enrichments?: DocumentsEnrichments,
  columnConfig = {}
): ColumnDef<Document>[] {
  return getDocumentsColumns({
    variant: 'secretaire',
    actions,
    enrichments,
    columnConfig: {
      showNomFichier: true,
      showType: true,
      showTaille: false,
      showUploadedAt: false,
      showCandidat: true,
      showActions: true,
      ...columnConfig,
    },
  });
}

/**
 * Colonnes pour le tableau des documents – vue candidat.
 * Inclut : nom fichier (icône), date, actions simplifiées (télécharger, aperçu).
 *
 * @param actions - Callbacks d’actions (télécharger, aperçu)
 * @param columnConfig - Configuration fine
 * @returns Colonnes restreintes pour le candidat
 */
export function getCandidatDocumentsColumns(
  actions?: DocumentsTableActions,
  columnConfig = {}
): ColumnDef<Document>[] {
  return getDocumentsColumns({
    variant: 'candidat',
    actions,
    columnConfig: {
      showNomFichier: true,
      showType: false,
      showTaille: false,
      showUploadedAt: true,
      showCandidat: false,
      showActions: true,
      ...columnConfig,
    },
  });
}
