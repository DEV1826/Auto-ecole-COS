/**
 * @module components/forms/OtpInput
 * @description Composant de saisie OTP (One-Time Password) basé sur les primitives de navigation au clavier.
 * Gère la segmentation par groupes, les états d'erreur et les séparateurs visuels.
 */

import * as React from 'react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { cn } from '@/lib/utils';

/**
 * Propriétés du composant OtpInput.
 */
export interface OtpInputProps {
  /** Valeur actuelle du code OTP transmise par le parent */
  value: string;
  /** Fonction de rappel appelée à chaque modification de la valeur */
  onChange: (value: string) => void;
  /** Nombre total de caractères si aucun groupe n'est défini (par défaut : 6) */
  length?: number;
  /** * Définition de la structure des segments.
   * @example [3, 3] affichera deux groupes de 3 cases séparés.
   */
  groups?: number[];
  /** Désactive l'interaction et applique un style visuel spécifique */
  disabled?: boolean;
  /** Applique un style d'erreur (bordure rouge, texte rouge) aux cases */
  error?: boolean;
  /** Classes CSS additionnelles pour le conteneur externe */
  className?: string;
  /** Identifiant unique pour l'association avec un label et l'accessibilité */
  id?: string;
}

/**
 * OtpInput - Champ de saisie segmenté pour codes de vérification.
 * * Fonctionnalités :
 * - Support natif du copier-coller (OTP-aware).
 * - Focus management automatique entre les slots.
 * - Rendu dynamique basé sur une configuration de groupes ou une longueur fixe.
 * - Design système aligné sur Shadcn UI avec dimensions augmentées.
 *
 * @example
 * ```tsx
 * <OtpInput
 * value={value}
 * onChange={setValue}
 * groups={[3, 3]}
 * error={hasError}
 * />
 * ```
 */
export const OtpInput = React.forwardRef<HTMLDivElement, OtpInputProps>(
  (
    { value, onChange, length = 6, groups, disabled = false, error = false, className, id },
    ref: React.ForwardedRef<HTMLDivElement>
  ) => {
    /**
     * Calcule la longueur totale attendue.
     * Priorise la somme des groupes si définis, sinon utilise la prop length.
     */
    const totalLength = React.useMemo(() => {
      if (groups && groups.length > 0) {
        return groups.reduce((acc, curr) => acc + curr, 0);
      }
      return length;
    }, [groups, length]);

    /**
     * Génère dynamiquement les slots et séparateurs.
     * La taille des cases est fixée via `h-14 w-12` (plus grand que le défaut)
     * et la typographie est augmentée pour une meilleure lisibilité.
     */
    const renderContent = React.useMemo(() => {
      const slotBaseClassName = cn(
        'h-14 w-12 text-lg font-bold transition-all border-y border-r first:border-l first:rounded-l-md last:rounded-r-md',
        error && 'border-destructive text-destructive ring-destructive/20 z-10'
      );

      // Cas 1 : Rendu simple sans groupes (un seul bloc continu)
      if (!groups || groups.length === 0) {
        return (
          <InputOTPGroup className="gap-0">
            {Array.from({ length: totalLength }).map((_, idx) => (
              <InputOTPSlot key={idx} index={idx} className={slotBaseClassName} />
            ))}
          </InputOTPGroup>
        );
      }

      // Cas 2 : Rendu segmenté par groupes
      const elements: React.ReactNode[] = [];
      let currentGlobalIndex = 0;

      groups.forEach((groupSize, groupIdx) => {
        const slots = Array.from({ length: groupSize }).map((_, slotIdx) => {
          const index = currentGlobalIndex + slotIdx;
          return (
            <InputOTPSlot
              key={index}
              index={index}
              className={cn(
                slotBaseClassName,
                // On réajuste les arrondis pour les groupes séparés
                'first:border-l rounded-none first:rounded-l-md last:rounded-r-md'
              )}
            />
          );
        });

        elements.push(
          <InputOTPGroup key={`group-${groupIdx}`} className="gap-0">
            {slots}
          </InputOTPGroup>
        );

        // Ajout du séparateur visuel entre les groupes
        if (groupIdx < groups.length - 1) {
          elements.push(
            <InputOTPSeparator
              key={`sep-${groupIdx}`}
              className={cn('mx-1 scale-150', error ? 'text-destructive' : 'text-muted-foreground')}
            />
          );
        }

        currentGlobalIndex += groupSize;
      });

      return elements;
    }, [groups, totalLength, error]);

    return (
      <div ref={ref} className={cn('flex flex-col items-center justify-center gap-4', className)}>
        <InputOTP
          id={id}
          maxLength={totalLength}
          value={value}
          onChange={onChange}
          disabled={disabled}
          containerClassName={cn(
            'group flex items-center has-[:disabled]:opacity-50',
            disabled && 'cursor-not-allowed'
          )}
        >
          <div className="flex items-center gap-3">{renderContent}</div>
        </InputOTP>
      </div>
    );
  }
);

OtpInput.displayName = 'OtpInput';
