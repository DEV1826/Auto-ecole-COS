/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * @module features/profile/pages/common/AdminProfile
 * @description
 * Page de profil pour le rôle ADMIN.
 *
 * ## Structure
 * - **En-tête** : `ProfileHeader` avec avatar, salutation, département, statistiques globales.
 * - **Navigation** : `ProfileSidebar` (desktop) / `ProfileMobileNav` (mobile) avec sections.
 * - **Sections** :
 *   1. **Profil** : informations personnelles (nom, email, téléphone, département).
 *   2. **Sécurité** : mot de passe, 2FA, sessions actives, historique.
 *   3. **Préférences** : notifications, affichage, préférences générales.
 *   4. **Confidentialité** : export de données, déconnexion globale, désactivation, suppression.
 *
 * ## Composants utilisés
 * - `ProfileHeader`, `ProfileSidebar`, `ProfileSectionCard`, `ProfileInfoRow`, `PersonalInfoForm`, `ChangePasswordForm`, `PreferencesForm`, `AdminInfoForm`, `TwoFactorAuthForm`, `ProfileAccountSettings`, `ProfileMobileNav`, `StatsCard`, `StatsGrid`.
 *
 * @author Stive Junior
 * @version 2.0.0
 */

import * as React from 'react';
import {
  User,
  Shield,
  Settings,
  Mail,
  Bell,
  ShieldCheck,
  KeyRound,
  Smartphone,
  Activity,
  Lightbulb,
  Monitor,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ProfileHeader,
  ProfileSidebar,
  ProfileInfoRow,
  ProfileAccountSettings,
  PersonalInfoForm,
  ChangePasswordForm,
  type SidebarSection,
  ProfileSectionCard,
} from '../../components';
import { useIsMobile } from '@/hooks/use-mobile';
import { ProfileMobileNav } from '../../components/ProfileMobileNav';
import type { ProfilePageProps } from '../../types';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import type { Session } from '@/types/auth.types';
import { ActiveSessionsPanel } from '../../components/ActiveSessionsPanel';

/**
 * Composant principal du profil administrateur.
 */
