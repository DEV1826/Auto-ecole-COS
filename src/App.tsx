// /home/stive-junior/Auto-ecole-COS/src/App.tsx

/**
 * @module App
 * @description Point d'entrée principal du routeur de l'application Auto‑école COS.
 * @author Stive Junior
 * @version 1.0.0
 *
 * Ce composant définit toutes les routes de l'application :
 * - Routes publiques (login, logout, pages d'état)
 * - Routes protégées (dashboard, candidats, formations, moniteurs, etc.)
 * - Lazy loading pour le code splitting
 * - Guards d'authentification et de rôles (ADMIN, SECRETAIRE, MONITEUR)
 */

import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { appConfig } from '@/config/app.config';
import { SuspenseFallback } from '@/components/common/SuspenseFallback';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { PageTransition } from '@/components/common/PageTransition';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { NotFound } from '@/components/common/NotFound';
import { Unauthorized } from '@/components/common/Unauthorized';
import { Maintenance } from '@/components/common/Maintenance';
import { AccountInactive } from '@/components/common/AccountInactive';
import {
  PublicRoute,
  ProtectedRoute,
  RoleBasedRoute,
  RequireState,
} from '@/components/common/guard';
import { PUBLIC_ROUTES, PROTECTED_ROUTES } from '@/config/routes';
import { AppLayout } from '@/components/layout/AppLayout';
import { Success } from './components/common';
import { Layout } from './components/layout';

// ============================================================
// LAZY LOADING DES PAGES PAR FEATURE
// ============================================================

const HomePage = lazy(() => import('@/features/home').then((m) => ({ default: m.HomePage })));
// ---- AUTH ----
const LoginPage = lazy(() => import('@/features/auth').then((m) => ({ default: m.LoginPage })));
const LogoutPage = lazy(() => import('@/features/auth').then((m) => ({ default: m.LogoutPage })));
const ForgotPasswordPage = lazy(() =>
  import('@/features/auth').then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import('@/features/auth').then((m) => ({ default: m.ResetPasswordPage }))
);

const RegisterPage = lazy(() =>
  import('@/features/auth').then((m) => ({ default: m.RegisterPage }))
);
const OTPPage = lazy(() => import('@/features/auth').then((m) => ({ default: m.OTPPage })));

// ---- DASHBOARD ----
const DashboardPage = lazy(() =>
  import('@/features/dashboard').then((m) => ({ default: m.DashboardPage }))
);

// ---- PROFILE ----
const ProfilePage = lazy(() =>
  import('@/features/profile').then((m) => ({ default: m.ProfilePage }))
);
const SettingsPage = lazy(() =>
  import('@/features/profile').then((m) => ({ default: m.SettingsPage }))
);

// ---- CANDIDATS ----
const CandidatsListPage = lazy(() =>
  import('@/features/candidats').then((m) => ({ default: m.CandidatsListPage }))
);
const CandidatDetailPage = lazy(() =>
  import('@/features/candidats').then((m) => ({ default: m.CandidatDetailPage }))
);
const CandidatCreatePage = lazy(() =>
  import('@/features/candidats').then((m) => ({ default: m.CandidatCreatePage }))
);
const CandidatEditPage = lazy(() =>
  import('@/features/candidats').then((m) => ({ default: m.CandidatEditPage }))
);

// ---- FORMATIONS ----
const FormationsListPage = lazy(() =>
  import('@/features/formations').then((m) => ({ default: m.FormationsListPage }))
);
const FormationDetailPage = lazy(() =>
  import('@/features/formations').then((m) => ({ default: m.FormationDetailPage }))
);
const FormationCreatePage = lazy(() =>
  import('@/features/formations').then((m) => ({ default: m.FormationCreatePage }))
);
const FormationEditPage = lazy(() =>
  import('@/features/formations').then((m) => ({ default: m.FormationEditPage }))
);
const FormationTarifsPage = lazy(() =>
  import('@/features/formations').then((m) => ({ default: m.FormationTarifsPage }))
);

