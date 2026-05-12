// src/features/dashboard/components/moniteurs/MoniteurWelcomeHeader.tsx

/**
 * @module dashboard/components/moniteurs/MoniteurWelcomeHeader
 * @description
 * En-tête de bienvenue spécialisé pour le tableau de bord du moniteur (instructeur).
 * Compose `WelcomeHeader` avec les actions et le message contextuel propres
 * aux tâches d’un moniteur dans l’auto‑école COS.
 *
 * ## Actions disponibles (toutes optionnelles via callbacks)
 * - **Mon planning** (bouton principal) – affichage du planning du moniteur
 * - **Mes candidats** (outline) – liste des candidats suivis
 * - **Mes leçons** (outline) – liste des leçons à venir / effectuées
 * - **Examens** (outline) – résultats des examens de ses candidats
 * - **Mon profil** (outline) – informations personnelles
 * - **Aide** (outline) – support
 *
 * ## Message contextuel dynamique
 * - Nombre de leçons du jour pour ce moniteur
 * - Progression de ses candidats (heures effectuées)
 * - Examens à venir de ses candidats
 *
 * ## Alertes dans la HoverCard
 * - Absence non justifiée (si applicable)
 * - Candidat ayant besoin d’une attention particulière
 * - Remarque administrative
 *
 * ## Métriques affichées dans la HoverCard
 * - Leçons du mois
 * - Taux de réussite de ses candidats
 * - Heures de conduite cumulées
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * <MoniteurWelcomeHeader
 *   moniteurName="Marc Dubois"
 *   moniteurTitle="Moniteur principal – Permis B"
 *   avatarUrl="/avatars/moniteur.jpg"
 *   lessonsToday={3}
 *   candidatsCount={12}
 *   pendingExams={2}
 *   onManagePlanning={() => navigate('/planning/moniteur/123')}
 *   onManageCandidats={() => navigate('/candidats?moniteur=123')}
 *   onManageLessons={() => navigate('/planning?moniteur=123')}
 *   onManageExamens={() => navigate('/examens?moniteur=123')}
 *   onProfile={() => navigate('/profile')}
 *   onHelp={() => navigate('/help')}
 * />
 * ```
 */

