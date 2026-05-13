/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/examens/components/CandidatsExamensCard.tsx

/**
 * @module features/examens/components/CandidatsExamensCard
 * @description
 * Carte affichant une liste **limitée** des candidats prioritaires pour les examens à venir.
 * Design épuré, taille fixe, avec badge de total supplémentaire.
 *
 * ## Fonctionnalités
 * - Affiche au maximum 5 candidats
 * - Si plus que la limite, affiche un badge « +X autres »
 * - Chaque ligne : avatar, nom complet, catégorie, date d’examen (format relatif), badge de résultat
 * - Aucun défilement interne (hauteur fixe)
 *
 * @see {@link Candidat}
 * @see {@link Examen}
 *
 * @example
 * ```tsx
 * <CandidatsExamsCard
 *   candidats={candidatsAvecExamens}
 *   onCandidatClick={(c) => navigate(`/candidats/${c.id}`)}
 *   maxItems={5}
 * />
 * ```
 */

import * as React from 'react';
import { differenceInDays, format, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getAvatarUrl } from '@/lib/utils';
import type { Candidat } from '@/types/candidats.types';
import type { Examen } from '@/types/examens.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CandidatsExamsCardProps {
    /** Liste des candidats (les examens peuvent être optionnels) */
    candidats: Candidat[];   // au lieu de (Candidat & { examens: Examen[] })[]
    /** Callback au clic sur un candidat */
    onCandidatClick?: (candidat: Candidat) => void;
    /** Titre de la carte (défaut : "Prochains examens") */
    title?: string;
    /** Nombre maximum d’éléments affichés (défaut : 5) */
    maxItems?: number;
    /** Classes additionnelles */
    className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Récupère le prochain examen à venir pour un candidat.
 * Retourne le premier examen futur trié par date croissante, ou `undefined`.
 */
function getNextExamen(candidat: Candidat): Examen | undefined {
    const examens = candidat.examens;
    if (!examens?.length) return undefined;
    const now = new Date();
    const futurs = examens
        .filter((e) => new Date(e.date) >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return futurs.length ? futurs[0] : undefined;
}

/**
 * Formate la date de l’examen en texte relatif ou absolu.
 */
function formatExamenDate(date: Date | string): string {
    const d = new Date(date);
    const daysDiff = differenceInDays(d, new Date());
    if (isToday(d)) return "Aujourd'hui";
    if (isTomorrow(d)) return 'Demain';
    if (daysDiff < 0) return `Il y a ${Math.abs(daysDiff)} jour${Math.abs(daysDiff) > 1 ? 's' : ''}`;
    if (daysDiff <= 7) return `Dans ${daysDiff} jour${daysDiff > 1 ? 's' : ''}`;
    return format(d, 'd MMM', { locale: fr });
}

/**
 * Couleur du badge résultat selon le statut de l’examen.
 */
function getResultatConfig(resultat: string) {
    switch (resultat) {
        case 'RECU':
            return { label: 'Reçu', bgColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' };
        case 'AJOURNE':
            return { label: 'Ajourné', bgColor: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' };
        default:
            return { label: 'En attente', bgColor: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' };
    }
}

/**
 * Indicateur de solde simplifié (mock). À adapter aux vraies données.
 */
function getSoldeInfo(candidat: Candidat): { label: string; isPositive: boolean } {
    const solde = (candidat as any).solde ?? 0;
    const isPositive = solde <= 0;
    return { label: isPositive ? 'Soldé' : `${solde.toLocaleString('fr-FR')} FCFA`, isPositive };
}


/**
 * Retourne les initiales d’un candidat.
 */
function getInitials(c: Candidat): string {
    return `${c.prenom?.[0] ?? ''}${c.nom?.[0] ?? ''}`.toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export function CandidatsExamsCard({
    candidats,
    onCandidatClick,
    title = 'Prochains examens',
    maxItems = 5,
    className,
}: CandidatsExamsCardProps): React.JSX.Element {
    const { visibleCandidats, remainingCount } = React.useMemo(() => {
        const filtered = candidats
            .filter((c) => c.examens?.length)
            .map((c) => ({ candidat: c, nextExam: getNextExamen(c) }))
            .filter((item) => item.nextExam !== undefined)
            .sort((a, b) => {
                const dateA = new Date(a.nextExam!.date).getTime();
                const dateB = new Date(b.nextExam!.date).getTime();
                if (dateA !== dateB) return dateA - dateB;
                const soldeA = (a.candidat as any).solde ?? 0;
                const soldeB = (b.candidat as any).solde ?? 0;
                return (soldeA > 0 ? 0 : 1) - (soldeB > 0 ? 0 : 1);
            });

        const visible = filtered.slice(0, maxItems).map((item) => item.candidat);
        const remaining = filtered.length - visible.length;
        return { visibleCandidats: visible, remainingCount: remaining };
    }, [candidats, maxItems]);

    if (visibleCandidats.length === 0) {
        return (
            <Card className={cn('rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3', className)}>
                <CardHeader>
                    <CardTitle className="text-base font-semibold">{title}</CardTitle>
                </CardHeader>
                <CardContent className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                    Aucun examen programmé
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn('rounded-md border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3', className)}>
            <div className="px-3 flex items-center  justify-between">
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
                {remainingCount > 0 && (
                    <div className="pt-1 text-center">
                        <Badge variant="outline" className="text-xs border-0 bg-muted/50">
                            + {remainingCount} autre{remainingCount > 1 ? 's' : ''} candidat{remainingCount > 1 ? 's' : ''}
                        </Badge>
                    </div>
                )}
            </div>
            <CardContent className="pt-2">
                <div className="space-y-3">
                    {visibleCandidats.map((candidat) => {
                        const examen = getNextExamen(candidat);
                        if (!examen) return null;
                        const resultatCfg = getResultatConfig(examen.resultat);
                        const soldeInfo = getSoldeInfo(candidat);
                        return (
                            <div
                                key={candidat.id}
                                className="flex cursor-pointer items-center justify-between gap-2 rounded-md p-1 transition-colors hover:bg-muted/20"
                                onClick={() => onCandidatClick?.(candidat)}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar className="h-9 w-9 shrink-0">
                                        <AvatarImage src={getAvatarUrl(`${candidat.prenom} ${candidat.nom}`)} />
                                        <AvatarFallback className="text-[11px]">{getInitials(candidat)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold truncate">{candidat.prenom} {candidat.nom}</p>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-0 bg-muted/40">
                                                {candidat.categorie}
                                            </Badge>
                                            {soldeInfo.isPositive ? (
                                                <span className="text-[10px] text-emerald-600">✓ Soldé</span>
                                            ) : (
                                                <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600">
                                                    <AlertCircle className="h-2.5 w-2.5" />
                                                    Impayé
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-400">{formatExamenDate(examen.date)}</p>
                                    <Badge variant="outline" className={cn('mt-1 text-[10px] border-0', resultatCfg.bgColor)}>
                                        {resultatCfg.label}
                                    </Badge>
                                </div>
                            </div>
                        );
                    })}

                </div>
            </CardContent>
        </Card>
    );
}