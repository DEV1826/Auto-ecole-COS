// src/features/vehicules/components/VehiculesEnLeconCard.tsx

/**
 * @module features/vehicules/components/VehiculesEnLeconCard
 * @description
 * Carte inspirée du design "Delivery Vehicles" affichant le nombre de véhicules
 * actuellement en leçon, avec tendance, badge de statut "En route" et information
 * sur le conducteur le plus fréquent ou le dernier conducteur.
 *
 * ## Fonctionnalités
 * - Compteur des véhicules utilisés (`enLecon`)
 * - Tendance d'évolution (hausse / baisse)
 * - Badge de statut (couleur, point, libellé)
 * - Illustration décorative (image de véhicule)
 * - Informations sur le conducteur (avatar, nom, rôle) – utile pour le suivi
 * - Hauteur pleine (`h-full`) pour s’intégrer dans des grilles flexibles
 *
 * @see {@link VehiculesStats}
 *
 * @example
 * ```tsx
 * <VehiculesEnLeconCard
 *   enLecon={4}
 *   total={12}
 *   trend={{ value: 2.5, isPositive: true }}
 *   statusLabel="En leçon"
 *   driverInfo={{
 *     name: "Marc Dubois",
 *     role: "Moniteur principal",
 *     avatarUrl: "/avatars/marc.png",
 *     leconsCount: 124
 *   }}
 *   className="h-full"
 * />
 * ```
 */

import * as React from 'react';
import { TrendingUp, TrendingDown, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Informations sur un conducteur (moniteur) à afficher.
 */
export interface DriverInfo {
    /** Nom complet du conducteur */
    name: string;
    /** Rôle / fonction (ex: "Moniteur principal") */
    role?: string;
    /** URL de l’avatar */
    avatarUrl?: string;
    /** Nom du véhicule */
    vehiculeName?: string;
    /** Fonction de callback pour l’action d’appel */
    onCall: () => void;
}

export interface VehiculesEnLeconCardProps {
    /** Nombre de véhicules actuellement en leçon */
    enLecon: number;
    /** État de chargement */
    isLoading?: boolean;
    /** Tendance d'évolution (pourcentage) */
    trend?: {
        value: number;
        isPositive: boolean;
        label?: string;
    };
    /** Libellé du badge (ex: "En leçon", "On‑route") */
    statusLabel?: string;
    /** Couleur du badge (par défaut : success‑500) */
    statusColor?: string;
    /** Image décorative (chemin relatif ou URL) */
    illustrationSrc?: string;
    /** Informations sur le conducteur (facultatif) */
    driverInfo?: DriverInfo;
    /** Classes additionnelles (par exemple `h-full`) */
    className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous‑composant pour les initiales
// ─────────────────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export function VehiculesEnLeconCard({
    enLecon,
    isLoading = false,
    trend,
    statusLabel = 'En leçon',
    statusColor = 'bg-emerald-500',
    illustrationSrc = '/images/brand/car.png',
    driverInfo,
    className,
}: VehiculesEnLeconCardProps): React.JSX.Element {
    if (!trend && !isLoading) return <></>;

    // État de chargement
    if (isLoading) {
        return (
            <Card
                className={cn(
                    'overflow-hidden rounded-md border p-6 flex flex-col h-full',
                    className
                )}
            >
                <CardContent className="p-0 relative flex flex-col grow">
                    {/* En-tête skeleton */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <Skeleton className="h-6 w-48 mb-2" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                    </div>

                    {/* Contenu skeleton */}
                    <div className="relative mt-5 flex flex-wrap justify-between items-end gap-4">
                        <div className="flex-1">
                            <Skeleton className="h-10 w-16 mb-3" />
                            <Skeleton className="h-4 w-32 mb-5" />
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-6 w-6 rounded-full" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-32 w-32 rounded-md" />
                    </div>

                    {/* Informations driver skeleton */}
                    <div className="mt-6 pt-4 border-t">
                        <Skeleton className="h-3 w-40 mb-3" />
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1">
                                <Skeleton className="h-4 w-32 mb-2" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-10 w-10 rounded-full" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!trend) return <></>;
    const { value, isPositive, label } = trend;

    return (
        <Card
            className={cn(
                'overflow-hidden rounded-md border p-6 flex flex-col h-full',
                className
            )}
        >
            <CardContent className="p-0 relative flex flex-col grow">
                {/* En‑tête */}
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            Véhiculesnouvelle form en leçon
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Actuellement sur la route
                        </p>
                    </div>
                    {/* Optionnel: menu à 3 points (non utilisé ici) */}
                </div>

                {/* Contenu principal */}
                <div className="relative mt-5 flex flex-wrap justify-between items-end gap-4">
                    <div className="flex-1">
                        <h3 className="mb-1 text-3xl font-medium text-gray-800 font-stats dark:text-white/90">
                            {enLecon}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 inline-flex items-center gap-0.5 text-xs font-medium">
                            <span
                                className={cn(
                                    isPositive ? 'text-emerald-600' : 'text-red-600',
                                    'inline-flex items-center gap-0.5 text-xs font-medium'
                                )}
                            >
                                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {isPositive ? '+' : ''}{value}%
                            </span>
                            <span className="text-muted-foreground">{label || 'vs période précédente'}</span>
                        </p>

                        {/* Badge de statut */}
                        <div className="mt-5 flex items-center gap-2">
                            <div
                                className={cn(
                                    'flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-inset',
                                    statusColor === 'bg-emerald-500' ? 'ring-emerald-500' : 'ring-blue-500'
                                )}
                            >
                                <div className={cn('h-2.5 w-2.5 rounded-full', statusColor)} />
                            </div>
                            <div>
                                <span
                                    className={cn(
                                        'text-sm font-medium',
                                        statusColor === 'bg-emerald-500' ? 'text-emerald-500' : 'text-blue-500'
                                    )}
                                >
                                    {statusLabel}
                                    {driverInfo?.vehiculeName && (
                                        <p className="text-xs text-muted-foreground truncate">{driverInfo.vehiculeName}</p>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Illustration (image) */}
                    {illustrationSrc && (
                        <div className="relative shrink-0">
                            <img
                                src={illustrationSrc}
                                alt="Véhicule en leçon"
                                className="h-32 w-auto object-contain"
                            />
                        </div>
                    )}
                </div>

                {/* Informations du conducteur (en bas) */}
                {driverInfo && (
                    <div className="mt-6 pt-4 border-t">
                        <p className="text-xs uppercasae tracking-wide text-muted-foreground font-semibold mb-3">
                            Conducteur le plus actif
                        </p>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border shadow-sm rounded-full">
                                <AvatarImage src={driverInfo.avatarUrl} alt={driverInfo.name} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {getInitials(driverInfo.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{driverInfo.name}</p>
                                {driverInfo.role && (
                                    <p className="text-xs text-muted-foreground truncate">{driverInfo.role}</p>
                                )}

                            </div>
                            <div className="flex items-center gap-2">

                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={driverInfo.onCall}
                                    className="h-10 w-10 rounded-full border-[0.5px] border-gray-200  text-gray-700 hover:bg-gray-100 dark:border-gray-800  dark:text-gray-400"
                                >
                                    <Phone className="h-4 w-4" />
                                </Button>



                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}