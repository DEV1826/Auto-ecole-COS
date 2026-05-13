/**
 * @module components/forms/LoadingButton
 * @description 🔘 Bouton avec état de chargement intégré, utilisant les variantes personnalisées de Shadcn UI.
 */

import * as React from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Interface des propriétés du bouton de chargement.
 * Hérite de toutes les propriétés du bouton HTML standard et des variantes Shadcn.
 */
export interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** 📝 Contenu principal du bouton */
  children: React.ReactNode;
  /** ⏳ État de chargement : affiche un spinner et désactive les interactions */
  isLoading?: boolean;
  /** 🔤 Texte alternatif à afficher uniquement pendant le chargement */
  loadingText?: string;
  /** 📏 Taille spécifique du spinner en pixels (ex: 20) */
  spinnerSize?: number;
  /** 📍 Position du spinner par rapport au texte */
  spinnerPosition?: 'left' | 'right';
  /** 🎨 Icône optionnelle à afficher à côté du texte (hors chargement) */
  icon?: LucideIcon;
}

/**
 * LoadingButton - Bouton intelligent pour actions asynchrones.
 * * @description
 * - Gère automatiquement l'état `disabled` lors du chargement.
 * - Préserve l'alignement et le `gap` défini dans tes variantes Shadcn.
 * - Supporte le texte dynamique (`loadingText`).
 *
 * @example
 * ```tsx
 * <LoadingButton
 * variant="default"
 * size="lg"
 * isLoading={isPending}
 * loadingText="Envoi en cours..."
 * >
 * Envoyer le formulaire
 * </LoadingButton>
 * ```
 */
export function LoadingButton({
  isLoading = false,
  loadingText,
  spinnerSize,
  spinnerPosition = 'left',
  children,
  disabled,
  className,
  variant,
  size,
  icon: Icon,
  ...props
}: LoadingButtonProps) {
  // Le bouton est désactivé s'il charge ou si la prop disabled est vraie
  const isDisabled = disabled || isLoading;

  /**
   * Rendu du Spinner :
   * Utilise la taille passée en prop ou se base sur les classes CSS par défaut.
   */
  const renderSpinner = (
    <Loader2
      className={cn('animate-spin shrink-0', !spinnerSize && 'size-4')}
      style={spinnerSize ? { width: spinnerSize, height: spinnerSize } : undefined}
      aria-hidden="true"
    />
  );

  return (
    <Button
      data-slot="loading-button"
      disabled={isDisabled}
      variant={variant}
      size={size}
      className={cn(
        'relative transition-all duration-200 px-6 shadow-lg bg-blue-600 hover:bg-blue-900!  hover:shadow-xl rounded-md h-12 w-full sm:w-auto text-base text-white',
        className
      )}
      {...props}
    >
      {/* 1. Affichage du spinner à GAUCHE */}
      {isLoading && spinnerPosition === 'left' && renderSpinner}

      {/* 2. Affichage de l'icône normale (si pas de chargement et icône fournie) */}
      {!isLoading && Icon && (
        <Icon className="size-4 shrink-0 transition-transform group-hover:scale-110" />
      )}

      {/* 3. Contenu textuel */}
      <span className="truncate">{isLoading && loadingText ? loadingText : children}</span>

      {/* 4. Affichage du spinner à DROITE */}
      {isLoading && spinnerPosition === 'right' && renderSpinner}
    </Button>
  );
}
