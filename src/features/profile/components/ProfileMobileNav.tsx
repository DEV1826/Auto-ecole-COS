'use client';

/**
 * @module features/profile/components/ProfileMobileNav
 * @description
 * Navigation mobile pour le profil utilisateur.
 * Supporte les sous‑menus (sections avec `children`) :
 * - Cliquer sur une section parente affiche ses enfants et sélectionne le premier enfant automatiquement.
 * - Un bouton retour permet de remonter d'un niveau.
 * - Utilise des Tabs scrollables horizontalement avec indicateur de section active (soulignement/fond).
 * - Pas de curseur animé pour garantir une taille et un affichage cohérents sur tous les écrans.
 *
 * @author Stive Junior
 * @version 3.0.0
 */

import * as React from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { SidebarSection } from './ProfileSidebar';

export interface ProfileMobileNavProps {
  /** Liste des sections à afficher (peuvent contenir des `children`) */
  sections: SidebarSection[];
  /** Section actuellement active (feuille ou parent) */
  activeSection: string;
  /** Callback de changement de section (reçoit l'id de la section sélectionnée) */
  onSectionChange: (sectionId: string) => void;
  /** Classes additionnelles */
  className?: string;
}

/**
 * Navigation mobile avec support des sous‑niveaux.
 */
export function ProfileMobileNav({
  sections,
  activeSection,
  onSectionChange,
  className,
}: ProfileMobileNavProps): React.JSX.Element {
  // Pile des niveaux : chaque élément est la section parente courante
  const [levelStack, setLevelStack] = React.useState<SidebarSection[]>([]);
  const currentParent = levelStack.length > 0 ? levelStack[levelStack.length - 1] : null;

  // Liste des sections à afficher au niveau courant
  const currentSections = React.useMemo(() => {
    if (currentParent?.children && currentParent.children.length > 0) {
      return currentParent.children;
    }
    return sections;
  }, [sections, currentParent]);

  // Gestion du clic sur une section
  const handleSectionClick = (section: SidebarSection) => {
    if (section.children && section.children.length > 0) {
      // Parent : on empile et on sélectionne le premier enfant
      setLevelStack((prev) => [...prev, section]);
      const firstChild = section.children[0];
      if (firstChild) {
        onSectionChange(firstChild.id);
      } else {
        // Au cas où il n'y a pas d'enfant (ne devrait pas arriver)
        onSectionChange(section.id);
      }
    } else {
      // Feuille : on notifie simplement
      onSectionChange(section.id);
    }
  };

  // Retour au niveau supérieur
  const goBack = () => {
    if (levelStack.length === 0) return;
    const newStack = [...levelStack];
    newStack.pop();
    setLevelStack(newStack);
    const newParent = newStack.length > 0 ? newStack[newStack.length - 1] : null;
    if (newParent) {
      // On revient au parent : on peut sélectionner le parent lui-même ou le premier enfant ?
      // Pour éviter un écran vide, on sélectionne le premier enfant du parent (ou le parent si pas d'enfant)
      if (newParent.children && newParent.children.length > 0) {
        onSectionChange(newParent.children[0].id);
      } else {
        onSectionChange(newParent.id);
      }
    } else {
      // Retour à la racine : on sélectionne la première section racine (ou la précédente active ?)
      // On choisit de sélectionner la première section racine pour garantir un affichage
      if (sections.length > 0) {
        const firstRoot = sections[0];
        if (firstRoot.children && firstRoot.children.length > 0) {
          onSectionChange(firstRoot.children[0].id);
        } else {
          onSectionChange(firstRoot.id);
        }
      }
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* En-tête avec bouton retour (si niveau > 0) */}
      {levelStack.length > 0 && (
        <div className="flex items-center gap-2 px-2 pb-2">
          <Button variant="ghost" size="sm" onClick={goBack} className="h-8 w-8 p-0 rounded-full">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            {levelStack[levelStack.length - 1]?.label}
          </span>
        </div>
      )}

      {/* Navigation scrollable (Tabs) */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="relative inline-flex p-1 bg-muted/50 gap-3 rounded-full">
          {currentSections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleSectionClick(section)}
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ',
                'whitespace-nowrap',
                activeSection === section.id
                  ? 'bg-blue-800 text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span className="shrink-0">{section.icon}</span>
              <span>{section.label}</span>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>
    </div>
  );
}