// ---- MONITEURS ----
const MoniteursListPage = lazy(() =>
  import('@/features/moniteurs').then((m) => ({ default: m.MoniteursListPage }))
);
const MoniteurDetailPage = lazy(() =>
  import('@/features/moniteurs').then((m) => ({ default: m.MoniteurDetailPage }))
);
const MoniteurCreatePage = lazy(() =>
  import('@/features/moniteurs').then((m) => ({ default: m.MoniteurCreatePage }))
);
const MoniteurEditPage = lazy(() =>
  import('@/features/moniteurs').then((m) => ({ default: m.MoniteurEditPage }))
);
const MoniteurPlanningPage = lazy(() =>
  import('@/features/moniteurs').then((m) => ({ default: m.MoniteurPlanningPage }))
);

// ---- VEHICULES ----
const VehiculesListPage = lazy(() =>
  import('@/features/vehicules').then((m) => ({ default: m.VehiculesListPage }))
);
const VehiculeDetailPage = lazy(() =>
  import('@/features/vehicules').then((m) => ({ default: m.VehiculeDetailPage }))
);
const VehiculeCreatePage = lazy(() =>
  import('@/features/vehicules').then((m) => ({ default: m.VehiculeCreatePage }))
);
const VehiculeEditPage = lazy(() =>
  import('@/features/vehicules').then((m) => ({ default: m.VehiculeEditPage }))
);
const VehiculeEntretiensPage = lazy(() =>
  import('@/features/vehicules').then((m) => ({ default: m.VehiculeEntretiensPage }))
);

// ---- PLANNING ----
const PlanningCalendarPage = lazy(() =>
  import('@/features/planning').then((m) => ({ default: m.PlanningCalendarPage }))
);
const PlanningDetailPage = lazy(() =>
  import('@/features/planning').then((m) => ({ default: m.PlanningDetailPage }))
);
const PlanningCreatePage = lazy(() =>
  import('@/features/planning').then((m) => ({ default: m.PlanningCreatePage }))
);
const PlanningEditPage = lazy(() =>
  import('@/features/planning').then((m) => ({ default: m.PlanningEditPage }))
);
const PlanningMoniteurPage = lazy(() =>
  import('@/features/planning').then((m) => ({ default: m.PlanningMoniteurPage }))
);
const PlanningCandidatPage = lazy(() =>
  import('@/features/planning').then((m) => ({ default: m.PlanningCandidatPage }))
);

// ---- EXAMENS ----
const ExamensListPage = lazy(() =>
  import('@/features/examens').then((m) => ({ default: m.ExamensListPage }))
);
const ExamenDetailPage = lazy(() =>
  import('@/features/examens').then((m) => ({ default: m.ExamenDetailPage }))
);
const ExamenCreatePage = lazy(() =>
  import('@/features/examens').then((m) => ({ default: m.ExamenCreatePage }))
);
const ExamenEditPage = lazy(() =>
  import('@/features/examens').then((m) => ({ default: m.ExamenEditPage }))
);
const ExamensParCandidatPage = lazy(() =>
  import('@/features/examens').then((m) => ({ default: m.ExamensParCandidatPage }))
);

// ---- FINANCES ----
// Paiements
const PaiementsListPage = lazy(() =>
  import('@/features/paiements').then((m) => ({ default: m.PaiementsListPage }))
);
const PaiementsParCandidatPage = lazy(() =>
  import('@/features/paiements').then((m) => ({ default: m.PaiementsParCandidatPage }))
);
const PaiementCreatePage = lazy(() =>
  import('@/features/paiements').then((m) => ({ default: m.PaiementCreatePage }))
);
const PaiementDetailPage = lazy(() =>
  import('@/features/paiements').then((m) => ({ default: m.PaiementDetailPage }))
);

// Factures
const FacturesListPage = lazy(() =>
  import('@/features/factures').then((m) => ({ default: m.FacturesListPage }))
);
const FactureDetailPage = lazy(() =>
  import('@/features/factures').then((m) => ({ default: m.FactureDetailPage }))
);
const FactureCreatePage = lazy(() =>
  import('@/features/factures').then((m) => ({ default: m.FactureCreatePage }))
);
const FactureEditPage = lazy(() =>
  import('@/features/factures').then((m) => ({ default: m.FactureEditPage }))
);

// Reçus
const RecusListPage = lazy(() =>
  import('@/features/documents').then((m) => ({ default: m.RecusListPage }))
);
const RecuDetailPage = lazy(() =>
  import('@/features/documents').then((m) => ({ default: m.RecuDetailPage }))
);

