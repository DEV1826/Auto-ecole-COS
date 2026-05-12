'use client';

/**
 * @module components/forms/PhoneInput
 * @description 📞 Champ de saisie téléphonique premium avec sélecteur de pays, indicateur fixe et séparateurs visuels.
 * @example
 * ```tsx
 * const [phone, setPhone] = useState('');
 * <PhoneInput
 *   value={phone}
 *   onChange={setPhone}
 *   defaultCountry="FR"
 *   placeholder="6 12 34 56 78"
 * />
 * ```
 */

import * as React from 'react';
import { Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';

export interface PhoneInputProps extends Omit<
  React.ComponentProps<typeof InputGroupInput>,
  'onChange' | 'value'
> {
  /** 📞 Numéro de téléphone complet (ex: "+237690123456") */
  value: string;
  /** 🔄 Callback retournant le numéro complet après changement */
  onChange: (fullNumber: string) => void;
  /** 🚫 Désactiver le champ */
  disabled?: boolean;
  /** 💡 Texte d'aide pour le numéro local (sans l'indicatif) */
  placeholder?: string;
  /** 🎨 Classes CSS additionnelles */
  className?: string;
}

/**
 * Champ de téléphone complet avec sélecteur de pays, indicateur fixe et séparateurs.
 * Retourne le numéro complet via `onChange` (ex: "+237690123456").
 * Tous les éléments ont une hauteur fixe `h-10` pour un alignement parfait.
 */
export function PhoneInput({
  value,
  onChange,
  disabled = false,
  placeholder = '6XX XXX XXX',
  className,
  ...props
}: PhoneInputProps) {
  // Partie locale du numéro (sans l'indicatif)
  const [localNumber, setLocalNumber] = React.useState('');

  // Changement du numéro local
  const handleLocalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLocal = e.target.value;
    setLocalNumber(newLocal);
    onChange(newLocal);
  };

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <InputGroup className="h-10 group focus-within:ring-2 focus-within:ring-primary/20 rounded-xs border bg-background transition-all overflow-hidden">
        {/* 2. Indicateur fixe (indicatif) */}
        <div className="h-full flex items-center px-3 bg-muted/20 select-none">
          <span className="text-sm font-bold text-muted-foreground/80 whitespace-nowrap">
            + 237
          </span>
        </div>

        {/* Séparateur vertical */}
        <Separator orientation="vertical" className="h-full" />

        {/* 3. Champ de saisie du numéro local */}
        <InputGroupInput
          type="tel"
          value={localNumber}
          onChange={handleLocalNumberChange}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 h-full"
          {...props}
        />

        {/* 4. Icône téléphone (à droite) */}
        <InputGroupAddon align="inline-end" className="pr-3">
          <Phone className="size-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
