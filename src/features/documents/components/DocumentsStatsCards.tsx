// src/features/documents/components/DocumentsStatsCards.tsx

/**
 * @module features/documents/components/DocumentsStatsCards
 * @description
 * Grille de cartes statistiques pour la gestion des documents (permis, cartes d'identité, factures, reçus).
 * Utilisable par l'administrateur, le secrétariat et les candidats.
 *
 * ## Métriques affichées (par défaut)
 * - **Total documents** : nombre de documents stockés
 * - **Permis** : documents de type permis de conduire
 * - **Cartes d'identité** : pièces d'identité
 * - **Factures** : factures téléversées
 * - **Reçus** : reçus de paiement
 * - **Taille totale** : espace de stockage utilisé (Ko / Mo)
 *
 * Chaque carte supporte :
 * - Valeur formatée (nombre, taille)
 * - Tendance (évolution par rapport à la période précédente)
 * - Sparkline optionnelle (évolution sur plusieurs mois)
 * - Icône personnalisée avec fond coloré
 * - État de chargement (skeleton)
 * - Clic sur la carte (callback)
 *
 * Le composant s'intègre au design system COS (gradient bleu, ombre subtile,
 * `backdrop-blur-2xl`, sans bordure). Il utilise `StatsGrid` et `StatsCard` du dossier commun.
 *
 * @author Stive Junior
 * @version 2.0.0
 * @see {@link DocumentsStats} – Métriques agrégées
 * @see {@link DocumentsTrends} – Tendances évolutives
 * @see {@link StatsCard} – Carte de statistique réutilisable
 * @see {@link StatsGrid} – Grille responsive
 */

import { FileText, IdCard, File, HardDrive } from 'lucide-react';
import {
  StatsGrid,
  type StatsCardProps,
  type StatsTrend,
} from '@/features/dashboard/components/common/StatsCard';
import { EmptyState } from '@/features/dashboard/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type { DocumentsStats, DocumentsTrends } from '@/types/documents.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Données d'un sparkline (courbe miniature) pour une métrique de document.
 */
export interface DocumentsSparklineData {
  /** Liste des valeurs (ex: [120, 125, 130]) */
  values: number[];
  /** Étiquettes associées aux valeurs (optionnelles) */
  labels?: string[];
}

/**
 * Propriétés du composant `DocumentsStatsCards`.
 */
export interface DocumentsStatsCardsProps {
  /** Métriques statistiques des documents (peut être null pendant le chargement) */
  stats: DocumentsStats | null;
  /** Tendances évolutives (optionnelles) */
  trends?: Partial<DocumentsTrends>;

  /** Sparkline pour le total des documents */
  totalDocumentsSparkline?: DocumentsSparklineData;
  /** Sparkline pour les cartes d'identité */
  carteIdentiteSparkline?: DocumentsSparklineData;
  /** Sparkline pour les reçus */
  recusSparkline?: DocumentsSparklineData;
  /** Sparkline pour la taille totale */
  tailleSparkline?: DocumentsSparklineData;

  /** Afficher l’état de chargement (skeleton) */
  isLoading?: boolean;
  /** Callback déclenché au clic sur une carte (reçoit l’identifiant) */
  onCardClick?: (cardId: string) => void;
  /** Classes additionnelles pour la grille */
  className?: string;

  /**
   * Permet de remplacer entièrement les cartes.
   */
  customCards?: StatsCardProps[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Fonctions utilitaires
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formate un nombre en notation courte (K, M).
 * @internal
 */
function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
}

/**
 * Formate une taille en octets en Ko / Mo.
 * @internal
 */
function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return (bytes / 1_000_000).toFixed(1) + ' Mo';
  if (bytes >= 1_000) return (bytes / 1_000).toFixed(1) + ' Ko';
  return bytes + ' o';
}

/**
 * Construit un objet StatsTrend.
 * @internal
 */