// Dépenses
const DepensesListPage = lazy(() =>
  import('@/features/depenses').then((m) => ({ default: m.DepensesListPage }))
);
const DepenseCreatePage = lazy(() =>
  import('@/features/depenses').then((m) => ({ default: m.DepenseCreatePage }))
);
const DepenseEditPage = lazy(() =>
  import('@/features/depenses').then((m) => ({ default: m.DepenseEditPage }))
);

// Caisse
const CaisseIndexPage = lazy(() =>
  import('@/features/caisse').then((m) => ({ default: m.CaisseIndexPage }))
);
const CaisseEntreePage = lazy(() =>
  import('@/features/caisse').then((m) => ({ default: m.CaisseEntreePage }))
);
const CaisseSortiePage = lazy(() =>
  import('@/features/caisse').then((m) => ({ default: m.CaisseSortiePage }))
);
const CaisseRelevePage = lazy(() =>
  import('@/features/caisse').then((m) => ({ default: m.CaisseRelevePage }))
);

// ---- RAPPORTS ----
const RapportFinancierPage = lazy(() =>
  import('@/features/rapports').then((m) => ({ default: m.RapportFinancierPage }))
);
const RapportCandidatsPage = lazy(() =>
  import('@/features/rapports').then((m) => ({ default: m.RapportCandidatsPage }))
);
const RapportLeconsPage = lazy(() =>
  import('@/features/rapports').then((m) => ({ default: m.RapportLeconsPage }))
);
const RapportVehiculesPage = lazy(() =>
  import('@/features/rapports').then((m) => ({ default: m.RapportVehiculesPage }))
);
const RapportExportPage = lazy(() =>
  import('@/features/rapports').then((m) => ({ default: m.RapportExportPage }))
);
const RapportKPIPage = lazy(() =>
  import('@/features/rapports').then((m) => ({ default: m.RapportKPIPage }))
);

// ---- ADMINISTRATION ----
const AdminUsersListPage = lazy(() =>
  import('@/features/admin').then((m) => ({ default: m.AdminUsersListPage }))
);
const AdminUserDetailPage = lazy(() =>
  import('@/features/admin').then((m) => ({ default: m.AdminUserDetailPage }))
);
const AdminUserCreatePage = lazy(() =>
  import('@/features/admin').then((m) => ({ default: m.AdminUserCreatePage }))
);
const AdminUserEditPage = lazy(() =>
  import('@/features/admin').then((m) => ({ default: m.AdminUserEditPage }))
);
const AdminUserPermissionsPage = lazy(() =>
  import('@/features/admin').then((m) => ({ default: m.AdminUserPermissionsPage }))
);
const AdminAuditLogsPage = lazy(() =>
  import('@/features/admin').then((m) => ({ default: m.AdminAuditLogsPage }))
);
const AdminCompanyConfigPage = lazy(() =>
  import('@/features/admin').then((m) => ({ default: m.AdminCompanyConfigPage }))
);
const AdminSessionsPage = lazy(() =>
  import('@/features/admin').then((m) => ({ default: m.AdminSessionsPage }))
);

// ---- UTILITAIRES (Notifications, Help, API Docs) ----
const NotificationsPage = lazy(() =>
  import('@/features/utils').then((m) => ({ default: m.NotificationsPage }))
);
const HelpPage = lazy(() => import('@/features/utils').then((m) => ({ default: m.HelpPage })));

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

const date = Date.now();
/**
 * Application principale avec routage complet.
 * - Vérifie l'état de maintenance avant tout affichage.
 * - Utilise le lazy loading pour chaque page.
 * - Applique les guards d'authentification et de rôles.
 */
