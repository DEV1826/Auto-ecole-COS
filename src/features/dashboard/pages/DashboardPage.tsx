/**
 * @module features/dashboard/pages/DashboardPage
 * @description Point d'entrée du tableau de bord – redirige vers le dashboard spécifique selon le rôle.
 * @see {@link useAuth} pour les informations de session
 * @see {@link PROTECTED_ROUTES} pour les routes
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use.auth';
import { PUBLIC_ROUTES } from '@/config/routes';
import { lazy, useMemo } from 'react';
import { WelcomeSplash } from '@/features/auth/components/WelcomeSplash';
import { AnimatePresence, motion } from 'framer-motion';

// Lazy loading des dashboards par rôle
const AdminDashboard = lazy(() => import('./common/AdminDashboard'));
const SecretaireDashboard = lazy(() => import('./common/SecretaireDashboard'));
const MoniteurDashboard = lazy(() => import('./common/MoniteurDashboard'));
/**
 * Page principale du tableau de bord.
 * Récupère le rôle de l'utilisateur connecté et affiche le dashboard correspondant.
 * Redirige vers la page de connexion si l'utilisateur n'est pas authentifié.
 *
 * @example
 * ```tsx
 * <Route path={PROTECTED_ROUTES.DASHBOARD} element={<DashboardPage />} />
 * ```
 */
export default function DashboardPage() {
  const {
    user,
    isAuthenticated,
    showWelcome,
    sessionId,
    lastSession,

    setShowWelcome,
  } = useAuth();

  /**
   * Sélection dynamique du composant selon le rôle.
   * On utilise useMemo pour éviter de recalculer à chaque rendu.
   */
  const DashboardComponent = useMemo(() => {
    switch (user?.role) {
      case 'ADMIN':
        return AdminDashboard;
      case 'SECRETAIRE':
        return SecretaireDashboard;
      case 'MONITEUR':
        return MoniteurDashboard;
      default:
        return null;
    }
  }, [user?.role]);

  // Sécurité : Redirection si non authentifié
  if (!isAuthenticated || !user) {
    return <Navigate to={PUBLIC_ROUTES.AUTH.LOGIN} replace />;
  }

  if (!DashboardComponent) {
    return <Navigate to={PUBLIC_ROUTES.HOME} replace />;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {showWelcome ? (
          <WelcomeSplash
            key="splash"
            sessionId={sessionId!}
            user={user}
            visible={showWelcome}
            onFinish={() => setShowWelcome(false)}
          />
        ) : (
          <motion.div
            key="dashboard-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            exit={{
              opacity: 0,
              transition: { duration: 1, ease: 'easeInOut' },
            }}
            className="h-full w-full"
          >
            <DashboardComponent session={lastSession} user={user} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
