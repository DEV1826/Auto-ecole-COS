// src/features/dashboard/components/secretaire/SecretaireWelcomeHeader.tsx

/**
 * @module dashboard/components/secretaire/SecretaireWelcomeHeader
 * @description
 * En-tête de bienvenue spécialisé pour le tableau de bord du secrétaire.
 * Compose `WelcomeHeader` avec les actions et le message contextuel propres
 * aux tâches du secrétaire dans l’auto‑école COS.
 *
 * ## Actions disponibles (toutes optionnelles via callbacks)
 * - **Planning** (bouton principal) – gestion des leçons du jour
 * - **Candidats** (outline) – liste des candidats
 * - **Paiements** (outline) – encaissements du jour
 * - **Examens** (outline) – inscriptions aux examens
 * - **Factures** (outline) – édition / suivi
 * - **Rapports** (outline) – exports et statistiques
 *
 * ## Message contextuel dynamique
 * - Nombre de leçons planifiées aujourd’hui
 * - Nombre de paiements attendus
 * - Candidats à contacter (relances)
 *
 * ## Alertes dans la HoverCard
 * - Leçons non confirmées → warning
 * - Paiements en retard → error
 * - Examens à programmer → info
 *
 * ## Métriques affichées dans la HoverCard
 * - Leçons du jour (avec détail)
 * - Encaissements du jour
 * - Rendez-vous de la semaine
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * <SecretaireWelcomeHeader
 *   secretaireName="Marie Ndiaye"
 *   secretaireTitle="Secrétaire principale"
 *   avatarUrl="/avatars/secretaire.jpg"
 *   lessonsToday={4}
 *   pendingPayments={2}
 *   pendingExams={3}
 *   unconfirmedLessons={1}
 *   onManagePlanning={() => navigate('/planning')}
 *   onManageCandidats={() => navigate('/candidats')}
 *   onManagePayments={() => navigate('/paiements')}
 *   onManageExamens={() => navigate('/examens')}
 *   onManageFactures={() => navigate('/factures')}
 *   onManageRapports={() => navigate('/rapports')}
 * />
 * ```
 */

