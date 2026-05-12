'use client';

import { Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface Language {
  code: string;
  name: string;
  flag?: string;
  nativeName?: string;
}

export interface LanguageSwitcherProps {
  /** Langue actuelle */
  currentLanguage: string;
  /** Liste des langues disponibles */
  languages?: Language[];
  /** Fonction appelée lors du changement de langue */
  onLanguageChange: (langCode: string) => void;
  /** Variante d'affichage : 'icon' | 'button' | 'dropdown' */
  variant?: 'icon' | 'button' | 'dropdown';
  /** Taille du bouton (si variant='button') */
  size?: 'default' | 'sm' | 'lg';
  /** Afficher le nom complet de la langue */
  showFullName?: boolean;
  /** Classes additionnelles */
  className?: string;
}

const defaultLanguages: Language[] = [
  { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', nativeName: 'العربية' },
];

/**
 * Composant de sélecteur de langue, peut être utilisé comme icône ou bouton.
 *
 * @example
 * ```tsx
 * <LanguageSwitcher
 *   currentLanguage="fr"
 *   languages={languages}
 *   onLanguageChange={setLanguage}
 *   variant="button"
 *   showFullName
 * />
 * ```
 */
export function LanguageSwitcher({
  currentLanguage,
  languages = defaultLanguages,
  onLanguageChange,
  variant = 'icon',
  size = 'default',
  showFullName = false,
  className,
}: LanguageSwitcherProps) {
  const current = languages.find((lang) => lang.code === currentLanguage) || languages[0];

  // Variante : icône simple
  if (variant === 'icon') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={cn('h-8 w-8', className)}>
            <Globe className="size-4" />
            <span className="sr-only">Changer de langue</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => onLanguageChange(lang.code)}
              className={cn(currentLanguage === lang.code && 'bg-accent text-accent-foreground')}
            >
              <span className="mr-2">{lang.flag}</span>
              {showFullName ? lang.name : lang.nativeName || lang.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Variante : bouton avec texte
  if (variant === 'button') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={size} className={cn('gap-2', className)}>
            <Globe className="size-4" />
            <span>{showFullName ? current.name : current.nativeName || current.name}</span>
            <ChevronDown className="size-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => onLanguageChange(lang.code)}
              className={cn(currentLanguage === lang.code && 'bg-accent text-accent-foreground')}
            >
              <span className="mr-2">{lang.flag}</span>
              {showFullName ? lang.name : lang.nativeName || lang.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Variante : dropdown directement (plus compact)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn('gap-1', className)}>
          {current.flag && <span className="text-base leading-none">{current.flag}</span>}
          <ChevronDown className="size-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            className={cn(currentLanguage === lang.code && 'bg-accent text-accent-foreground')}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
