/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * @module features/profile/pages/common/PatientProfile
 * @description
 * Page de profil pour le rôle PATIENT.
 * Layout responsive :
 * - Desktop : Sidebar latérale (gauche) + contenu principal (droite)
 * - Mobile : Navigation mobile (ProfileMobileNav) + contenu principal
 *
 * Sections :
 * 1. Informations personnelles (modifiables individuellement ou via formulaire)
 * 2. Dossier médical (modifiable globalement via formulaire, chaque champ éditable individuellement)
 * 3. Contact d'urgence (modifiable via formulaire dédié)
 * 4. Sécurité (mot de passe, 2FA, sessions actives, historique)
 * 5. Préférences (notifications, affichage, rappels médicaments, abonnement)
 * 6. Confidentialité (export, déconnexion globale, désactivation, suppression)
 *
 * @author Stive Junior
 * @version 1.1.0
 */

import * as React from 'react';
import {
  User,
  Shield,
  Settings,
  Phone,
  Mail,
  MapPin,
  Cake,
  VenusAndMars,
  Heart,
  Pill,
  FileText,
  Contact,
  Smartphone,
  KeyRound,
  Bell,
  Monitor,
  CreditCard,
  ShieldCheck,
  Activity,
  Droplet,
  Ruler,
  Weight,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ProfileHeader,
  ProfileSidebar,
  ProfileInfoRow,
  ProfileAccountSettings,
  PersonalInfoForm,
  ChangePasswordForm,
  PreferencesForm,
  type SidebarSection,
  ProfileSectionCard,
  PatientMedicalForm,
  EmergencyContactForm,
} from '../../components';
import { type ProfilePageProps } from '../../types';
import { useIsMobile } from '@/hooks/use-mobile';
import { TwoFactorAuthForm } from '../../components/TwoFactorAuthForm';
import {
  NotificationPreferencesView,
  DisplayPreferencesView,
  MedicationReminderPreferencesView,
  BillingPreferencesView,
} from '../../components/ProfilePreferences';
import { ProfileMobileNav } from '../../components/ProfileMobileNav';
import type {
  BillingPreferences,
  DisplayPreferences,
  MedicationReminderPreferences,
  NotificationPreferences,
  EmergencyContact,
  Session,
} from '@/types/models';
import type { UpdatePatientInput } from '@/lib';
import { ActiveSessionsPanel } from '../../components/ActiveSessionsPanel';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Composant principal du profil patient.
 */