export default function AdminProfile({ session, user }: ProfilePageProps): React.JSX.Element {
  const isDesktop = !useIsMobile();

  // ── Données utilisateur (issues de la session ou user) ──────────────────
  const nom = user?.nom ?? '';
  const prenom = user?.prenom ?? '';
  const email = user?.email ?? '';

  // ── États pour la navigation ──────────────────────────────────────────────
  const [activeSection, setActiveSection] = React.useState('profile');

  const [showSessions, setShowSessions] = React.useState(false);
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = React.useState(false);

  // ── Handlers (mock asynchrones) ───────────────────────────────────────────
  const handleUpdatePersonal = async (_data: any) => {
    await new Promise((r) => setTimeout(r, 800));
    toast.success('Informations personnelles mises à jour');
  };

  const handleChangePassword = async (_data: any) => {
    await new Promise((r) => setTimeout(r, 800));
    toast.success('Mot de passe modifié');
  };

  const handleUpdatePreferences = async (_data: any) => {
    await new Promise((r) => setTimeout(r, 800));
    toast.success('Préférences enregistrées');
  };

  const handleExportData = async () => {
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Export lancé, vous recevrez un email');
  };

  const handleSignOutAll = async () => {
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Déconnecté de tous les appareils');
  };

  const terminateSession = async (sessionid: number) => {
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Déconnecté de tous les appareils');
  };

  const logoutAll = async () => {
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Déconnecté de tous les appareils');
  };

  const handleTerminateSession = async (sessionId: number) => {
    try {
      await terminateSession(session!.id);
      toast.success('Session terminée avec succès');
    } catch (err) {
      toast.error('Erreur lors de la terminaison de la session');
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAll();
      toast.success('Toutes les sessions ont été déconnectées');
    } catch (err) {
      toast.error('Erreur lors de la déconnexion globale');
    }
  };

  const handleDeactivate = async () => {
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Compte désactivé temporairement');
  };

  const handleDeleteAccount = async () => {
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Compte supprimé');
  };

  // Callback générique pour l'édition individuelle (via ProfileInfoRow)
  const updateField = async (field: string, value: unknown) => {
    console.log(`Mise à jour de ${field} avec ${value}`);
    await new Promise((r) => setTimeout(r, 500));
    toast.success(`${field} mis à jour`);
  };

  // ── Sections pour la sidebar et la navigation mobile ────────────────────
  const sections: SidebarSection[] = [
    { id: 'profile', label: 'Profil', icon: <User className="h-4 w-4" /> },
    { id: 'security', label: 'Sécurité', icon: <Shield className="h-4 w-4" /> },
    {
      id: 'preferences',
      label: 'Préférences',
      icon: <Settings className="h-4 w-4" />,
    },
    { id: 'danger', label: 'Confidentialité', icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  // ── Rendu du contenu selon la section active ────────────────────────────
  const renderContent = () => (
    <>
      {/* Section Profil */}
      {activeSection === 'profile' && (
        <ProfileSectionCard
          title="Informations personnelles"
          description="Nom, email, téléphone, département"
          icon={<User className="h-6 w-6" />}
          editTitle="Modifier mes informations personnelles"
          editContent={
            <PersonalInfoForm
              defaultValues={{
                nom,
                prenom,
                email,
              }}
              onSubmit={handleUpdatePersonal}
              onCancel={() => { }}
            />
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            <ProfileInfoRow
              label="Prénom"
              value={prenom}
              icon={User}
              type="text"
              onEdit={(val) => updateField('firstName', val)}
            />
            <ProfileInfoRow
              label="Nom"
              value={nom}
              icon={User}
              type="text"
              onEdit={(val) => updateField('lastName', val)}
            />
            <ProfileInfoRow
              label="Email"
              value={email}
              icon={Mail}
              type="email"
              onEdit={(val) => updateField('email', val)}
            />
          </div>
        </ProfileSectionCard>
      )}

      {/* Section Sécurité */}
      {activeSection === 'security' && (
        <div className="space-y-2">
          <ProfileSectionCard
            title="Sécurité"
            description="Gérez les paramètres de sécurité de votre compte"
            icon={<Shield className="h-6 w-6" />}
            editTitle="Modifier les paramètres de sécurité"
            editDescription="Mettez à jour les informations de sécurité de votre compte."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
              <ProfileInfoRow
                label="Mot de passe"
                value="secret"
                icon={KeyRound}
                type="password"
                editContent={
                  <ChangePasswordForm
                    onSubmit={handleChangePassword}
                    onCancel={() => { }}
                    onSuccess={() => { }}
                  />
                }
                editModalTitle="Changer le mot de passe"
                editModalDescription="Choisissez un mot de passe sécurisé"
                editDescription="Cliquez pour modifier votre mot de passe"
              />
            </div>
          </ProfileSectionCard>

          {/* Carte Sessions et Appareils */}
          <ProfileSectionCard
            title="Sessions et Appareils"
            description="Consultez et gérez les appareils connectés à votre compte."
            icon={<Monitor className="h-6 w-6" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
              <ProfileInfoRow
                label="Sessions actives"
                icon={Monitor}
                type="action"
                actionLabel="Gérer"
                actionIcon={Smartphone}
                onAction={() => setShowSessions(true)}
                editDescription="Consultez et gérez vos appareils connectés"
              >
                <div className="text-sm text-muted-foreground mt-1">
                  Gérez vos {sessions.length} appareils connectés
                </div>
              </ProfileInfoRow>

              <ProfileInfoRow
                label="Historique des connexions"
                value=""
                icon={Activity}
                type="action"
                actionLabel="Consulter"
                onAction={() => toast.info('Fonctionnalité à implémenter')}
                editDescription="Voir les dernières connexions à votre compte"
              />
            </div>
          </ProfileSectionCard>

          {/* Panneau des sessions actives */}
          {showSessions && (
            <ActiveSessionsPanel
              open={showSessions}
              onOpenChange={setShowSessions}
              sessions={sessions}
              isLoading={sessionsLoading}
              currentSessionId={session?.id}
              onTerminate={handleTerminateSession}
              onLogoutAll={handleLogoutAll}
            />
          )}
        </div>
      )}

      {/* Sous-sections des préférences */}
      {activeSection === 'preferences' && (
        <ProfileSectionCard
          title="Notifications"
          description="Gérez vos préférences de notification"
          icon={<Bell className="h-6 w-6" />}
          editTitle="Modifier les notifications"
        >
          <ProfileInfoRow label="Thème" icon={Lightbulb}>
            <ThemeToggle
              variant="dropdown"
              text="Système"
              showText
              className="gap-2 bg-transparent shadow-none hover:bg-transparent border-none mt-2"
            />
          </ProfileInfoRow>
        </ProfileSectionCard>
      )}

      {/* Section Confidentialité */}
      {activeSection === 'danger' && (
        <ProfileSectionCard
          title="Confidentialité"
          description="Gérez l’accès à vos données et les paramètres sensibles de votre compte."
          icon={<ShieldCheck className="h-6 w-6" />}
        >
          <ProfileAccountSettings
            userName={`${nom} ${prenom}`}
            onExportData={handleExportData}
            onSignOutAll={handleSignOutAll}
            onDeactivate={handleDeactivate}
            onDeleteAccount={handleDeleteAccount}
            isActive={user.actif}
          />
        </ProfileSectionCard>
      )}
    </>
  );

  // ── Rendu principal avec en-tête et layout responsive ─────────────────────
  return (
    <div className="space-y-6 pb-5">
      <ProfileHeader
        session={session}
        user={user}
        greetingMessage="Bonjour"
        contextMessage={[
          { text: 'Bienvenue sur votre espace administrateur, ', highlight: false },
          { text: nom, highlight: true },
          { text: ' 👋', highlight: false },
        ]}
        onAvatarChange={async (file) => console.log('Upload avatar:', file.name)}
      />

      {!isDesktop ? (
        <>
          <ProfileMobileNav
            sections={sections}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            className="mb-4"
          />
          <div className="mt-10">{renderContent()}</div>
        </>
      ) : (
        <div className="flex gap-6">
          <aside className="w-64 shrink-0">
            <ProfileSidebar
              sections={sections}
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              showDangerSeparator
            />
          </aside>
          <main className="flex-1 min-w-0">{renderContent()}</main>
        </div>
      )}
    </div>
  );
}