import { Calendar, Users, CreditCard, FileText, BarChart3 } from 'lucide-react';
import { WelcomeHeader, type WelcomeAction, type ContextSegment } from '../common/WelcomeHeader';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SecretaireWelcomeHeaderProps {
  // ── Identité ─────────────────────────────────────────────
  /** Nom complet du secrétaire */
  secretaireName: string;
  /** Titre / fonction (défaut : "Secrétaire") */
  secretaireTitle?: string;
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
  /** Nombre de leçons planifiées aujourd’hui */
  lessonsToday?: number;
  /** Nombre de paiements en attente / attendus aujourd’hui */
  pendingPayments?: number;
  /** Nombre d’examens à programmer */
  pendingExams?: number;
  /** Nombre de leçons non confirmées par les moniteurs */
  unconfirmedLessons?: number;

  // ── Métriques pour le message contextuel ───────────────────
  /** Nombre de leçons effectuées cette semaine */
  lessonsThisWeek?: number;
  /** Total encaissé aujourd’hui (FCFA) */
  revenueToday?: number;
  /** Nombre de relances à effectuer (candidats en retard) */
  remindersCount?: number;

  // ── Événements récents (optionnel) ────────────────────────
  recentActivity?: string;

  // ── Callbacks ─────────────────────────────────────────────
  /** Gérer le planning (leçons) */
  onManagePlanning?: () => void;
  /** Gérer les candidats */
  onManageCandidats?: () => void;
  /** Gérer les paiements */
  onManagePayments?: () => void;
  /** Gérer les factures */
  onManageFactures?: () => void;
  /** Gérer les rapports / exports */
  onManageRapports?: () => void;

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
 * Construit le message contextuel dynamique pour le secrétaire.
 * @internal
 */
function buildContextMessage(
  lessonsToday: number,
  pendingPayments: number,
  pendingExams: number,
  unconfirmedLessons: number
): ContextSegment[] {
  const segments: ContextSegment[] = [];

  if (lessonsToday > 0) {
    segments.push({ text: 'Aujourd’hui, ' });
    segments.push({
      text: `${lessonsToday} leçon${lessonsToday > 1 ? 's' : ''}`,
      highlight: true,
    });
    segments.push({ text: ' sont programmées.' });
  } else {
    segments.push({ text: 'Aucune leçon prévue aujourd’hui.' });
  }

  if (pendingPayments > 0) {
    segments.push({ text: ' ' });
    segments.push({
      text: `${pendingPayments} paiement${pendingPayments > 1 ? 's' : ''} en attente.`,
      highlight: true,
    });
  }

  if (pendingExams > 0) {
    segments.push({ text: ' ' });
    segments.push({
      text: `${pendingExams} examen${pendingExams > 1 ? 's' : ''} à inscrire.`,
      highlight: true,
    });
  }

  if (unconfirmedLessons > 0) {
    segments.push({ text: ' ' });
    segments.push({
      text: `${unconfirmedLessons} leçon${unconfirmedLessons > 1 ? 's' : ''} non confirmée${unconfirmedLessons > 1 ? 's' : ''}.`,
      highlight: true,
    });
  }

  return segments;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * En-tête de bienvenue du tableau de bord du secrétaire.
 * Utilise les couleurs bleues (primary) et affiche des métriques
 * et actions adaptées à la gestion quotidienne de l’auto‑école.
 */
export function SecretaireWelcomeHeader({
  secretaireName,
  secretaireTitle = 'Secrétaire',
  avatarUrl,
  avatarFallback,
  greetingMessage,
  lastLoginAt,
  lessonsToday = 0,
  pendingPayments = 0,
  pendingExams = 0,
  unconfirmedLessons = 0,
  lessonsThisWeek,
  revenueToday,
  remindersCount,
  onManagePlanning,
  onManageCandidats,
  onManagePayments,
  onManageFactures,
  onManageRapports,
  showDate = true,
  className,
}: SecretaireWelcomeHeaderProps): React.JSX.Element {
  // ── Actions principales (boutons) ─────────────────────────
  const mainActions: WelcomeAction[] = [];

  if (onManagePlanning) {
    mainActions.push({
      label: 'Planning',
      icon: Calendar,
      onClick: onManagePlanning,
      variant: 'default',
      badge: lessonsToday > 0 ? lessonsToday : undefined,
    });
  }

  if (onManageCandidats) {
    mainActions.push({
      label: 'Candidats',
      icon: Users,
      onClick: onManageCandidats,
      variant: 'outline',
    });
  }

  if (onManagePayments) {
    mainActions.push({
      label: 'Paiements',
      icon: CreditCard,
      onClick: onManagePayments,
      variant: 'outline',
    });
  }


  if (onManageFactures) {
    mainActions.push({
      label: 'Factures',
      icon: FileText,
      onClick: onManageFactures,
      variant: 'outline',
    });
  }

  if (onManageRapports) {
    mainActions.push({
      label: 'Rapports',
      icon: BarChart3,
      onClick: onManageRapports,
      variant: 'outline',
    });
  }

  // ── Message contextuel ────────────────────────────────────
  const contextMessage = buildContextMessage(
    lessonsToday,
    pendingPayments,
    pendingExams,
    unconfirmedLessons
  );

  // ── Élément additionnel (extra) affichant quelques métriques ──
  const extraContent = (lessonsThisWeek !== undefined || revenueToday !== undefined) && (
    <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
      {lessonsThisWeek !== undefined && (
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {lessonsThisWeek} leçons cette semaine
        </span>
      )}
      {revenueToday !== undefined && (
        <span className="flex items-center gap-1">
          <CreditCard className="h-3 w-3" />
          {revenueToday.toLocaleString('fr-FR')} FCFA aujourd’hui
        </span>
      )}
      {remindersCount !== undefined && remindersCount > 0 && (
        <span className="flex items-center gap-1 text-amber-600">
          <FileText className="h-3 w-3" />
          {remindersCount} relance(s)
        </span>
      )}
    </div>
  );

  return (
    <WelcomeHeader
      userName={secretaireName}
      Role={'SECRETAIRE'}
      subtitle={secretaireTitle}
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
