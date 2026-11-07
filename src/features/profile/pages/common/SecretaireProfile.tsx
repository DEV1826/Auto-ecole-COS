'use client';

import * as React from 'react';
import {
  User,
  Shield,
  Settings,
  Mail,
  Bell,
  KeyRound,
  Monitor,
  Lightbulb,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/use.auth';
import type { Session } from '@/types/auth.types';
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
import { ProfileMobileNav } from '../../components/ProfileMobileNav';
import { ActiveSessionsPanel } from '../../components/ActiveSessionsPanel';
import type { ProfilePageProps } from '../../types';

export default function SecretaireProfile({
  session,
  user,
}: ProfilePageProps): React.JSX.Element {
  const isDesktop = !useIsMobile();
  const {
    updateUser,
    changePassword,
    getUserSessions,
    revokeSession,
    revokeAllUserSessions,
    logout,
  } = useAuth();

  const [activeSection, setActiveSection] = React.useState('profile');
  const [showSessions, setShowSessions] = React.useState(false);
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = React.useState(false);

  const loadSessions = React.useCallback(async () => {
    setSessionsLoading(true);
    try {
      const nextSessions = await getUserSessions(user.id);
      setSessions(nextSessions);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Impossible de charger les sessions actives'
      );
    } finally {
      setSessionsLoading(false);
    }
  }, [getUserSessions, user.id]);

  React.useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const handleUpdatePersonal = async (data: {
    nom?: string;
    prenom?: string;
    email?: string;
  }) => {
    await updateUser(user.id, {
      nom: data.nom,
      prenom: data.prenom,
    });
    toast.success('Profil secrétaire mis à jour');
  };

  const handleTerminateSession = async (sessionId: number) => {
    await revokeSession(sessionId);
    await loadSessions();
    toast.success('Session terminée');
  };

  const handleLogoutAll = async () => {
    await revokeAllUserSessions(user.id);
    toast.success('Toutes les sessions ont été fermées');
    await logout().catch(() => undefined);
  };

  const handleDeactivate = async () => {
    await updateUser(user.id, { actif: false });
    toast.success('Compte désactivé');
    await logout().catch(() => undefined);
  };

  const sections: SidebarSection[] = [
    { id: 'profile', label: 'Profil', icon: <User className="h-4 w-4" /> },
    { id: 'security', label: 'Securite', icon: <Shield className="h-4 w-4" /> },
    { id: 'preferences', label: 'Preferences', icon: <Settings className="h-4 w-4" /> },
    { id: 'danger', label: 'Sessions', icon: <LogOut className="h-4 w-4" /> },
  ];

  const renderContent = () => (
    <>
      {activeSection === 'profile' && (
        <ProfileSectionCard
          title="Informations personnelles"
          description="Mettez a jour vos informations de contact."
          icon={<User className="h-6 w-6" />}
          editTitle="Modifier mes informations"
          editContent={
            <PersonalInfoForm
              defaultValues={{
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
              }}
              onSubmit={handleUpdatePersonal}
              onCancel={() => {}}
            />
          }
        >
          <div className="grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-2">
            <ProfileInfoRow label="Prenom" value={user.prenom} icon={User} />
            <ProfileInfoRow label="Nom" value={user.nom} icon={User} />
            <ProfileInfoRow label="Email" value={user.email} icon={Mail} />
            <ProfileInfoRow label="Role" value="Secretaire" icon={Shield} />
          </div>
        </ProfileSectionCard>
      )}

      {activeSection === 'security' && (
        <div className="space-y-2">
          <ProfileSectionCard
            title="Securite"
            description="Protegez l'acces a votre compte."
            icon={<Shield className="h-6 w-6" />}
          >
            <div className="grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-2">
              <ProfileInfoRow
                label="Mot de passe"
                value="secret"
                icon={KeyRound}
                type="password"
                editContent={
                  <ChangePasswordForm
                    onSubmit={async (data) => {
                      await changePassword(data);
                    }}
                    onCancel={() => {}}
                    onSuccess={() => {}}
                  />
                }
                editModalTitle="Changer le mot de passe"
                editModalDescription="Choisissez un mot de passe securise."
                editDescription="Modifiez votre mot de passe."
              />
            </div>
          </ProfileSectionCard>

          <ProfileSectionCard
            title="Sessions et appareils"
            description="Consultez et gerez vos connexions."
            icon={<Monitor className="h-6 w-6" />}
          >
            <ProfileInfoRow
              label="Sessions actives"
              icon={Monitor}
              type="action"
              actionLabel="Gerer"
              onAction={() => setShowSessions(true)}
              editDescription="Visualisez les appareils actuellement connectes."
            >
              <div className="mt-1 text-sm text-muted-foreground">
                {sessions.length} session{sessions.length > 1 ? 's' : ''} active
                {sessions.length > 1 ? 's' : ''}
              </div>
            </ProfileInfoRow>
          </ProfileSectionCard>

          <ActiveSessionsPanel
            open={showSessions}
            onOpenChange={setShowSessions}
            sessions={sessions}
            isLoading={sessionsLoading}
            currentSessionId={session?.id}
            onTerminate={handleTerminateSession}
            onLogoutAll={handleLogoutAll}
          />
        </div>
      )}

      {activeSection === 'preferences' && (
        <ProfileSectionCard
          title="Preferences"
          description="Ajustez l'affichage de votre espace."
          icon={<Bell className="h-6 w-6" />}
        >
          <ProfileInfoRow label="Theme" icon={Lightbulb}>
            <ThemeToggle
              variant="dropdown"
              text="Systeme"
              showText
              className="mt-2 gap-2 border-none bg-transparent shadow-none hover:bg-transparent"
            />
          </ProfileInfoRow>
        </ProfileSectionCard>
      )}

      {activeSection === 'danger' && (
        <ProfileSectionCard
          title="Compte et sessions"
          description="Controlez les deconnexions et l'etat du compte."
          icon={<LogOut className="h-6 w-6" />}
        >
          <ProfileAccountSettings
            userName={`${user.nom} ${user.prenom}`}
            onSignOutAll={handleLogoutAll}
            onDeactivate={handleDeactivate}
            isActive={user.actif}
          />
        </ProfileSectionCard>
      )}
    </>
  );

  return (
    <div className="space-y-6 pb-5">
      <ProfileHeader
        session={session}
        user={user}
        greetingMessage="Bonjour"
        subtitle="Gestion des candidats, paiements et planning"
        contextMessage={[
          { text: 'Votre espace secretaire centralise les operations du jour pour ', highlight: false },
          { text: `${user.nom} ${user.prenom}`, highlight: true },
          { text: '.', highlight: false },
        ]}
        onAvatarChange={async () => {
          toast.info("La mise a jour de l'avatar sera branchee avec le stockage final.");
        }}
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
          <main className="min-w-0 flex-1">{renderContent()}</main>
        </div>
      )}
    </div>
  );
}
