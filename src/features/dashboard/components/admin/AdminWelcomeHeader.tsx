// src/features/dashboard/components/admin/AdminWelcomeHeader.tsx

/**
 * @module dashboard/components/admin/AdminWelcomeHeader
 * @description
 * En-tête de bienvenue spécialisé pour le tableau de bord de l’administrateur.
 * Compose `WelcomeHeader` avec les actions et le message contextuel
 * propres à l’administration de l’auto‑école COS.
 *
 * ## Actions disponibles (toutes optionnelles via callbacks)
 * - **Gérer les candidats** (bouton principal) – badge sur les nouveaux candidats
 * - **Formations** (outline)
 * - **Moniteurs** (outline)
 * - **Véhicules** (outline)
 * - **Finances** (outline)
 * - **Paramètres** (outline)
 *
 * ## Message contextuel dynamique
 * - Nombre de nouveaux candidats non traités
 * - Paiements en attente
 * - Entretiens programmés
 *
 * ## Alertes dans la HoverCard
 * - Candidats en attente → warning
 * - Entretiens véhicules imminents → error
 * - Factures impayées → info
 *
 * ## Métriques affichées dans la HoverCard
 * - Candidats inscrits ce mois
 * - Chiffre d'affaires mensuel
 * - Taux d'occupation des véhicules
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * <AdminWelcomeHeader
 *   adminName="Jean Dupont"
 *   adminTitle="Super Administrateur"
 *   avatarUrl="/avatars/admin.jpg"
 *   newCandidatsCount={5}
 *   pendingPayments={2}
 *   pendingMaintenances={1}
 *   onManageCandidats={() => navigate('/candidats')}
 *   onManageFormations={() => navigate('/formations')}
 *   onManageMoniteurs={() => navigate('/moniteurs')}
 *   onManageVehicules={() => navigate('/vehicules')}
 *   onManageFinances={() => navigate('/paiements')}
 * />
 * ```
 */

