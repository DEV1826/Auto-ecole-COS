// src/features/caisse/components/CaisseMouvementsRecentCard.tsx

/**
 * @module features/caisse/components/CaisseMouvementsRecentCard
 * @description
 * Carte des mouvements récents de caisse – version 4 stabilisée.
 *
 * Affiche les 5 derniers mouvements (sans doublons), les métriques clés
 * (entrées du mois, sorties du mois, solde actuel, évolution du solde)
 * et permet de naviguer vers la page détail.
 *
 * @author Stive Junior
 * @version 4.0.0
 */

'use client';

import React, { useMemo } from 'react';
import {
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  History,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { MouvementCaisse, CaisseStatsExtended, CaisseTrends } from '@/types/caisse.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CaisseMouvementsRecentCardProps {
  /** Liste des mouvements (triés par date décroissante) */
  mouvements?: MouvementCaisse[];
  /** Statistiques étendues de la caisse (inclut evolutionSolde) */
  caisseStats?: CaisseStatsExtended;
  /** Tendances (%) des indicateurs (pour les métriques) */
  caisseTrends?: Pick<CaisseTrends, 'entreesMois' | 'sortiesMois'>;
  /** Nombre max de mouvements affichés (défaut: 5) */
  maxItems?: number;
  /** État de chargement */
  isLoading?: boolean;
  /** Callback "Voir tous" */
  onViewAll?: () => void;
  /** Callback clic sur un mouvement */
  onViewMouvement?: (mouvement: MouvementCaisse) => void;
  /** Classes additionnelles */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────────────────────

function formatFCFA(num?: number | null): string {
  if (num == null) return '0 FCFA';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M FCFA';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k FCFA';
  return `${num.toLocaleString('fr-FR')} FCFA`;
}

function formatCompact(num?: number | null): string {
  if (num == null) return '0';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toLocaleString('fr-FR');
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffH = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
  const diffJ = Math.floor(diffH / 24);

  if (diffH < 1) return "À l'instant";
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffJ < 7) return `Il y a ${diffJ}j`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function getDescription(m: MouvementCaisse): string {
  if (m.description) return m.description;
  return m.type === 'ENTREE' ? 'Entrée de caisse' : 'Sortie de caisse';
}

function getSousTexte(m: MouvementCaisse): string {
  if (m.reference) return `Réf: ${m.reference}`;
  return `Solde: ${formatCompact(m.solde)} FCFA`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

function MouvementAvatar({ type }: { type: string }) {
  const isEntree = type === 'ENTREE';
  return (
    <div
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full',
        'bg-linear-to-br shadow-sm',
        isEntree
          ? 'from-emerald-100 to-emerald-50 dark:from-emerald-500/20 dark:to-emerald-500/10'
          : 'from-red-100 to-red-50 dark:from-red-500/20 dark:to-red-500/10'
      )}
    >
      {isEntree ? (
        <ArrowDownLeft className="size-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
      ) : (
        <ArrowUpRight className="size-5 text-red-600 dark:text-red-400" strokeWidth={2} />
      )}
    </div>
  );
}

function MetricItem({
  label,
  value,
  trend,
  icon: Icon,
  valueColor,
}: {
  label: string;
  value: string;
  trend?: number;
  icon: React.ElementType;
  valueColor?: string;
}) {
  const hasTrend = trend !== undefined && trend !== 0;
  const isPos = (trend ?? 0) > 0;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 text-muted-foreground/70" />
        <p className={cn('text-sm font-bold', valueColor || 'text-foreground')}>{value}</p>
        {hasTrend && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-[10px] font-semibold',
              isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            )}
          >
            {isPos ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {isPos ? '+' : ''}
            {trend}%
          </span>
        )}
      </div>
    </div>
  );
}

