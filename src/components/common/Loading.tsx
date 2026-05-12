/**
 * @module common/Loading
 * @description Écran de chargement complet avec spinner ou image personnalisée.
 */

import { type ReactNode } from 'react';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface LoadingProps {
  /** Titre du message */
  title?: string;
  /** Description */
  description?: string;
  /** Afficher un bouton d'annulation */
  showCancel?: boolean;
  /** Fonction d'annulation */
  onCancel?: () => void;
  /** Texte du bouton d'annulation */
  cancelText?: string;
  /** Élément personnalisé (icône, image, spinner, etc.) – remplace le spinner par défaut */
  Icon?: ReactNode;
  /** Classes additionnelles pour le conteneur */
  className?: string;
}

/**
 * Écran de chargement complet utilisant le composant Empty.
 * Par défaut affiche un spinner, mais peut recevoir une icône ou image personnalisée.
 *
 * @example
 * ```tsx
 * // Spinner par défaut
 * <Loading title="Traitement en cours" description="Veuillez patienter..." />
 *
 * // Avec image personnalisée
 * <Loading customIcon={<img src="/images/loading.svg" alt="" />} />
 *
 * // Avec bouton d'annulation
 * <Loading showCancel onCancel={() => console.log('cancel')} />
 * ```
 */
export function Loading({
  title = 'Chargement en cours',
  description = 'Veuillez patienter pendant que nous traitons votre demande.',
  showCancel = false,
  onCancel,
  cancelText = 'Annuler',
  Icon,
  className,
}: LoadingProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Empty className={cn('w-full max-w-md', className)}>
        <EmptyHeader>
          <EmptyMedia variant="icon">{Icon ?? <Spinner className="size-8" />}</EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        {showCancel && (
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={onCancel}>
              {cancelText}
            </Button>
          </EmptyContent>
        )}
      </Empty>
    </div>
  );
}