export default function App() {
  // Si l'application est en maintenance, on affiche directement la page de maintenance
  if (appConfig.maintenance) {
    return (
      <Maintenance
        estimatedEndTime={date + 2 * 24 * 60 * 60 * 1000}
        message="L'application est en cours de maintenance. Revenez bientôt !"
      />
    );
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <ErrorBoundary>
        <Suspense fallback={<SuspenseFallback message="Chargement..." />}>
          <PageTransition>
            <Routes>
              {/* ============================================================
                  ROUTES PUBLIQUES (sans layout enveloppant)
              ============================================================ */}
              <Route element={<PublicRoute />}>
                <Route
                  element={<Layout showHeader={true} showFooter={true} footerVariant="form" />}
                >
                  <Route path={PUBLIC_ROUTES.HOME} element={<HomePage />} />
                </Route>

                <Route path={PUBLIC_ROUTES.AUTH.LOGIN} element={<LoginPage />} />
                <Route element={<RequireState requiredStateKeys="fromLogout" />}>
                  <Route path={PUBLIC_ROUTES.AUTH.LOGOUT} element={<LogoutPage />} />
                </Route>
                <Route
                  element={
                    <RequireState
                      requiredStateKeys="email"
                      maxAge={200000}
                      redirectTo={PUBLIC_ROUTES.AUTH.FORGOT_PASSWORD}
                    />
                  }
                >
                  <Route path={PUBLIC_ROUTES.AUTH.VERIFY_OTP} element={<OTPPage />} />
                </Route>
                <Route path={PUBLIC_ROUTES.AUTH.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
                <Route path={PUBLIC_ROUTES.AUTH.RESET_PASSWORD} element={<ResetPasswordPage />} />
                <Route path={PUBLIC_ROUTES.STATUS.UNAUTHORIZED} element={<Unauthorized />} />
                <Route path={PUBLIC_ROUTES.STATUS.NOT_FOUND} element={<NotFound />} />
                <Route path={PUBLIC_ROUTES.STATUS.ACCOUNT_INACTIVE} element={<AccountInactive />} />
                <Route element={<RequireState requiredStateKeys="fromLogout" />}>
                  <Route
                    path={PUBLIC_ROUTES.AUTH.LOGOUT_SUCCESS}
                    element={
                      <Success
                        title="À bientôt !"
                        message="Vous avez été déconnecté avec succès."
                        buttonText="Retour à l'accueil"
                        redirectTo={PUBLIC_ROUTES.HOME}
                        showHomeButton={false}
                      />
                    }
                  />
                </Route>
              </Route>

              {/* ============================================================
                  ROUTES PROTÉGÉES (avec AppLayout: sidebar + header)
              ============================================================ */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  {/* Dashboard (accessible à tous les rôles) */}
                  <Route path={PROTECTED_ROUTES.DASHBOARD} element={<DashboardPage />} />

                  {/* Profil (accessible à tous) */}
                  <Route path={PROTECTED_ROUTES.PROFILE} element={<ProfilePage />} />

                  {/* Candidats - tous rôles (lecture, création, édition selon permissions) */}
                  <Route path={PROTECTED_ROUTES.CANDIDATS.LIST} element={<CandidatsListPage />} />
                  <Route
                    path={PROTECTED_ROUTES.CANDIDATS.CREATE}
                    element={<CandidatCreatePage />}
                  />
                  <Route
                    path={PROTECTED_ROUTES.CANDIDATS.DETAIL(':id')}
                    element={<CandidatDetailPage />}
                  />
                  <Route
                    path={PROTECTED_ROUTES.CANDIDATS.EDIT(':id')}
                    element={<CandidatEditPage />}
                  />

                  {/* Formations - lecture pour tous, création/édition réservé ADMIN */}
                  <Route path={PROTECTED_ROUTES.FORMATIONS.LIST} element={<FormationsListPage />} />
                  <Route
                    path={PROTECTED_ROUTES.FORMATIONS.DETAIL(':id')}
                    element={<FormationDetailPage />}
                  />
                  <Route element={<RoleBasedRoute allowedRoles={['ADMIN']} />}>
                    <Route path={PUBLIC_ROUTES.AUTH.REGISTER} element={<RegisterPage />} />
                    <Route path={PROTECTED_ROUTES.SETTINGS} element={<SettingsPage />} />

                    <Route
                      path={PROTECTED_ROUTES.FORMATIONS.CREATE}
                      element={<FormationCreatePage />}
                    />
                    <Route
                      path={PROTECTED_ROUTES.FORMATIONS.EDIT(':id')}
                      element={<FormationEditPage />}
                    />

                    <Route
                      path={PROTECTED_ROUTES.FORMATIONS.TARIFS(':id')}
                      element={<FormationTarifsPage />}
                    />
                  </Route>

                  {/* Moniteurs - lecture pour tous, création/édition ADMIN */}
                  <Route path={PROTECTED_ROUTES.MONITEURS.LIST} element={<MoniteursListPage />} />
                  <Route
                    path={PROTECTED_ROUTES.MONITEURS.DETAIL(':id')}
                    element={<MoniteurDetailPage />}
                  />
                  <Route element={<RoleBasedRoute allowedRoles={['ADMIN']} />}>
                    <Route
                      path={PROTECTED_ROUTES.MONITEURS.CREATE}
                      element={<MoniteurCreatePage />}
                    />
                    <Route
                      path={PROTECTED_ROUTES.MONITEURS.EDIT(':id')}
                      element={<MoniteurEditPage />}
                    />
                  </Route>
                  <Route
                    path={PROTECTED_ROUTES.MONITEURS.PLANNING(':id')}
                    element={<MoniteurPlanningPage />}
                  />

                  {/* Véhicules - lecture pour tous, gestion ADMIN */}
                  <Route path={PROTECTED_ROUTES.VEHICULES.LIST} element={<VehiculesListPage />} />
                  <Route
                    path={PROTECTED_ROUTES.VEHICULES.DETAIL(':id')}
                    element={<VehiculeDetailPage />}
                  />
                  <Route element={<RoleBasedRoute allowedRoles={['ADMIN']} />}>
                    <Route
                      path={PROTECTED_ROUTES.VEHICULES.CREATE}
                      element={<VehiculeCreatePage />}
                    />
                    <Route
                      path={PROTECTED_ROUTES.VEHICULES.EDIT(':id')}
                      element={<VehiculeEditPage />}
                    />
                    <Route
                      path={PROTECTED_ROUTES.VEHICULES.ENTRETIENS(':id')}
                      element={<VehiculeEntretiensPage />}
                    />
                  </Route>

                  {/* Planning - tous rôles, création/édition selon permissions (SECRETAIRE peut tout, MONITEUR limité) */}
                  <Route
                    path={PROTECTED_ROUTES.PLANNING.CALENDAR}
                    element={<PlanningCalendarPage />}
                  />
                  <Route
                    path={PROTECTED_ROUTES.PLANNING.DETAIL(':id')}
                    element={<PlanningDetailPage />}
                  />
                  <Route element={<RoleBasedRoute allowedRoles={['ADMIN', 'SECRETAIRE']} />}>
                    <Route
                      path={PROTECTED_ROUTES.PLANNING.CREATE}
                      element={<PlanningCreatePage />}
                    />
                    <Route
                      path={PROTECTED_ROUTES.PLANNING.EDIT(':id')}
                      element={<PlanningEditPage />}
                    />
                  </Route>
                  <Route
                    path={PROTECTED_ROUTES.PLANNING.MONITEUR(':moniteurId')}
                    element={<PlanningMoniteurPage />}
                  />
                  <Route
                    path={PROTECTED_ROUTES.PLANNING.CANDIDAT(':candidatId')}
                    element={<PlanningCandidatPage />}
                  />

                  {/* Examens - tous rôles, création/édition ADMIN/SECRETAIRE */}
                  <Route path={PROTECTED_ROUTES.EXAMENS.LIST} element={<ExamensListPage />} />
                  <Route
                    path={PROTECTED_ROUTES.EXAMENS.DETAIL(':id')}
                    element={<ExamenDetailPage />}
                  />
                  <Route element={<RoleBasedRoute allowedRoles={['ADMIN', 'SECRETAIRE']} />}>
                    <Route path={PROTECTED_ROUTES.EXAMENS.CREATE} element={<ExamenCreatePage />} />
                    <Route
                      path={PROTECTED_ROUTES.EXAMENS.EDIT(':id')}
                      element={<ExamenEditPage />}
                    />
                  </Route>
                  <Route
                    path={PROTECTED_ROUTES.EXAMENS.PAR_CANDIDAT(':candidatId')}
                    element={<ExamensParCandidatPage />}
                  />

                  {/* Finances - tous rôles (lecture et création de paiements, factures, etc.) */}
                  <Route path={PROTECTED_ROUTES.PAIEMENTS.LIST} element={<PaiementsListPage />} />
                  <Route
                    path={PROTECTED_ROUTES.PAIEMENTS.PAR_CANDIDAT(':candidatId')}
                    element={<PaiementsParCandidatPage />}
                  />
                  <Route
                    path={PROTECTED_ROUTES.PAIEMENTS.CREATE}
                    element={<PaiementCreatePage />}
                  />
                  <Route
                    path={PROTECTED_ROUTES.PAIEMENTS.DETAIL(':id')}
                    element={<PaiementDetailPage />}
                  />

                  <Route path={PROTECTED_ROUTES.FACTURES.LIST} element={<FacturesListPage />} />
                  <Route
                    path={PROTECTED_ROUTES.FACTURES.DETAIL(':id')}
                    element={<FactureDetailPage />}
                  />
                  <Route path={PROTECTED_ROUTES.FACTURES.CREATE} element={<FactureCreatePage />} />
                  <Route
                    path={PROTECTED_ROUTES.FACTURES.EDIT(':id')}
                    element={<FactureEditPage />}
                  />

                  <Route path={PROTECTED_ROUTES.RECUS.LIST} element={<RecusListPage />} />
                  <Route path={PROTECTED_ROUTES.RECUS.DETAIL(':id')} element={<RecuDetailPage />} />

                  <Route path={PROTECTED_ROUTES.DEPENSES.LIST} element={<DepensesListPage />} />
                  <Route path={PROTECTED_ROUTES.DEPENSES.CREATE} element={<DepenseCreatePage />} />
                  <Route
                    path={PROTECTED_ROUTES.DEPENSES.EDIT(':id')}
                    element={<DepenseEditPage />}
                  />

                  <Route path={PROTECTED_ROUTES.CAISSE.INDEX} element={<CaisseIndexPage />} />
                  <Route path={PROTECTED_ROUTES.CAISSE.ENTREE} element={<CaisseEntreePage />} />
                  <Route path={PROTECTED_ROUTES.CAISSE.SORTIE} element={<CaisseSortiePage />} />
                  <Route path={PROTECTED_ROUTES.CAISSE.RELEVE} element={<CaisseRelevePage />} />

                  {/* Rapports - accessibles à tous, mais certaines données sensibles filtrées par rôle */}
                  <Route
                    path={PROTECTED_ROUTES.RAPPORTS.FINANCIER}
                    element={<RapportFinancierPage />}
                  />
                  <Route
                    path={PROTECTED_ROUTES.RAPPORTS.CANDIDATS}
                    element={<RapportCandidatsPage />}
                  />
                  <Route path={PROTECTED_ROUTES.RAPPORTS.LECONS} element={<RapportLeconsPage />} />
                  <Route
                    path={PROTECTED_ROUTES.RAPPORTS.VEHICULES}
                    element={<RapportVehiculesPage />}
                  />
                  <Route path={PROTECTED_ROUTES.RAPPORTS.EXPORT} element={<RapportExportPage />} />
                  <Route element={<RoleBasedRoute allowedRoles={['ADMIN']} />}>
                    <Route path={PROTECTED_ROUTES.RAPPORTS.KPI} element={<RapportKPIPage />} />
                  </Route>

                  {/* Administration - réservée ADMIN */}
                  <Route element={<RoleBasedRoute allowedRoles={['ADMIN']} />}>
                    <Route
                      path={PROTECTED_ROUTES.ADMIN.USERS.LIST}
                      element={<AdminUsersListPage />}
                    />
                    <Route
                      path={PROTECTED_ROUTES.ADMIN.USERS.DETAIL(':id')}
                      element={<AdminUserDetailPage />}
                    />
                    <Route
                      path={PROTECTED_ROUTES.ADMIN.USERS.CREATE}
                      element={<AdminUserCreatePage />}
                    />
                    <Route
                      path={PROTECTED_ROUTES.ADMIN.USERS.EDIT(':id')}
                      element={<AdminUserEditPage />}
                    />
                    <Route
                      path={PROTECTED_ROUTES.ADMIN.USERS.PERMISSIONS(':id')}
                      element={<AdminUserPermissionsPage />}
                    />
                    <Route
                      path={PROTECTED_ROUTES.ADMIN.AUDIT_LOGS}
                      element={<AdminAuditLogsPage />}
                    />
                    <Route
                      path={PROTECTED_ROUTES.ADMIN.COMPANY_CONFIG}
                      element={<AdminCompanyConfigPage />}
                    />
                    <Route path={PROTECTED_ROUTES.ADMIN.SESSIONS} element={<AdminSessionsPage />} />
                  </Route>

                  {/* Utilitaires */}
                  <Route
                    path={PROTECTED_ROUTES.UTILS.NOTIFICATIONS}
                    element={<NotificationsPage />}
                  />
                  <Route path={PROTECTED_ROUTES.UTILS.HELP} element={<HelpPage />} />
                </Route>
              </Route>

              {/* Fallback 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageTransition>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