function MouvementSkeleton() {
  return (
    <li className="flex justify-between gap-3 py-2">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-32 rounded-md" />
          <Skeleton className="h-3 w-20 rounded-md" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <Skeleton className="h-3.5 w-20 rounded-md" />
        <Skeleton className="h-3 w-12 rounded-md" />
      </div>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Carte des mouvements récents de caisse.
 * Élimine les doublons par ID, trie par date décroissante et limite l’affichage.
 */
export function CaisseMouvementsRecentCard({
  mouvements = [],
  caisseStats,
  caisseTrends,
  maxItems = 5,
  isLoading = false,
  onViewAll,
  onViewMouvement,
  className,
}: CaisseMouvementsRecentCardProps) {
  const mouvementsUniques = useMemo(() => {
    const uniqueMap = new Map<number, MouvementCaisse>();
    for (const m of mouvements) {
      if (!uniqueMap.has(m.id)) {
        uniqueMap.set(m.id, m);
      }
    }
    const uniques = Array.from(uniqueMap.values());
    return uniques.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [mouvements]);

  const mouvementsVisibles = useMemo(
    () => mouvementsUniques.slice(0, maxItems),
    [mouvementsUniques, maxItems]
  );



  return (
    <div className={cn('col-span-12 lg:col-span-7 xl:col-span-4', className)}>
      <Card
        className={cn(
          'rounded-md overflow-hidden flex flex-col h-full',
          'backdrop-blur-2xl shadow-sm'
        )}
      >
        {/* ── EN‑TÊTE ───────────────────────────────────────────────────── */}
        <div className="px-1 pt-5 sm:px-6 sm:pt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-blue-800 text-white">
                <History className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground leading-tight">
                  Mouvements récents
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Dernières opérations de caisse
                </p>
              </div>
            </div>

            {/* Bouton "Voir plus" */}
            {!isLoading && mouvementsUniques.length > 0 && onViewAll && (
              <button
                onClick={onViewAll}
                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                Voir plus
                <ChevronRight className="size-3.5" />
              </button>
            )}
          </div>

          {/* Métriques (entrées, sorties, solde actuel, évolution) */}
          {!isLoading && caisseStats ? (
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-border/30 pt-4">
              <MetricItem
                label="Entrées (mois)"
                value={formatCompact(caisseStats.entreesMois)}
                trend={caisseTrends?.entreesMois}
                icon={TrendingUp}
                valueColor="text-emerald-600 dark:text-emerald-400"
              />
              <MetricItem
                label="Sorties (mois)"
                value={formatCompact(caisseStats.sortiesMois)}
                trend={caisseTrends?.sortiesMois}
                icon={TrendingDown}
                valueColor="text-red-600 dark:text-red-400"
              />
              <MetricItem
                label="Solde actuel"
                value={formatCompact(caisseStats.soldeActuel)}
                icon={Wallet}
                valueColor="text-blue-600 dark:text-blue-400"
              />
              <MetricItem
                label="Évolution"
                value={caisseStats.evolutionSolde != null ? `${caisseStats.evolutionSolde >= 0 ? '+' : ''}${caisseStats.evolutionSolde.toFixed(1)}%` : '–'}
                icon={TrendingUp}
                valueColor={caisseStats.evolutionSolde != null && caisseStats.evolutionSolde >= 0 ? 'text-emerald-600' : 'text-red-600'}
              />
            </div>
          ) : isLoading ? (
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-border/30 pt-4">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          ) : null}
        </div>

        {/* ── LISTE DES MOUVEMENTS ──────────────────────────────────────── */}
        <div className="flex-1 px-5 sm:px-6">
          <ul className="divide-y divide-border/30">
            {isLoading ? (
              Array.from({ length: maxItems }).map((_, i) => <MouvementSkeleton key={`skeleton-${i}`} />)
            ) : mouvementsUniques.length === 0 ? (
              <li className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                <div className="rounded-full bg-muted/30 p-3">
                  <Wallet className="size-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">Aucun mouvement récent</p>
                <p className="text-xs text-muted-foreground/70">
                  Les opérations de caisse apparaîtront ici
                </p>
              </li>
            ) : (
              mouvementsVisibles.map((mouvement) => {
                const isEntree = mouvement.type === 'ENTREE';
                return (
                  <li
                    key={mouvement.id}
                    className="group flex items-center justify-between py-2.5 transition-all hover:bg-primary/5 -mx-1 px-1 rounded-md"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <MouvementAvatar type={mouvement.type} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {getDescription(mouvement)}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {getSousTexte(mouvement)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p
                          className={cn(
                            'text-sm font-semibold',
                            isEntree
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          )}
                        >
                          {isEntree ? '+' : '−'}
                          {formatFCFA(mouvement.montant)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDate(mouvement.date)}
                        </p>
                      </div>
                      {onViewMouvement && (
                        <button
                          onClick={() => onViewMouvement(mouvement)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                          aria-label="Détail du mouvement"
                        >
                          <ArrowRight className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </Card>
    </div>
  );
}

export default CaisseMouvementsRecentCard;