export default function PatientProfile({ session, user }: ProfilePageProps): React.JSX.Element {
  const isDesktop = !useIsMobile();

  // ── Données utilisateur (réelles ou mockées) ──────────────────────────────
  const firstName = session?.firstName ?? user?.firstName ?? 'Jean';
  const lastName = session?.lastName ?? user?.lastName ?? 'Dupont';
  const email = session?.email ?? user?.email ?? 'jean.dupont@example.com';
  const phone = user?.phone ?? '+237 612345678';
  const location = 'Yaoundé, Cameroun';
  const dateOfBirth = user?.dateOfBirth ?? '1990-05-15';
  const gender = user?.gender ?? 'M';
  const avatar = user?.avatarUrl;

  // ── Données mockées pour le dossier médical ───────────────────────────────
  const PatientMedicalData: UpdatePatientInput = {
    bloodType: session?.patient?.bloodType ?? 'A+',
    height: session?.patient?.height ?? 175,
    weight: session?.patient?.weight ?? 72,
    allergies: session?.patient?.allergies ?? ['Pénicilline', 'Arachides'],
    chronicDiseases: session?.patient?.chronicDiseases ?? ['Hypertension artérielle'],
    medicalHistory:
      session?.patient?.medicalHistory ??
      'Appendicectomie en 2015, aucun antécédent familial notable.',
    insuranceProvider: session?.patient?.insuranceProvider ?? 'Mutuelle Générale',
    insurancePolicyNumber: session?.patient?.insurancePolicyNumber ?? 'MUT-123456',
  };

  // ── Données mockées pour le contact d'urgence ─────────────────────────────
  const mockEmergencyContact: EmergencyContact = {
    name: 'Marie Dupont',
    phone: '+237 698765432',
    relationship: 'Conjointe',
  };

  // ── États pour la sécurité ───────────────────────────────────────────────
  const [is2FAEnabled, setIs2FAEnabled] = React.useState(false);
  const [qrCodeUrl] = React.useState<string | undefined>(undefined);
  const [secret] = React.useState<string | undefined>(undefined);
  const [showSessions, setShowSessions] = React.useState(false);
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = React.useState(false);

  // ── Préférences mockées ──────────────────────────────────────────────────
  const mockNotificationPrefs: NotificationPreferences = {
    email: true,
    push: true,
    sms: false,
    appointmentReminders: true,
    medicationReminders: true,
    healthAlerts: true,
    marketing: false,
    appointmentReminderLeadTime: 60,
  };

  const mockDisplayPrefs: DisplayPreferences = {
    fontSize: 16,
    language: 'fr',
  };

  const mockMedicationPrefs: MedicationReminderPreferences = {
    enabled: true,
    defaultChannel: 'push',
    snoozeMinutes: 15,
    missedReminderDelay: 30,
    requireConfirmation: true,
    allowPhotoProof: false,
  };

  const mockBillingPrefs: BillingPreferences = {
    plan: 'free',
    subscriptionEndDate: '2025-12-31',
    autoRenew: false,
    currency: 'XAF',
    invoiceEmail: email,
  };

  // ── Actions du store ──────────────────────────────────────────────────────
  const getActiveSessions = useAuthStore((state) => state.getActiveSessions);
  const terminateSession = useAuthStore((state) => state.terminateSession);
  const logoutAll = useAuthStore((state) => state.logoutAll);

  // ── Chargement des sessions ───────────────────────────────────────────────
  const loadSessions = React.useCallback(async () => {
    setSessionsLoading(true);
    try {
      const data = await getActiveSessions();
      console.log('Sessions chargées:', data); // Garde-le temporairement pour debug
      setSessions(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Impossible de charger les sessions actives');
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, [getActiveSessions]);

  React.useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Fonctions de gestion
  const handleTerminateSession = async (sessionId: string) => {
    try {
      await terminateSession(sessionId);
      toast.success('Session terminée avec succès');
      await loadSessions(); // Rafraîchir la liste
    } catch (err) {
      toast.error('Erreur lors de la terminaison de la session');
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAll();
      toast.success('Toutes les sessions ont été déconnectées');
      await loadSessions();
    } catch (err) {
      toast.error('Erreur lors de la déconnexion globale');
    }
  };
  // ── Handlers (mock avec délai) ───────────────────────────────────────────
  const handleUpdatePersonal = async (_data: any) => {
    await new Promise((r) => setTimeout(r, 800));
    toast.success('Informations personnelles mises à jour');
  };

  const handleUpdateMedical = async (_data: UpdatePatientInput) => {
    await new Promise((r) => setTimeout(r, 800));
    toast.success('Dossier médical mis à jour');
  };

  const handleUpdateEmergency = async (_data: EmergencyContact) => {
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Contact d'urgence mis à jour");
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

  const handleDeactivate = async () => {
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Compte désactivé temporairement');
  };

  const handleDeleteAccount = async () => {
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Compte supprimé');
  };

  const handleEnable2FA = async (_code: string) => {
    await new Promise((r) => setTimeout(r, 1000));
    setIs2FAEnabled(true);
    toast.success('Double authentification activée');
  };

  const handleDisable2FA = async (_password: string) => {
    await new Promise((r) => setTimeout(r, 1000));
    setIs2FAEnabled(false);
    toast.success('Double authentification désactivée');
  };

  // Callback générique pour l'édition individuelle (via ProfileInfoRow)
  const updateField = async (field: string, value: unknown) => {
    console.log(`Mise à jour de ${field} avec ${value}`);
    await new Promise((r) => setTimeout(r, 500));
    toast.success(`${field} mis à jour`);
  };

  // État pour la navigation
  const [activeSection, setActiveSection] = React.useState('profile');

  // Sections pour la sidebar et la navigation mobile
  const sections: SidebarSection[] = [
    { id: 'profile', label: 'Profil', icon: <User className="h-4 w-4" /> },
    { id: 'medical', label: 'Dossier médical', icon: <Heart className="h-4 w-4" /> },
    { id: 'emergency', label: "Contact d'urgence", icon: <Contact className="h-4 w-4" /> },
    { id: 'security', label: 'Sécurité', icon: <Shield className="h-4 w-4" /> },
    {
      id: 'preferences',
      label: 'Préférences',
      icon: <Settings className="h-4 w-4" />,
      children: [
        {
          id: 'preferences-notifications',
          label: 'Notifications',
          icon: <Bell className="h-4 w-4" />,
        },
        { id: 'preferences-display', label: 'Affichage', icon: <Monitor className="h-4 w-4" /> },
        {
          id: 'preferences-medication',
          label: 'Rappels médicaments',
          icon: <Pill className="h-4 w-4" />,
        },
        {
          id: 'preferences-billing',
          label: 'Abonnement',
          icon: <CreditCard className="h-4 w-4" />,
        },
      ],
    },
    { id: 'danger', label: 'Confidentialité', icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  // ── Rendu du contenu selon la section active ──────────────────────────────
  const renderContent = () => (
    <>
      {/* Section Profil */}
      {activeSection === 'profile' && (
        <ProfileSectionCard
          title="Informations personnelles"
          description="Nom, email, téléphone, date de naissance, genre, localisation"
          icon={<User className="h-6 w-6" />}
          editTitle="Modifier mes informations personnelles"
          editContent={
            <PersonalInfoForm
              defaultValues={{
                firstName,
                lastName,
                email,
                phone,
                dateOfBirth,
                gender,
                avatarUrl: avatar,
              }}
              onSubmit={handleUpdatePersonal}
              onCancel={() => {}}
            />
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            <ProfileInfoRow
              label="Prénom"
              value={firstName}
              icon={User}
              type="text"
              onEdit={(val) => updateField('firstName', val)}
            />
            <ProfileInfoRow
              label="Nom"
              value={lastName}
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
            <ProfileInfoRow
              label="Téléphone"
              value={phone}
              icon={Phone}
              type="phone"
              onEdit={(val) => updateField('phone', val)}
            />
            <ProfileInfoRow
              label="Date de naissance"
              value={dateOfBirth ? new Date(dateOfBirth).toLocaleDateString('fr-FR') : null}
              icon={Cake}
              type="date"
              onEdit={(val) => updateField('dateOfBirth', val)}
            />
            <ProfileInfoRow
              label="Genre"
              value={gender === 'M' ? 'Homme' : gender === 'F' ? 'Femme' : 'Autre'}
              icon={VenusAndMars}
              type="select"
              options={[
                { value: 'M', label: 'Homme' },
                { value: 'F', label: 'Femme' },
                { value: 'O', label: 'Autre' },
              ]}
              onEdit={(val) => updateField('gender', val)}
            />
            <ProfileInfoRow
              label="Localisation"
              value={location}
              icon={MapPin}
              type="text"
              onEdit={(val) => updateField('location', val)}
            />
          </div>
        </ProfileSectionCard>
      )}

      {/* Section Dossier médical */}
      {activeSection === 'medical' && (
        <ProfileSectionCard
          title="Dossier médical"
          description="Groupe sanguin, taille, poids, allergies, maladies chroniques, antécédents, assurance"
          icon={<Heart className="h-6 w-6" />}
          editTitle="Modifier mon dossier médical"
          editContent={
            <PatientMedicalForm
              defaultValues={PatientMedicalData}
              onSubmit={handleUpdateMedical}
              onCancel={() => {}}
            />
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            <ProfileInfoRow
              label="Groupe sanguin"
              value={PatientMedicalData.bloodType}
              icon={Droplet}
              type="select"
              options={[
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' },
              ]}
              onEdit={(val) => updateField('bloodType', val)}
            />
            <ProfileInfoRow
              label="Taille"
              value={PatientMedicalData.height}
              icon={Ruler}
              type="number"
              unit="cm"
              min={0}
              max={300}
              onEdit={(val) => updateField('height', val)}
            />
            <ProfileInfoRow
              label="Poids"
              value={PatientMedicalData.weight}
              icon={Weight}
              type="number"
              unit="kg"
              min={0}
              max={500}
              onEdit={(val) => updateField('weight', val)}
            />
            <div className="col-span-2">
              <ProfileInfoRow
                label="Allergies"
                value={PatientMedicalData.allergies?.join(', ') || 'Aucune'}
                icon={AlertCircle}
                type="textarea"
                onEdit={(val) => updateField('allergies', val)}
              />
            </div>
            <div className="col-span-2">
              <ProfileInfoRow
                label="Maladies chroniques"
                value={PatientMedicalData.chronicDiseases?.join(', ') || 'Aucune'}
                icon={Pill}
                type="textarea"
                onEdit={(val) => updateField('chronicDiseases', val)}
              />
            </div>
            <div className="col-span-2">
              <ProfileInfoRow
                label="Antécédents médicaux"
                value={PatientMedicalData.medicalHistory}
                icon={FileText}
                type="textarea"
                onEdit={(val) => updateField('medicalHistory', val)}
              />
            </div>
            <ProfileInfoRow
              label="Assurance"
              value={PatientMedicalData.insuranceProvider}
              icon={Shield}
              type="text"
              onEdit={(val) => updateField('insuranceProvider', val)}
            />
            <ProfileInfoRow
              label="N° de police"
              value={PatientMedicalData.insurancePolicyNumber}
              icon={Shield}
              type="text"
              onEdit={(val) => updateField('insurancePolicyNumber', val)}
            />
          </div>
        </ProfileSectionCard>
      )}

      {/* Section Contact d'urgence */}
      {activeSection === 'emergency' && (
        <ProfileSectionCard
          title="Contact d'urgence"
          description="Personne à contacter en cas d'urgence"
          icon={<Contact className="h-6 w-6" />}
          editTitle="Modifier le contact d'urgence"
          editDescription="Mettez à jour les informations de la personne à contacter en cas d'urgence."
          editContent={
            <EmergencyContactForm
              defaultValues={mockEmergencyContact}
              onSubmit={handleUpdateEmergency}
              onCancel={() => {}}
            />
          }
        >
          <div className="space-y-4">
            <ProfileInfoRow
              label="Nom complet"
              value={mockEmergencyContact.name}
              icon={Contact}
              type="text"
              onEdit={(val) => updateField('emergencyName', val)}
              editContent={
                <EmergencyContactForm
                  defaultValues={mockEmergencyContact}
                  onSubmit={handleUpdateEmergency}
                  onCancel={() => {}}
                />
              }
              editModalTitle="Modifier le contact d'urgence"
              editModalDescription="Mettez à jour les informations de la personne à contacter en cas d'urgence."
            />
            <ProfileInfoRow
              label="Téléphone"
              value={mockEmergencyContact.phone}
              icon={Phone}
              type="phone"
              onEdit={(val) => updateField('emergencyPhone', val)}
              editContent={
                <EmergencyContactForm
                  defaultValues={mockEmergencyContact}
                  onSubmit={handleUpdateEmergency}
                  onCancel={() => {}}
                />
              }
            />
            <ProfileInfoRow
              label="Relation"
              value={mockEmergencyContact.relationship}
              icon={Contact}
              type="text"
              onEdit={(val) => updateField('emergencyRelationship', val)}
              editContent={
                <EmergencyContactForm
                  defaultValues={mockEmergencyContact}
                  onSubmit={handleUpdateEmergency}
                  onCancel={() => {}}
                />
              }
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
                    onCancel={() => {}}
                    onSuccess={() => {}}
                  />
                }
                editModalTitle="Changer le mot de passe"
                editModalDescription="Choisissez un mot de passe sécurisé"
                editDescription="Cliquez pour modifier votre mot de passe"
              />

              <ProfileInfoRow
                label="Authentification à deux facteurs"
                value={is2FAEnabled}
                statusBadge
                icon={Shield}
                actionLabel={is2FAEnabled ? 'Gérer' : 'Activer'}
                actionIcon={Smartphone}
                editContent={
                  <TwoFactorAuthForm
                    isEnabled={is2FAEnabled}
                    onEnable={handleEnable2FA}
                    onDisable={handleDisable2FA}
                    qrCodeUrl={qrCodeUrl}
                    secret={secret}
                    onCancel={() => {}}
                  />
                }
                editModalTitle="Authentification à deux facteurs"
                editModalDescription="Protégez votre compte avec une vérification supplémentaire"
                editDescription="Cliquez pour configurer la double authentification"
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
              currentSessionId={session?.sessionId}
              onTerminate={handleTerminateSession}
              onLogoutAll={handleLogoutAll}
            />
          )}
        </div>
      )}

      {/* Sous-sections des préférences */}
      {activeSection === 'preferences-notifications' && (
        <ProfileSectionCard
          title="Notifications"
          description="Gérez vos préférences de notification"
          icon={<Bell className="h-6 w-6" />}
          editTitle="Modifier les notifications"
          editContent={<PreferencesForm onSubmit={handleUpdatePreferences} />}
        >
          <NotificationPreferencesView preferences={mockNotificationPrefs} />
        </ProfileSectionCard>
      )}
      {activeSection === 'preferences-display' && (
        <ProfileSectionCard
          title="Affichage"
          description="Personnalisez l'apparence"
          icon={<Monitor className="h-6 w-6" />}
          editTitle="Modifier l'affichage"
          editContent={<PreferencesForm onSubmit={handleUpdatePreferences} />}
        >
          <DisplayPreferencesView preferences={mockDisplayPrefs} />
        </ProfileSectionCard>
      )}
      {activeSection === 'preferences-medication' && (
        <ProfileSectionCard
          title="Rappels médicaments"
          description="Configurez les rappels de prise"
          icon={<Pill className="h-6 w-6" />}
          editTitle="Modifier les rappels"
          editContent={<PreferencesForm onSubmit={handleUpdatePreferences} />}
        >
          <MedicationReminderPreferencesView preferences={mockMedicationPrefs} />
        </ProfileSectionCard>
      )}
      {activeSection === 'preferences-billing' && (
        <ProfileSectionCard
          title="Facturation"
          description="Gérez votre abonnement et vos factures"
          icon={<CreditCard className="h-6 w-6" />}
          editTitle="Modifier la facturation"
          editContent={<PreferencesForm onSubmit={handleUpdatePreferences} />}
        >
          <BillingPreferencesView preferences={mockBillingPrefs} />
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
            userName={`${firstName} ${lastName}`}
            onExportData={handleExportData}
            onSignOutAll={handleSignOutAll}
            onDeactivate={handleDeactivate}
            onDeleteAccount={handleDeleteAccount}
            isActive={true}
          />
        </ProfileSectionCard>
      )}
    </>
  );

  // ── Rendu principal avec en-tête et layout responsive ─────────────────────
  return (
    <div className="space-y-2 pb-5">
      <ProfileHeader
        session={session}
        user={user}
        greetingMessage="Bonjour"
        contextMessage={[
          { text: 'Bienvenue sur votre espace patient, ', highlight: false },
          { text: firstName, highlight: true },
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
        <div className="flex gap-2">
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
