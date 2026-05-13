'use client';

/**
 * @module features/profile/pages/ProfilePage
 * @description
 * Point d'entrée du module profil utilisateur VitaCare.
 *
 * Ce composant :
 * - Vérifie l'authentification de l'utilisateur
 * - Détermine son rôle (UserRole)
 * - Charge dynamiquement le composant de profil correspondant via React.lazy
 * - Affiche les métadonnées SEO via PageMeta
 *
 * Routing par rôle :
 * - ADMIN → AdminProfile
 * - MONITEUR → MoniteurProfile
 * - SECRETAIRE → SecretaireProfile
 *
 * Chaque profil affiche :
 * - L'en-tête (avatar, nom, rôle, stats)
 * - Des sections thématiques avec édition via Dialog/Drawer
 * - La zone dangereuse (désactivation, suppression, export)
 *
 * @see {@link useAuth} pour les informations de session
 * @see {@link PROTECTED_ROUTES} pour les routes
 * @see {@link AdminProfile} — profil administrateur
 * @see {@link DoctorProfile} — profil médecin
 * @see {@link PatientProfile} — profil patient
 * @see {@link PharmacistProfile} — profil pharmacien
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * // Dans le routeur
 * <Route path={PROTECTED_ROUTES.PROFILE.VIEW} element={<ProfilePage />} />
 * ```
 */

import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use.auth';
import { PUBLIC_ROUTES } from '@/config/routes';
import { Skeleton } from '@/components/ui/skeleton';

// ─────────────────────────────────────────────────────────────────────────────
// Chargement dynamique des profils par rôle
// ─────────────────────────────────────────────────────────────────────────────

const ProfileComponents = {
  ADMIN: lazy(() => import('./common/AdminProfile')),
  MONITEUR: lazy(() => import('./common/MoniteurProfile')),
  SECRETAIRE: lazy(() => import('./common/SecretaireProfile')),
} as const;

/**
 * Squelette de chargement affiché pendant le lazy-loading du profil.
 * @internal
 */
function ProfileLoadingSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-6 p-4 md:p-1">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <Skeleton className="h-24 w-24 rounded-full shrink-0" />
        <div className="flex-1 space-y-2 w-full">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-4 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-20 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Onglets */}
      <Skeleton className="h-9 w-full max-w-sm rounded-lg" />

      {/* Sections */}
      <aside className="w-64 shrink-0">
        <Skeleton className="h-36 w-full rounded-md" />
      </aside>
      <main className="flex-1 min-w-0">
        <Skeleton className="h-36 w-full rounded-md" />
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Page principale du profil utilisateur.
 *
 * Récupère le rôle de l'utilisateur connecté et affiche le composant de profil
 * correspondant. Redirige vers la page de connexion si l'utilisateur n'est pas
 * authentifié, et vers la page d'accueil si son rôle est inconnu.
 *
 * @returns {React.JSX.Element} La page de profil ou une redirection
 *
 * @example
 * ```tsx
 * // Utilisation dans le routeur React Router
 * <Route path={PROTECTED_ROUTES.PROFILE.VIEW} element={<ProfilePage />} />
 * ```
 */
export default function ProfilePage(): React.JSX.Element {
  const { user, isAuthenticated, lastSession } = useAuth();

  // ── Garde d'authentification ──────────────────────────────
  if (!isAuthenticated || !user) {
    return <Navigate to={PUBLIC_ROUTES.AUTH.LOGIN} replace />;
  }

  // ── Sélection du composant de profil selon le rôle ────────
  const ProfileComponent = ProfileComponents[user.role as keyof typeof ProfileComponents];

  if (!ProfileComponent) {
    return <Navigate to={PUBLIC_ROUTES.HOME} replace />;
  }

  return (
    <>
      {/* Contenu de la page avec Suspense pour le lazy loading */}
      <div className="space-y-4">
        <Suspense fallback={<ProfileLoadingSkeleton />}>
          <ProfileComponent session={lastSession} user={user} />
        </Suspense>
      </div>
    </>
  );
}
