/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * @module components/forms/EmailInput
 * @description 📧 Champ de saisie d'email avec icône, séparateur et validation visuelle.
 * @example
 * ```tsx
 * const [email, setEmail] = useState('');
 * <EmailInput
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   placeholder="exemple@ Auto-École COS.com"
 *   error={!!errors.email}
 * />
 * ```
 */

import { forwardRef } from 'react';
import { Mail } from 'lucide-react';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface EmailInputProps extends Omit<
  React.ComponentProps<typeof InputGroupInput>,
  'onChange'
> {
  /** 📧 Valeur du champ email */
  value: string;
  /** 🔄 Callback de changement */
  onChange: (e: React.ChangeEvent<HTMLInputElement> | React.SetStateAction<any>) => void;
  /** 🎨 Classes additionnelles */
  className?: string;
  /** 💡 Placeholder (par défaut : "exemple@ Auto-École COS.com") */
  placeholder?: string;
  /** 🚫 Désactiver le champ */
  disabled?: boolean;
  /** ❌ Afficher une erreur (style visuel) */
  error?: boolean;
}

/**
 * Champ email premium avec icône et séparateur.
 * Hauteur fixe `h-10` pour un alignement cohérent avec les autres champs.
 */
export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  (
    {
      className,
      placeholder = 'exemple@ Auto-École COS.com',
      disabled = false,
      error = false,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        <InputGroup
          className="h-12 group focus-within:ring-2 focus-within:ring-primary/20 rounded-md border bg-background transition-all overflow-hidden"
          data-invalid={error}
        >
          {/* Icône Mail à gauche */}
          <InputGroupAddon align="inline-start" className="px-3">
            <Mail className="size-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
          </InputGroupAddon>

          {/* Séparateur vertical */}
          <Separator orientation="vertical" className="h-full" />

          {/* Champ de saisie */}
          <InputGroupInput
            ref={ref}
            type="email"
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={error}
            id="email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            className="flex-1"
            {...props}
          />
        </InputGroup>
      </div>
    );
  }
);

EmailInput.displayName = 'EmailInput';