function buildTrend(value: number | undefined, label?: string): StatsTrend | undefined {
  if (value === undefined) return undefined;
  return {
    value,
    isPositive: value > 0,
    label: label ?? 'vs période précédente',
    neutralLabel: 'Stable',
    isPercentage: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export function DocumentsStatsCards({
  stats,
  trends = {},
  totalDocumentsSparkline,
  carteIdentiteSparkline,
  recusSparkline,
  tailleSparkline,
  isLoading = false,
  onCardClick,
  className,
  customCards,
}: DocumentsStatsCardsProps): React.JSX.Element {
  const handleClick = (id: string) => onCardClick?.(id);

  // Affichage des squelettes pendant le chargement ou si stats est null
  if (isLoading || !stats) {
    const skeletonCards: StatsCardProps[] = [
      { id: 'skeleton-1', title: '', value: '', icon: null, Color: 'gray' },
      { id: 'skeleton-2', title: '', value: '', icon: null, Color: 'gray' },
      { id: 'skeleton-3', title: '', value: '', icon: null, Color: 'gray' },
      { id: 'skeleton-4', title: '', value: '', icon: null, Color: 'gray' },
    ];
    return (
      <StatsGrid
        cards={skeletonCards}
        cols={2}
        className={cn('w-full h-full', className)}
        isLoading={true}

      />
    );
  }

  // Cartes par défaut (4 cartes avec métriques étendues)
  const defaultCards: StatsCardProps[] = [
    {
      id: 'total-documents',
      title: 'Total documents',
      value: formatCompactNumber(stats.totalDocuments),
      icon: <FileText className="size-5" />,
      Color: 'blue-500',
      description: 'Tous types confondus',
      trend: buildTrend(trends.totalDocuments),
      sparklineData: totalDocumentsSparkline
        ? { values: totalDocumentsSparkline.values, labels: totalDocumentsSparkline.labels }
        : undefined,
      onClick: () => handleClick('total-documents'),
    },
    {
      id: 'documents-carte-identite',
      title: "Cartes d'identité",
      value: formatCompactNumber(stats.documentsCarteIdentite),
      icon: <IdCard className="size-5" />,
      Color: 'amber-500',
      description: "Pièces d'identité",
      trend: buildTrend(trends.documentsCarteIdentite),
      sparklineData: carteIdentiteSparkline
        ? { values: carteIdentiteSparkline.values, labels: carteIdentiteSparkline.labels }
        : undefined,
      onClick: () => handleClick('documents-carte-identite'),
    },
    {
      id: 'documents-recu',
      title: 'Reçus',
      value: formatCompactNumber(stats.documentsRecu),
      icon: <File className="size-5" />,
      Color: 'indigo-500',
      description: 'Reçus de paiement',
      trend: buildTrend(trends.documentsRecu),
      sparklineData: recusSparkline
        ? { values: recusSparkline.values, labels: recusSparkline.labels }
        : undefined,
      onClick: () => handleClick('documents-recu'),
    },
    {
      id: 'taille-totale',
      title: 'Taille totale',
      value: formatBytes(stats.totalTailleBytes),
      icon: <HardDrive className="size-5" />,
      Color: 'emerald-500',
      description: 'Stockage utilisé',
      trend: buildTrend(trends.totalTailleBytes),
      sparklineData: tailleSparkline
        ? { values: tailleSparkline.values, labels: tailleSparkline.labels }
        : undefined,
      onClick: () => handleClick('taille-totale'),
    },
  ];

  const cards = customCards ?? defaultCards;

  const hasData = cards.some((card) => {
    const numericValue =
      typeof card.value === 'number'
        ? card.value
        : parseFloat(String(card.value).replace(/[^0-9.-]/g, ''));
    return !isNaN(numericValue);
  });

  if (!hasData && !isLoading) {
    return (
      <div className={cn('w-full h-full', className)}>
        <EmptyState
          title="Aucune statistique disponible"
          description="Les données sur les documents seront affichées ici une fois disponibles."
          icon={FileText}
          variant="dashed"
          size="md"
          className='h-full!'
        />
      </div>
    );
  }

  return (
    <StatsGrid
      cards={cards}
      cols={2}
      className={cn('w-full', className)}
      isLoading={isLoading}
    />
  );
}

export default DocumentsStatsCards;