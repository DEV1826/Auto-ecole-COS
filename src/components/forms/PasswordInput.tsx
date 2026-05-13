/**
 * @module components/forms/PasswordInput
 * @description 🔐 Champ de saisie de mot de passe sécurisé avec bascule de visibilité et séparateurs.
 */

import * as React from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InputGroup } from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';

/**
 * Interface des propriétés du PasswordInput.
 */
export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** 🔑 Valeur actuelle du mot de passe */
  value: string;
  /** 🔄 Callback de changement de valeur */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** 🎨 Classes CSS additionnelles pour le conteneur */
  className?: string;
  /** 💡 Texte d'aide (par défaut : "••••••••") */
  placeholder?: string;
  /** 🚫 État désactivé du champ */
  disabled?: boolean;
}

/**
 * PasswordInput - Composant de saisie de mot de passe avec "Eye Toggle".
 * * @description
 * - Hauteur fixe `h-10` pour s'aligner avec le reste du formulaire.
 * - Utilise `Separator` pour une structure visuelle nette.
 * - Gestion native de l'accessibilité (Aria-labels).
 *
 * @example
 * ```tsx
 * <PasswordInput
 * value={password}
 * onChange={(e) => setPassword(e.target.value)}
 * placeholder="Votre mot de passe secret"
 * />
 * ```
 */
export function PasswordInput({
  className,
  placeholder = '••••••••',
  disabled = false,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  /**
   * Bascule l'affichage du texte en clair ou masqué
   */
  const toggleVisibility = () => {
    if (!disabled) setShowPassword((prev) => !prev);
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <InputGroup className="h-10 flex items-center group focus-within:ring-2 focus-within:ring-primary/20 rounded-md border bg-background transition-all overflow-hidden">
        {/* 1. SECTION : ICÔNE DE VERROUILLAGE */}
        <div className="h-full flex items-center px-3 select-none">
          <Lock className="size-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
        </div>

        {/* SÉPARATEUR GAUCHE */}
        <Separator orientation="vertical" className="h-full" />

        {/* 2. SECTION : CHAMP DE SAISIE */}
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          disabled={disabled}
          className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground/50 disabled:cursor-not-allowed"
          {...props}
        />

        {/* SÉPARATEUR DROIT */}
        <Separator orientation="vertical" className="h-full" />

        {/* 3. SECTION : BOUTON TOGGLE (EYE) */}
        <div className="h-full flex items-center">
          <button
            type="button"
            onClick={toggleVisibility}
            disabled={disabled}
            className="h-full px-3 flex items-center justify-center text-muted-foreground/60 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed outline-none"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? (
              <EyeOff size={18} className="shrink-0" />
            ) : (
              <Eye size={18} className="shrink-0" />
            )}
          </button>
        </div>
      </InputGroup>
    </div>
  );
}
