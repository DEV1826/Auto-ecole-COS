'use client';

/**
 * @module features/profile/components/ProfileSidebar
 * @description
 * Barre latérale de navigation pour le profil utilisateur.
 * Supporte désormais des sous-menus déroulants (accordéon) avec un seul menu ouvert à la fois.
 *
 * ## Fonctionnalités
 * - Affichage vertical des sections avec icônes et libellés
 * - Indicateur de section active (fond émeraude)
 * - Sous-sections (nested) avec animation d'ouverture/fermeture
 * - Un seul sous-menu ouvert à la fois
 * - Support des sections simples (sans enfants) et des sections parentes
 * - Badges optionnels
 * - Accessible (rôles ARIA, focus)
 *
 * @author Stive Junior
 * @version 3.0.0
 *
 * @example
 * ```tsx
 * const sections: SidebarSection[] = [
 *   { id: 'profile', label: 'Profil', icon: <User /> },
 *   {
 *     id: 'settings',
 *     label: 'Paramètres',
 *     icon: <Settings />,
 *     children: [
 *       { id: 'security', label: 'Sécurité', icon: <Shield /> },
 *       { id: 'notifications', label: 'Notifications', icon: <Bell /> },
 *     ]
 *   }
 * ];
 *
 * <ProfileSidebar
 *   sections={sections}
 *   activeSection="profile"
 *   onSectionChange={setActiveSection}
 * />
 * ```
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Définition d'une section de navigation (simple ou avec sous-sections).
 */
export interface SidebarSection {
  /** Identifiant unique de la section */
  id: string;
  /** Libellé affiché */
  label: string;
  /** Icône (composant Lucide) */
  icon: React.ReactNode;
  /** Désactiver la section (grisée, non cliquable) */
  disabled?: boolean;
  /** Afficher un badge (nombre ou texte) */
  badge?: string | number;
  /** Sous-sections (menu déroulant). Si présent, la section devient un accordéon. */
  children?: Omit<SidebarSection, 'children'>[];
}

/**
 * Props du composant ProfileSidebar.
 */
export interface ProfileSidebarProps {
  /** Liste des sections à afficher (peuvent contenir des enfants) */
  sections: SidebarSection[];
  /** Identifiant de la section actuellement active (ou d'un sous-élément) */
  activeSection: string;
  /** Callback déclenché lors du changement de section (reçoit l'id de la section ou sous-section) */
  onSectionChange: (sectionId: string) => void;
  /** Afficher un séparateur avant la section 'danger' */
  showDangerSeparator?: boolean;
  /** Classes CSS additionnelles */
  className?: string;
  /** Taille des boutons : 'sm', 'default', 'lg' (défaut : 'lg') */
  size?: 'sm' | 'default' | 'lg';
}

/**
 * Tailles personnalisées pour les boutons et les icônes.
 */
const sizeClasses = {
  sm: {
    button: 'h-8 text-xs px-2',
    icon: 'size-3.5',
    childButton: 'h-7 text-xs pl-8',
  },
  default: {
    button: 'h-10 text-sm px-3',
    icon: 'size-4',
    childButton: 'h-9 text-sm pl-8',
  },
  lg: {
    button: 'h-12 text-base px-4',
    icon: 'size-5',
    childButton: 'h-10 text-sm pl-8',
  },
};

/**
 * Rendu récursif d'une section (avec ou sans enfants).
 */
function SectionItem({
  section,
  activeSection,
  onSectionChange,
  styles,
}: {
  section: SidebarSection;
  activeSection: string;
  onSectionChange: (id: string) => void;
  styles: typeof sizeClasses.sm;
  level?: number;
}): React.JSX.Element {
  const hasChildren = section.children && section.children.length > 0;

  const [isOpen, setIsOpen] = React.useState<boolean>(() => {
    return hasChildren && section.children?.some((child) => child.id === activeSection)
      ? true
      : false;
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) setIsOpen(!isOpen);
  };

  const handleClick = () => {
    if (!hasChildren && !section.disabled) {
      onSectionChange(section.id);
    } else if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };

  const isActive = activeSection === section.id;

  return (
    <div className="flex flex-col">
      {/* Bouton principal */}
      <Button
        variant="ghost"
        className={cn(
          'w-full justify-start gap-3 font-normal  rounded-lg ',
          styles.button,
          isActive
            ? 'bg-emerald-800 text-white! dark:bg-emerald-750 dark:text-emerald-400 hover:bg-emerald-800 dark:hover:bg-emerald-800'
            : 'text-muted-foreground hover:bg-muted',
          section.disabled && 'pointer-events-none opacity-50'
        )}
        onClick={handleClick}
        disabled={section.disabled}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className={cn('shrink-0', styles.icon)}>{section.icon}</span>
        <span className="flex-1 text-left">{section.label}</span>
        {section.badge && (
          <span className="ml-auto text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
            {section.badge}
          </span>
        )}
        {hasChildren && (
          <span className="ml-auto" onClick={handleToggle}>
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
        )}
      </Button>

      {/* Sous-sections (animation d'accordéon) */}
      {hasChildren && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-1 mt-1 ml-2 px-1 border-l border-border/50">
                {section.children!.map((child) => (
                  <Button
                    key={child.id}
                    variant="ghost"
                    className={cn(
                      'w-full justify-start gap-3 font-normal transition-all duration-200 rounded-lg',
                      styles.childButton,
                      activeSection === child.id
                        ? 'bg-emerald-800 text-white! dark:bg-emerald-700 dark:text-emerald-400 hover:bg-emerald-800 dark:hover:bg-emerald-900/50'
                        : 'text-muted-foreground hover:bg-muted'
                    )}
                    onClick={() => onSectionChange(child.id)}
                    disabled={child.disabled}
                    aria-current={activeSection === child.id ? 'page' : undefined}
                  >
                    <span className={cn('shrink-0', styles.icon)}>{child.icon}</span>
                    <span className="flex-1 text-left">{child.label}</span>
                    {child.badge && (
                      <span className="ml-auto text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
                        {child.badge}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

/**
 * Barre latérale de navigation avec support des sous-menus (accordéon).
 */
export function ProfileSidebar({
  sections,
  activeSection,
  onSectionChange,
  showDangerSeparator = false,
  className,
  size = 'lg',
}: ProfileSidebarProps): React.JSX.Element {
  // Trouver l'index de la section "danger" si elle existe
  const dangerIndex = sections.findIndex((s) => s.id === 'danger');
  const normalSections = dangerIndex !== -1 ? sections.slice(0, dangerIndex) : sections;
  const dangerSection = dangerIndex !== -1 ? sections[dangerIndex] : null;

  const styles = sizeClasses[size];

  return (
    <div className={cn('flex h-full flex-col bg-card rounded-xl py-2', className)}>
      <ScrollArea className="flex-1 px-2 py-0">
        <nav className="flex flex-col gap-1.5 " aria-label="Sections du profil">
          {normalSections.map((section) => (
            <SectionItem
              key={section.id}
              section={section}
              activeSection={activeSection}
              onSectionChange={onSectionChange}
              styles={styles}
            />
          ))}
        </nav>

        {dangerSection && showDangerSeparator && (
          <>
            <nav
              className="flex flex-col gap-1.5 mr-2 "
              title="Section dangereuse"
              aria-label="Section dangereuse"
            >
              <SectionItem
                section={dangerSection}
                activeSection={activeSection}
                onSectionChange={onSectionChange}
                styles={styles}
              />
            </nav>
          </>
        )}
      </ScrollArea>
    </div>
  );
}
