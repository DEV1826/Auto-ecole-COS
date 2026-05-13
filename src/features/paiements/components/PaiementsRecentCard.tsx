// src/features/paiements/components/PaiementsRecentCard.tsx

/**
 * @module features/paiements/components/PaiementsRecentCard
 * @description
 * Carte des **paiements récents** – version inspirée de `CaisseMouvementsRecentCard`.
 * Affiche la liste des derniers encaissements avec avatar du candidat, montant, mode, date.
 *
 * ## Fonctionnalités
 * - Avatar du candidat (ou fallback initiales)
 * - Nom complet du candidat
 * - Montant (signe +, vert)
 * - Mode de paiement (badge avec icône)
 * - Date relative (formatée)
 * - Bouton « Voir plus » en haut à droite
 * - État de chargement (skeleton)
 * - État vide (aucun paiement)
 * - Clic sur un paiement (callback)
 *
 * @see {@link Paiement}
 * @see {@link PaiementsTableActions}
 *
 * @example
 * ```tsx
 * <PaiementsRecentCard
 *   paiements={paiements.slice(0, 5)}
 *   maxItems={5}
 *   isLoading={false}
 *   onViewAll={() => navigate('/paiements')}
 *   onViewPaiement={(p) => navigate(`/paiements/${p.id}`)}
 * />
 * ```
 */

import * as React from 'react';
import { ChevronRight, Receipt, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getAvatarUrl } from '@/lib/utils';
import type { Paiement } from '@/types/paiements.types';
import type { ModePaiement } from '@/types/enums';
import { MODE_PAIEMENT_CONFIG } from '@/types/enums';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PaiementsRecentCardProps {
    /** Liste des paiements (triés par date décroissante) */
    paiements: Paiement[];
    /** Nombre maximum d’éléments affichés (défaut: 5) */
    maxItems?: number;
    /** État de chargement */
    isLoading?: boolean;
    /** Callback "Voir tous" */
    onViewAll?: () => void;
    /** Callback au clic sur un paiement (pour voir le détail) */
    onViewPaiement?: (paiement: Paiement) => void;
    /** Classes additionnelles */
    className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formate un montant en FCFA avec notation compacte.
 * @internal
 */
function formatMontant(montant: number): string {
    if (montant >= 1_000_000) return (montant / 1_000_000).toFixed(1) + 'M FCFA';
    if (montant >= 1_000) return (montant / 1_000).toFixed(1) + 'k FCFA';
    return `${montant.toLocaleString('fr-FR')} FCFA`;
}

/**
 * Formate une date en relatif (ex: "Il y a 2h", "Aujourd'hui", etc.)
 * @internal
 */
function formatRelativeDate(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

/**
 * Récupère les initiales d’un candidat.
 * @internal
 */
function getCandidatInitials(p: Paiement): string {
    if (p.candidat) {
        return `${p.candidat.prenom?.[0] ?? ''}${p.candidat.nom?.[0] ?? ''}`.toUpperCase();
    }
    return `C${p.candidatId}`;
}

/**
 * Récupère le nom complet du candidat.
 * @internal
 */
function getCandidatNomComplet(p: Paiement): string {
    if (p.candidat) {
        return `${p.candidat.prenom} ${p.candidat.nom}`;
    }
    return `Candidat ${p.candidatId}`;
}

/**
 * Récupère l’avatar URL du candidat.
 * @internal
 */
function getCandidatAvatarUrl(p: Paiement): string | undefined {
    if (p.candidat) {
        return getAvatarUrl(`${p.candidat.prenom} ${p.candidat.nom}`);
    }
    return getAvatarUrl(`Candidat ${p.candidatId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Squelette d’un élément de la liste des paiements récents.
 * @internal
 */
function PaiementSkeleton(): React.JSX.Element {
    return (
        <li className="flex items-center justify-between gap-3 py-2">
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-32 rounded-md" />
                    <Skeleton className="h-3 w-24 rounded-md" />
                </div>
            </div>
            <div className="text-right">
                <Skeleton className="h-3.5 w-20 rounded-md" />
                <Skeleton className="mt-1 h-3 w-12 rounded-md" />
            </div>
        </li>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Carte des paiements récents.
 * Affiche jusqu’à `maxItems` paiements avec avatar, nom, montant, mode, date.
 */
export function PaiementsRecentCard({
    paiements,
    maxItems = 5,
    isLoading = false,
    onViewAll,
    onViewPaiement,
    className,
}: PaiementsRecentCardProps): React.JSX.Element {
    const paiementsVisibles = React.useMemo(
        () => paiements.slice(0, maxItems),
        [paiements, maxItems]
    );

    return (
        <div className={cn('col-span-12 lg:col-span-7 xl:col-span-4', className)}>
            <Card
                className={cn(
                    'rounded-md overflow-hidden flex flex-col h-full',
                    'bg-linear-to-t from-primary/5 to-card dark:bg-card',
                    'shadow-[0_8px_30px_-15px_rgb(70,95,255,0.18)]',
                    'backdrop-blur-2xl'
                )}
            >
                {/* En‑tête */}
                <div className="px-5 pt-1 sm:px-6 sm:pt-1">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-emerald-700 text-white">
                                <Receipt className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-foreground leading-tight">
                                    Paiements récents
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Derniers encaissements</p>
                            </div>
                        </div>

                        {/* Bouton "Voir plus" */}
                        {!isLoading && paiements.length > 0 && onViewAll && (
                            <button
                                onClick={onViewAll}
                                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                            >
                                Voir plus
                                <ChevronRight className="size-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Liste des paiements */}
                <div className="flex-1 px-5 pb-5 sm:px-6 sm:pb-1">
                    <ul className="divide-y divide-border/30">
                        {isLoading ? (
                            Array.from({ length: maxItems }).map((_, i) => <PaiementSkeleton key={i} />)
                        ) : paiementsVisibles.length === 0 ? (
                            <li className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                                <div className="rounded-full bg-muted/30 p-3">
                                    <Wallet className="size-8 text-muted-foreground/50" />
                                </div>
                                <p className="text-sm text-muted-foreground">Aucun paiement récent</p>
                                <p className="text-xs text-muted-foreground/70">Les encaissements apparaîtront ici</p>
                            </li>
                        ) : (
                            paiementsVisibles.map((paiement) => {
                                const modeCfg = MODE_PAIEMENT_CONFIG[paiement.mode as ModePaiement];
                                const ModeIcon = modeCfg?.icon || Receipt;
                                const avatarUrl = getCandidatAvatarUrl(paiement);
                                const initials = getCandidatInitials(paiement);
                                const nomComplet = getCandidatNomComplet(paiement);

                                return (
                                    <li
                                        key={paiement.id}
                                        className="group flex items-center justify-between py-2.5 transition-all hover:bg-primary/5 -mx-1 px-1 rounded-md cursor-pointer"
                                        onClick={() => onViewPaiement?.(paiement)}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <Avatar className="h-9 w-9 shrink-0">
                                                <AvatarImage src={avatarUrl} alt={nomComplet} />
                                                <AvatarFallback className="text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-foreground">
                                                    {nomComplet}
                                                </p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-0 bg-muted/40">
                                                        <ModeIcon className="h-2.5 w-2.5 mr-1" />
                                                        {modeCfg?.label ?? paiement.mode}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                                +{formatMontant(paiement.montant)}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {formatRelativeDate(paiement.date)}
                                            </p>
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

export default PaiementsRecentCard;