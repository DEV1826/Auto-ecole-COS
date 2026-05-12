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
 * @example
 * ```tsx
 * <DocumentsStatsCards
 *   stats={{
 *     totalDocuments: 142,
 *     totalTailleBytes: 125000000,
 *     documentsPermis: 45,
 *     documentsCarteIdentite: 38,
 *     documentsFacture: 32,
 *     documentsRecu: 27,
 *   }}
 *   trends={{
 *     totalDocuments: 8.2,
 *     documentsPermis: 5,
 *     documentsFacture: 10,
 *   }}
 *   totalDocumentsSparkline={{
 *     values: [120, 125, 130, 135, 142],
 *     labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'],
 *   }}
 *   isLoading={false}
 *   onCardClick={(id) => console.log(id)}
 * />
 * ```
 *
 * @author Stive Junior
 * @version 1.0.0
 * @see {@link DocumentsStats} – Métriques agrégées
 * @see {@link DocumentsTrends} – Tendances évolutives
 * @see {@link StatsCard} – Carte de statistique réutilisable
 * @see {@link StatsGrid} – Grille responsive
 */

import { FileText, FileCheck, IdCard, Receipt, File, HardDrive } from 'lucide-react';
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
  /** Métriques statistiques des documents */
  stats: DocumentsStats;
  /** Tendances évolutives (optionnelles) */
  trends?: Partial<DocumentsTrends>;

  /** Sparkline pour le total des documents */
  totalDocumentsSparkline?: DocumentsSparklineData;
  /** Sparkline pour les permis */
  permisSparkline?: DocumentsSparklineData;
  /** Sparkline pour les cartes d'identité */
  carteIdentiteSparkline?: DocumentsSparklineData;
  /** Sparkline pour les factures */
  facturesSparkline?: DocumentsSparklineData;
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
  permisSparkline,
  carteIdentiteSparkline,
  facturesSparkline,
  recusSparkline,
  tailleSparkline,
  isLoading = false,
  onCardClick,
  className,
  customCards,
}: DocumentsStatsCardsProps): React.JSX.Element {
  const handleClick = (id: string) => onCardClick?.(id);

  const defaultCards: StatsCardProps[] = [
    {
      id: 'total-documents',
      title: 'Total documents',
      value: formatCompactNumber(stats.totalDocuments),
      icon: <FileText className="size-5" />,
      iconBg: 'bg-blue-500',
      description: 'Tous types confondus',
      trend: buildTrend(trends.totalDocuments),
      sparklineData: totalDocumentsSparkline
        ? { values: totalDocumentsSparkline.values, labels: totalDocumentsSparkline.labels }
        : undefined,
      onClick: () => handleClick('total-documents'),
    },
    {
      id: 'documents-permis',
      title: 'Permis',
      value: formatCompactNumber(stats.documentsPermis),
      icon: <FileCheck className="size-5" />,
      iconBg: 'bg-emerald-500',
      description: 'Permis de conduire',
      trend: buildTrend(trends.documentsPermis),
      sparklineData: permisSparkline
        ? { values: permisSparkline.values, labels: permisSparkline.labels }
        : undefined,
      onClick: () => handleClick('documents-permis'),
    },
    {
      id: 'documents-carte-identite',
      title: "Cartes d'identité",
      value: formatCompactNumber(stats.documentsCarteIdentite),
      icon: <IdCard className="size-5" />,
      iconBg: 'bg-amber-500',
      description: "Pièces d'identité",
      trend: buildTrend(trends.documentsCarteIdentite),
      sparklineData: carteIdentiteSparkline
        ? { values: carteIdentiteSparkline.values, labels: carteIdentiteSparkline.labels }
        : undefined,
      onClick: () => handleClick('documents-carte-identite'),
    },
    {
      id: 'documents-facture',
      title: 'Factures',
      value: formatCompactNumber(stats.documentsFacture),
      icon: <Receipt className="size-5" />,
      iconBg: 'bg-purple-500',
      description: 'Factures émises',
      trend: buildTrend(trends.documentsFacture),
      sparklineData: facturesSparkline
        ? { values: facturesSparkline.values, labels: facturesSparkline.labels }
        : undefined,
      onClick: () => handleClick('documents-facture'),
    },
    {
      id: 'documents-recu',
      title: 'Reçus',
      value: formatCompactNumber(stats.documentsRecu),
      icon: <File className="size-5" />,
      iconBg: 'bg-indigo-500',
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
      iconBg: 'bg-rose-500',
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
    return !isNaN(numericValue) && numericValue > 0;
  });

  if (!hasData && !isLoading) {
    return (
      <div className={cn('w-full', className)}>
        <EmptyState
          title="Aucune statistique disponible"
          description="Les données sur les documents seront affichées ici une fois disponibles."
          icon={FileText}
          variant="dashed"
          size="md"
        />
      </div>
    );
  }

  return (
    <StatsGrid cards={cards} cols={2} className={cn('w-full', className)} isLoading={isLoading} />
  );
}

export default DocumentsStatsCards;
