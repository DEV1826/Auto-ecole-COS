'use client';

/**
 * @module features/profile/components/ProfilePreferences
 * @description
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import * as React from 'react';
import { Lightbulb } from 'lucide-react';
import { ProfileInfoRow } from './ProfileInfoRow';

import { ThemeToggle } from '@/components/theme';

// ─────────────────────────────────────────────────────────────────────────────
// 1. NotificationPreferencesView
// ─────────────────────────────────────────────────────────────────────────────

export interface NotificationPreferencesViewProps {
  /** État de chargement */
  isLoading?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. DisplayPreferencesView
// ─────────────────────────────────────────────────────────────────────────────

export interface DisplayPreferencesViewProps {
  isLoading?: boolean;
}

/**
 * Affiche les préférences d'affichage (thème, taille de police).
 */
export function DisplayPreferencesView(): React.JSX.Element {
  return (
    <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
      <ProfileInfoRow label="Thème" icon={Lightbulb}>
        <ThemeToggle
          variant="dropdown"
          text="Système"
          showText
          className="gap-2 bg-transparent shadow-none hover:bg-transparent border-none mt-2"
        />
      </ProfileInfoRow>
    </div>
  );
}