import { Users, GraduationCap, UserRound, Car, CreditCard } from 'lucide-react';
import { WelcomeHeader, type WelcomeAction, type ContextSegment } from '../common/WelcomeHeader';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AdminWelcomeHeaderProps {
  // ── Identité ─────────────────────────────────────────────
  /** Nom complet de l'administrateur */
  adminName: string;
  /** Titre / rôle (défaut : "Administrateur") */
  adminTitle?: string;
  /** URL de l'avatar */
  avatarUrl?: string;
  /** Initiales de secours */
  avatarFallback?: string;

  isLoading?: boolean; // Indique si les données sont en cours de chargement (affiche un skeleton)

  // ── Greeting ──────────────────────────────────────────────
  /** Message de salutation personnalisé (sinon automatique) */
  greetingMessage?: string;
  /** Dernière connexion (pour "Bon retour") */
  lastLoginAt?: Date;

  // ── Métriques et badges ────────────────────────────────────
  /** Nombre de nouveaux candidats non encore traités (ou inscrits récents) */
  newCandidatsCount?: number;
  /** Nombre de paiements en attente (factures impayées) */
  pendingPayments?: number;
  /** Nombre d'entretiens véhicules programmés (ou à faire) */
  pendingMaintenances?: number;
  /** Nombre de leçons planifiées aujourd'hui (optionnel) */
  lessonsToday?: number;

  // ── Métriques pour le message contextuel ───────────────────
  /** Candidats inscrits ce mois */
  candidatsThisMonth?: number;
  /** Chiffre d'affaires du mois (FCFA) */
  monthlyRevenue?: number;
  /** Taux d'occupation des véhicules (en %) */
  vehicleOccupancyRate?: number;

  // ── Événements récents (optionnel) ────────────────────────
  /** Dernière action (ex: "5 nouveaux candidats") */
  recentActivity?: string;

  // ── Callbacks ─────────────────────────────────────────────
  /** Gérer les candidats (liste) */
  onManageCandidats?: () => void;
  /** Gérer les formations */
  onManageFormations?: () => void;
  /** Gérer les moniteurs */
  onManageMoniteurs?: () => void;
  /** Gérer les véhicules */
  onManageVehicules?: () => void;
  /** Gérer les finances (paiements, factures) */
  onManageFinances?: () => void;

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
 * Construit le message contextuel dynamique pour l’administrateur de l’auto‑école.
 * @internal
 */
function buildContextMessage(
  newCandidatsCount: number,
  pendingPayments: number,
  pendingMaintenances: number,
  lessonsToday: number = 0
): ContextSegment[] {
  const segments: ContextSegment[] = [];

  // Nouveaux candidats
  if (newCandidatsCount > 0) {
    segments.push({ text: 'Vous avez ' });
    segments.push({
      text: `${newCandidatsCount} nouveau${newCandidatsCount > 1 ? 'x' : ''} candidat${newCandidatsCount > 1 ? 's' : ''}`,
      highlight: true,
    });
    segments.push({ text: ' à suivre.' });
  } else {
    segments.push({ text: 'Aucun nouveau candidat en attente.' });
  }

  // Paiements en attente
  if (pendingPayments > 0) {
    segments.push({ text: ' ' });
    segments.push({
      text: `${pendingPayments} paiement${pendingPayments > 1 ? 's' : ''} en attente.`,
      highlight: true,
    });
  }

  // Entretiens programmés
  if (pendingMaintenances > 0) {
    segments.push({ text: ' ' });
    segments.push({
      text: `${pendingMaintenances} entretien${pendingMaintenances > 1 ? 's' : ''} à planifier.`,
      highlight: true,
    });
  }

  // Leçons du jour
  if (lessonsToday > 0) {
    segments.push({ text: ' Aujourd’hui, ' });
    segments.push({
      text: `${lessonsToday} leçon${lessonsToday > 1 ? 's' : ''}`,
      highlight: true,
    });
    segments.push({ text: ' sont programmées.' });
  }

  return segments;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * En-tête de bienvenue du tableau de bord administrateur de l’auto‑école COS.
 * Utilise les couleurs bleues (primary) et affiche des métriques
 * et actions adaptées à la gestion d’une auto‑école.
 */
export function AdminWelcomeHeader({
  adminName,
  adminTitle = 'Administrateur',
  avatarUrl,
  isLoading = false,
  avatarFallback,
  greetingMessage,
  lastLoginAt,
  newCandidatsCount = 0,
  pendingPayments = 0,
  pendingMaintenances = 0,
  lessonsToday = 0,
  candidatsThisMonth,
  monthlyRevenue,
  vehicleOccupancyRate,
  onManageCandidats,
  onManageFormations,
  onManageMoniteurs,
  onManageVehicules,
  onManageFinances,
  showDate = true,
  className,
}: AdminWelcomeHeaderProps): React.JSX.Element {


  // ── Actions principales (boutons) ─────────────────────────
  const mainActions: WelcomeAction[] = [];

  if (onManageCandidats) {
    mainActions.push({
      label: 'Candidats',
      icon: Users,
      onClick: onManageCandidats,
      variant: 'default',
      badge: newCandidatsCount > 0 ? newCandidatsCount : undefined,
    });
  }

  if (onManageFormations) {
    mainActions.push({
      label: 'Formations',
      icon: GraduationCap,
      onClick: onManageFormations,
      variant: 'outline',
    });
  }

  if (onManageMoniteurs) {
    mainActions.push({
      label: 'Moniteurs',
      icon: UserRound,
      onClick: onManageMoniteurs,
      variant: 'outline',
    });
  }

  if (onManageVehicules) {
    mainActions.push({
      label: 'Véhicules',
      icon: Car,
      onClick: onManageVehicules,
      variant: 'outline',
    });
  }

  if (onManageFinances) {
    mainActions.push({
      label: 'Finances',
      icon: CreditCard,
      onClick: onManageFinances,
      variant: 'outline',
    });
  }


  // ── Message contextuel ────────────────────────────────────
  const contextMessage = buildContextMessage(
    newCandidatsCount,
    pendingPayments,
    pendingMaintenances,
    lessonsToday
  );

  // ── Élément additionnel (extra) affichant quelques métriques ──
  const extraContent = (candidatsThisMonth !== undefined || monthlyRevenue !== undefined) && (
    <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
      {candidatsThisMonth !== undefined && (
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {candidatsThisMonth} inscrits ce mois
        </span>
      )}
      {monthlyRevenue !== undefined && (
        <span className="flex items-center gap-1">
          <CreditCard className="h-3 w-3" />
          {monthlyRevenue.toLocaleString('fr-FR')} FCFA
        </span>
      )}
      {vehicleOccupancyRate !== undefined && (
        <span className="flex items-center gap-1">
          <Car className="h-3 w-3" />
          {vehicleOccupancyRate}% occup.
        </span>
      )}
    </div>
  );

  return (
    <WelcomeHeader
      userName={adminName}
      Role={'ADMIN'}
      isLoading={isLoading}
      subtitle={adminTitle}
      avatarUrl={avatarUrl}
      avatarFallback={avatarFallback}
      greetingMessage={greetingMessage}
      lastLoginAt={lastLoginAt}
      showDate={showDate}
      contextMessage={contextMessage.length > 0 ? contextMessage : undefined}
      mainActions={mainActions}
      className={cn('rounded-md border border-border/60 shadow-xs', className)}
      extra={extraContent}
    />
  );
}