import { Calendar, Users, ClipboardCheck, FileCheck, User, HelpCircle } from 'lucide-react';
import {
  WelcomeHeader,
  type WelcomeAction,
  type ContextSegment,
} from '../common/WelcomeHeader';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface MoniteurWelcomeHeaderProps {
  // ── Identité ─────────────────────────────────────────────
  /** Nom complet du moniteur */
  moniteurName: string;
  /** Titre / spécialité (défaut : "Moniteur") */
  moniteurTitle?: string;
  /** URL de l'avatar */
  avatarUrl?: string;
  /** Initiales de secours */
  avatarFallback?: string;

  // ── Greeting ──────────────────────────────────────────────
  /** Message de salutation personnalisé (sinon automatique) */
  greetingMessage?: string;
  /** Dernière connexion (pour "Bon retour") */
  lastLoginAt?: Date;

  // ── Métriques et badges ────────────────────────────────────
  /** Nombre de leçons planifiées pour ce moniteur aujourd’hui */
  lessonsToday?: number;
  /** Nombre de candidats suivis par ce moniteur */
  candidatsCount?: number;
  /** Nombre d’examens à venir (ou résultat en attente) pour ses candidats */
  pendingExams?: number;
  /** Nombre de leçons non effectuées / absences récentes (optionnel) */
  missedLessons?: number;

  // ── Métriques pour le message contextuel ───────────────────
  /** Heures de conduite effectuées ce mois (cumul) */
  totalHoursThisMonth?: number;
  /** Taux de réussite de ses candidats (en %) */
  successRate?: number;
  /** Prochaine évaluation/contrôle à faire (date en string) */
  nextEvaluation?: string;

  // ── Événements récents (optionnel) ────────────────────────
  recentActivity?: string;

  // ── Callbacks ─────────────────────────────────────────────
  /** Gérer le planning (planning personnel) */
  onManagePlanning?: () => void;
  /** Gérer les candidats (suivi) */
  onManageCandidats?: () => void;
  /** Gérer ses leçons */
  onManageLessons?: () => void;
  /** Gérer les examens de ses candidats */
  onManageExamens?: () => void;
  /** Accéder au profil */
  onProfile?: () => void;
  /** Accéder à l’aide / support */
  onHelp?: () => void;

  // ── Style ────────────────────────────────────────────────
  /** Afficher la date dans la HoverCard (défaut : true) */
  showDate?: boolean;
  /** Classes CSS additionnelles */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Construit le message contextuel dynamique pour le moniteur.
 * @internal
 */
function buildContextMessage(
  lessonsToday: number,
  candidatsCount: number,
  pendingExams: number,
  missedLessons: number
): ContextSegment[] {
  const segments: ContextSegment[] = [];

  if (lessonsToday > 0) {
    segments.push({ text: 'Aujourd’hui, ' });
    segments.push({
      text: `${lessonsToday} leçon${lessonsToday > 1 ? 's' : ''}`,
      highlight: true,
    });
    segments.push({ text: ' vous attendent.' });
  } else {
    segments.push({ text: 'Aucune leçon prévue aujourd’hui. ' });
  }

  if (candidatsCount > 0) {
    segments.push({ text: ' Vous suivez ' });
    segments.push({
      text: `${candidatsCount} candidat${candidatsCount > 1 ? 's' : ''}`,
      highlight: true,
    });
    segments.push({ text: ' actuellement.' });
  }

  if (pendingExams > 0) {
    segments.push({ text: ' ' });
    segments.push({
      text: `${pendingExams} examen${pendingExams > 1 ? 's' : ''} à venir`,
      highlight: true,
    });
    segments.push({ text: ' pour vos candidats.' });
  }

  if (missedLessons > 0) {
    segments.push({ text: ' ' });
    segments.push({
      text: `${missedLessons} leçon${missedLessons > 1 ? 's' : ''} non effectuée${missedLessons > 1 ? 's' : ''}`,
      highlight: true,
    });
    segments.push({ text: ' (absences récentes).' });
  }

  return segments;
}




// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * En-tête de bienvenue du tableau de bord du moniteur.
 * Utilise les couleurs bleues (primary) et affiche des métriques
 * et actions adaptées à l’activité d’instructeur.
 */
export function MoniteurWelcomeHeader({
  moniteurName,
  moniteurTitle = 'Moniteur',
  avatarUrl,
  avatarFallback,
  greetingMessage,
  lastLoginAt,
  lessonsToday = 0,
  candidatsCount = 0,
  pendingExams = 0,
  missedLessons = 0,
  totalHoursThisMonth,
  successRate,
  nextEvaluation,
  onManagePlanning,
  onManageCandidats,
  onManageLessons,
  onManageExamens,
  onProfile,
  onHelp,
  showDate = true,
  className,
}: MoniteurWelcomeHeaderProps): React.JSX.Element {
  // ── Actions principales (boutons) ─────────────────────────
  const mainActions: WelcomeAction[] = [];

  if (onManagePlanning) {
    mainActions.push({
      label: 'Mon planning',
      icon: Calendar,
      onClick: onManagePlanning,
      variant: 'default',
      badge: lessonsToday > 0 ? lessonsToday : undefined,
    });
  }

  if (onManageCandidats) {
    mainActions.push({
      label: 'Mes candidats',
      icon: Users,
      onClick: onManageCandidats,
      variant: 'outline',
    });
  }

  if (onManageLessons) {
    mainActions.push({
      label: 'Mes leçons',
      icon: ClipboardCheck,
      onClick: onManageLessons,
      variant: 'outline',
    });
  }

  if (onManageExamens) {
    mainActions.push({
      label: 'Examens',
      icon: FileCheck,
      onClick: onManageExamens,
      variant: 'outline',
    });
  }

  if (onProfile) {
    mainActions.push({
      label: 'Mon profil',
      icon: User,
      onClick: onProfile,
      variant: 'outline',
    });
  }

  if (onHelp) {
    mainActions.push({
      label: 'Aide',
      icon: HelpCircle,
      onClick: onHelp,
      variant: 'outline',
    });
  }

  // ── Message contextuel ────────────────────────────────────
  const contextMessage = buildContextMessage(
    lessonsToday,
    candidatsCount,
    pendingExams,
    missedLessons
  );


  // ── Élément additionnel (extra) affichant quelques métriques ──
  const extraContent = (totalHoursThisMonth !== undefined || successRate !== undefined) && (
    <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
      {totalHoursThisMonth !== undefined && (
        <span className="flex items-center gap-1">
          <ClipboardCheck className="h-3 w-3" />
          {totalHoursThisMonth} heures ce mois
        </span>
      )}
      {successRate !== undefined && (
        <span className="flex items-center gap-1">
          <FileCheck className="h-3 w-3" />
          {successRate}% réussite
        </span>
      )}
      {nextEvaluation !== undefined && (
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Évaluation: {nextEvaluation}
        </span>
      )}
    </div>
  );

  return (
    <WelcomeHeader
      userName={moniteurName}
      Role={'MONITEUR'}
      subtitle={moniteurTitle}
      avatarUrl={avatarUrl}
      avatarFallback={avatarFallback}
      greetingMessage={greetingMessage}
      lastLoginAt={lastLoginAt}
      showDate={showDate}
      contextMessage={contextMessage.length > 0 ? contextMessage : undefined}
      mainActions={mainActions}
      className={cn('rounded-xs border border-border/60 shadow-xs', className)}
      extra={extraContent}
    />
  );
}
