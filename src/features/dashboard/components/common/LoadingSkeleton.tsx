// src/features/dashboard/components/common/LoadingSkeleton.tsx

/**
 * @module dashboard/components/common/LoadingSkeleton
 * @description Composant squelette (skeleton) pour les états de chargement.
 * Utilise les composants UI de ShadCN (Skeleton, Table, Card, etc.) pour afficher
 * des indicateurs de chargement personnalisables selon différents types :
 * - `card` : cartes avec image, titre, texte
 * - `list` : liste avec avatar et lignes de texte
 * - `table` : tableau avec en-têtes et cellules (utilise les composants Table)
 * - `avatar-list` : liste d'avatars circulaires
 * - `detail` : page de détail (titre, blocs, texte)
 * - `stats` : cartes de statistiques
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * // Squelette de type carte (3 cartes)
 * <LoadingSkeleton type="card" count={3} />
 *
 * // Squelette de type tableau avec 5 colonnes et 4 lignes
 * <LoadingSkeleton type="table" columns={5} rows={4} />
 *
 * // Squelette de type liste d'avatars (8 éléments)
 * <LoadingSkeleton type="avatar-list" count={8} />
 *
 * // Personnalisation avec des classes
 * <LoadingSkeleton type="card" count={2} className="grid grid-cols-2 gap-4" />
 * ```
 */

import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Types de squelette disponibles
 */
export type SkeletonType = 'card' | 'list' | 'table' | 'avatar-list' | 'detail' | 'stats';

/**
 * Propriétés du composant LoadingSkeleton
 */
export interface LoadingSkeletonProps {
  /** Type de squelette à afficher (défaut: 'card') */
  type?: SkeletonType;
  /** Nombre d'éléments à afficher (pour les types card, list, avatar-list, stats) */
  count?: number;
  /** Nombre de colonnes pour le type 'table' (défaut: 4) */
  columns?: number;
  /** Nombre de lignes pour le type 'table' (défaut: 3) */
  rows?: number;
  /** Afficher un en-tête de tableau (pour type 'table', défaut: true) */
  showHeader?: boolean;
  /** Classes CSS supplémentaires pour le conteneur principal */
  className?: string;
  /** Classes CSS supplémentaires pour chaque élément individuel (selon le type) */
  itemClassName?: string;
}

/**
 * Composant de squelette réutilisable pour les chargements.
 * Affiche des blocs gris animés simulant du contenu, en respectant la structure UI.
 */
export function LoadingSkeleton({
  type = 'card',
  count = 3,
  columns = 4,
  rows = 3,
  showHeader = true,
  className,
  itemClassName,
}: LoadingSkeletonProps) {
  const renderCardSkeleton = () => {
    return Array.from({ length: count }).map((_, idx) => (
      <Card key={idx} className={cn('overflow-hidden', itemClassName)}>
        <CardHeader className="p-0">
          <Skeleton className="h-32 w-full rounded-none" />
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Skeleton className="h-8 w-full rounded-md" />
        </CardFooter>
      </Card>
    ));
  };

  // Squelette de type liste (avatar + lignes)
  const renderListSkeleton = () => {
    return Array.from({ length: count }).map((_, idx) => (
      <div key={idx} className={cn('flex items-center gap-3 p-3 border-b', itemClassName)}>
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>
    ));
  };

  // Squelette de type tableau (utilise les composants Table de ShadCN)
  const renderTableSkeleton = () => {
    return (
      <div className={cn('rounded-md border', itemClassName)}>
        <Table>
          {showHeader && (
            <TableHeader>
              <TableRow>
                {Array.from({ length: columns }).map((_, idx) => (
                  <TableHead key={`header-${idx}`}>
                    <Skeleton className="h-5 w-24" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          )}
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <TableRow key={`row-${rowIdx}`}>
                {Array.from({ length: columns }).map((_, colIdx) => (
                  <TableCell key={`cell-${rowIdx}-${colIdx}`}>
                    <Skeleton className="h-4 w-full max-w-[200px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Squelette de type liste d'avatars (pour les équipes, patients récents)
  const renderAvatarListSkeleton = () => {
    return (
      <div className={cn('flex flex-wrap gap-4', itemClassName)}>
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    );
  };

  // Squelette de type détail (page de détail d'un élément)
  const renderDetailSkeleton = () => {
    return (
      <div className={cn('space-y-6', itemClassName)}>
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 w-full rounded-xs" />
          <Skeleton className="h-24 w-full rounded-xs" />
          <Skeleton className="h-24 w-full rounded-xs" />
          <Skeleton className="h-24 w-full rounded-xs" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-32 w-full rounded-xs" />
      </div>
    );
  };

  // Squelette de type statistiques (cartes de stats)
  const renderStatsSkeleton = () => {
    return Array.from({ length: count }).map((_, idx) => (
      <div key={idx} className={cn('rounded-xs border p-4', itemClassName)}>
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="mt-2 h-8 w-2/3" />
        <Skeleton className="mt-2 h-3 w-full" />
      </div>
    ));
  };

  // Sélection du rendu selon le type
  const renderContent = () => {
    switch (type) {
      case 'card':
        return renderCardSkeleton();
      case 'list':
        return renderListSkeleton();
      case 'table':
        return renderTableSkeleton();
      case 'avatar-list':
        return renderAvatarListSkeleton();
      case 'detail':
        return renderDetailSkeleton();
      case 'stats':
        return renderStatsSkeleton();
      default:
        return renderCardSkeleton();
    }
  };

  return (
    <div className={cn('w-full', className)} role="status" aria-label="Chargement en cours">
      {renderContent()}
    </div>
  );
}
