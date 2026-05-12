/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * @module features/profile/pages/common/DoctorProfile
 * @description
 * Page de profil pour le rôle DOCTEUR.
 * Layout responsive :
 * - Desktop : Sidebar latérale (gauche) + contenu principal (droite)
 * - Mobile : Tabs horizontaux (ScrollArea) pour la navigation
 *
 * Chaque section utilise `ProfileInfoRow` pour afficher les champs éditables individuellement.
 * Les modifications ouvrent un `EditFieldDialog` avec validation adaptée.
 *
 * @author Stive Junior
 * @version 2.0.0
 */

import * as React from 'react';
import {
  User,
  Stethoscope,
  Shield,
  Settings,
  Phone,
  Mail,
  MapPin,
  Cake,
  VenusAndMars,
  Building2,
  Hash,
  DollarSign,
  Video,
  Stars,
  Smartphone,
  KeyRound,
  Clock,
  CreditCard,
  Pill,
  Monitor,
  Bell,
  ShieldCheck,
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
  DoctorProfessionalForm,
  type SidebarSection,
  ProfileSectionCard,
  DoctorAvailabilityForm,
} from '../../components';
import { MEDICAL_SPECIALIZATIONS, type ProfilePageProps } from '../../types';
import { useIsMobile } from '@/hooks/use-mobile';
import { AvailabilityCalendar } from '../../components/AvailabilityCalendar';
import { TwoFactorAuthForm } from '../../components/TwoFactorAuthForm';

import type {
  Availability,
  BillingPreferences,
  DisplayPreferences,
  MedicationReminderPreferences,
  NotificationPreferences,
} from '@/types/models';
import {
  NotificationPreferencesView,
  DisplayPreferencesView,
  MedicationReminderPreferencesView,
  BillingPreferencesView,
} from '../../components/ProfilePreferences';
import { ProfileMobileNav } from '../../components/ProfileMobileNav';
/**
 * Composant principal du profil médecin.
 */
export default function DoctorProfile({ session, user }: ProfilePageProps): React.JSX.Element {
  const isDesktop = !useIsMobile();

  // Données utilisateur
  const firstName = session?.firstName ?? user?.firstName ?? '';
  const lastName = session?.lastName ?? user?.lastName ?? '';
  const email = session?.email ?? user?.email ?? '';
  const phone = user?.phone ?? '';
  const location = session?.doctor?.city ?? '';
  const dateOfBirth = user?.dateOfBirth ?? session?.doctor?.dateOfBirth;

  const gender = session?.doctor?.gender ?? user?.gender;
  const avatar = session?.doctor?.avatarUrl;
  const doctor = session?.doctor;

  // États pour la navigation
  const [activeSection, setActiveSection] = React.useState('profile');

  // ── Données mockées pour les disponibilités ──────────────────────────────
  const mockAvailabilities: Availability[] = [
    {
      id: '1',
      doctorId: doctor?.id ?? 'doctor-id',
      dayOfWeek: 'MONDAY',
      startTime: '09:00',
      endTime: '12:00',
      isRecurring: true,
      isActive: true,
    },
    {
      id: '2',
      doctorId: doctor?.id ?? 'doctor-id',
      dayOfWeek: 'MONDAY',
      startTime: '14:00',
      endTime: '17:00',
      isRecurring: true,
      isActive: true,
    },
    {
      id: '3',
      doctorId: doctor?.id ?? 'doctor-id',
      dayOfWeek: 'TUESDAY',
      startTime: '10:00',
      endTime: '13:00',
      isRecurring: true,
      isActive: true,
    },
    {
      id: '4',
      doctorId: doctor?.id ?? 'doctor-id',
      dayOfWeek: 'WEDNESDAY',
      startTime: '09:00',
      endTime: '12:00',
      isRecurring: true,
      isActive: false,
    },
    {
      id: '5',
      doctorId: doctor?.id ?? 'doctor-id',
      dayOfWeek: 'THURSDAY',
      startTime: '14:00',
      endTime: '18:00',
      isRecurring: true,
      isActive: true,
    },
    {
      id: '6',
      doctorId: doctor?.id ?? 'doctor-id',
      dayOfWeek: 'FRIDAY',
      startTime: '08:00',
      endTime: '12:00',
      isRecurring: true,
      isActive: true,
    },
  ];

  // ── États pour la 2FA ─────────────────────────────────────────────────────
  const [is2FAEnabled, setIs2FAEnabled] = React.useState(false);
  const [qrCodeUrl] = React.useState<string | undefined>(undefined);
  const [secret] = React.useState<string | undefined>(undefined);
  const activeSessionsCount = 3; // Nombre de sessions actives (mock)

  const [availabilities, setAvailabilities] = React.useState<Availability[]>(mockAvailabilities);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleUpdatePersonal = async (_data: any) => {
    await new Promise((r) => setTimeout(r, 800));
    console.log('personal updated', _data);
  };
  const handleUpdateProfessional = async (_data: any) => {
    await new Promise((r) => setTimeout(r, 800));
    console.log('professional updated', _data);
  };
  const handleChangePassword = async (_data: any) => {
    await new Promise((r) => setTimeout(r, 800));
  };
  const handleDeleteAccount = async () => {
    await new Promise((r) => setTimeout(r, 1000));
  };
  const handleExportData = async () => {
    await new Promise((r) => setTimeout(r, 1000));
  };
  const handleSignOutAll = async () => {
    await new Promise((r) => setTimeout(r, 1000));
  };
  const handleDeactivate = async () => {
    await new Promise((r) => setTimeout(r, 1000));
  };

  const handleSaveSlot = async (slot: Availability) => {
    console.log('Save slot', slot);
    await new Promise((r) => setTimeout(r, 500));
    if (slot.id) {
      // Modification
      setAvailabilities((prev) => prev.map((s) => (s.id === slot.id ? slot : s)));
    } else {
      const newSlot = { ...slot, id: Date.now().toString() };
      setAvailabilities((prev) => [...prev, newSlot]);
    }
    toast.success('Créneau enregistré');
  };

  const handleEnable2FA = async (code: string) => {
    console.log('Enabling 2FA with code', code);
    await new Promise((r) => setTimeout(r, 1000));
    setIs2FAEnabled(true);
    toast.success('Double authentification activée');
  };

  // Suppression d’un créneau
  const handleDeleteSlot = async (id: string) => {
    console.log('Delete slot', id);
    await new Promise((r) => setTimeout(r, 500));
    setAvailabilities((prev) => prev.filter((s) => s.id !== id));
    toast.success('Créneau supprimé');
  };

  const handleDisable2FA = async (password: string) => {
    console.log('Disabling 2FA with password', password);
    await new Promise((r) => setTimeout(r, 1000));
    setIs2FAEnabled(false);
    toast.success('Double authentification désactivée');
  };

  // Callbacks pour l'édition individuelle des champs (via ProfileInfoRow)
  const updateField = async (field: string, value: unknown) => {
    console.log(`Mise à jour de ${field} avec ${value}`);
    await new Promise((r) => setTimeout(r, 500));
  };

  // Sections pour la sidebar (desktop) et les Tabs (mobile)

  // Dans DoctorProfile.tsx, remplacer la définition de 'sections' :

  const sections: SidebarSection[] = [
    { id: 'profile', label: 'Profil', icon: <User className="h-4 w-4" /> },
    { id: 'professional', label: 'Professionnel', icon: <Stethoscope className="h-4 w-4" /> },
    { id: 'availability', label: 'Disponibilités', icon: <Clock className="h-4 w-4" /> },
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

  // Ajouter des données mockées pour les préférences (dans le composant)
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
    fontSize: 14,
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

  const renderContent = () => (
    <>
      {/* Section Profil (inchangée) */}
      {activeSection === 'profile' && (
        <ProfileSectionCard
          title="Informations personnelles"
          description="Nom, email, téléphone, date de naissance"
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
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
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
              value={
                gender === 'M'
                  ? 'Homme'
                  : gender === 'F'
                    ? 'Femme'
                    : gender === 'O'
                      ? 'Autre'
                      : null
              }
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

      {/* Section Professionnel */}
      {activeSection === 'professional' && (
        <ProfileSectionCard
          title="Informations professionnelles"
          description="Spécialité, licence, cabinet, tarifs"
          icon={<Stethoscope className="h-6 w-6" />}
          editTitle="Modifier mes informations professionnelles"
          editContent={
            <DoctorProfessionalForm
              defaultValues={{
                specialization: doctor?.specialization ?? '',
                licenseNumber: doctor?.licenseNumber ?? '',
                bio: doctor?.bio ?? '',
                address: doctor?.address ?? '',
                city: doctor?.city ?? '',
                consultationFee: doctor?.consultationFee ?? undefined,
                teleconsultationEnabled: doctor?.teleconsultationEnabled ?? false,
                cabinet: doctor?.cabinet ?? '',
              }}
              onSubmit={handleUpdateProfessional}
              onCancel={() => {}}
            />
          }
        >
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <ProfileInfoRow
              label="Spécialité"
              value={doctor?.specialization}
              icon={Stethoscope}
              type="command"
              options={MEDICAL_SPECIALIZATIONS.map((spec) => ({ value: spec, label: spec }))}
              onEdit={(val) => updateField('specialization', val)}
            />
            <ProfileInfoRow
              label="Numéro de licence"
              value={doctor?.licenseNumber}
              icon={Hash}
              type="text"
              onEdit={(val) => updateField('licenseNumber', val)}
            />
            <ProfileInfoRow
              label="Cabinet / Établissement"
              value={doctor?.cabinet}
              icon={Building2}
              type="text"
              onEdit={(val) => updateField('cabinet', val)}
            />
            <ProfileInfoRow
              label="Ville"
              value={doctor?.city}
              icon={MapPin}
              type="text"
              onEdit={(val) => updateField('city', val)}
            />
            <ProfileInfoRow
              label="Tarif de consultation"
              value={doctor?.consultationFee}
              icon={DollarSign}
              type="number"
              unit="FCFA"
              min={0}
              onEdit={(val) => updateField('consultationFee', val)}
            />
            <ProfileInfoRow
              label="Téléconsultation"
              value={doctor?.teleconsultationEnabled}
              icon={Video}
              type="boolean"
              onEdit={(val) => updateField('teleconsultationEnabled', val)}
            />
          </div>
          {doctor?.bio && (
            <div className="mt-4 pt-2 border-t">
              <ProfileInfoRow
                label="Biographie"
                value={doctor?.bio}
                icon={Stars}
                type="textarea"
                onEdit={(val) => updateField('bio', val)}
              />
            </div>
          )}
        </ProfileSectionCard>
      )}

      {/* Section Disponibilités */}
      {activeSection === 'availability' && (
        <ProfileSectionCard
          title="Disponibilités"
          description="Gérez vos créneaux de consultation"
          icon={<Clock className="h-6 w-6" />}
          editTitle="Modifier mes disponibilités"
          editContent={
            <DoctorAvailabilityForm
              defaultValues={availabilities}
              onSubmit={async (s) => console.log(s.length)}
            />
          }
        >
          <AvailabilityCalendar
            availabilities={availabilities}
            onSave={handleSaveSlot}
            onDelete={handleDeleteSlot}
          />
        </ProfileSectionCard>
      )}

      {/* Section Sécurité */}
      {activeSection === 'security' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            {/* Mot de passe */}
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

            {/* Double authentification (2FA) */}
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

            {/* Sessions actives */}
            <ProfileInfoRow
              label="Sessions actives"
              value={activeSessionsCount}
              icon={Smartphone}
              type="action"
              actionLabel="Gérer"
              actionIcon={Smartphone}
              onAction={async () => {
                // Ouvrir un modal listant les sessions actives
                toast.info('Fonctionnalité à implémenter');
              }}
              editDescription="Consultez et gérez vos sessions actives"
            />

            {/* Historique des connexions */}
            <ProfileInfoRow
              label="Historique des connexions"
              value=""
              icon={Smartphone}
              type="action"
              actionLabel="Consulter"
              onAction={async () => {
                // Naviguer vers une page d'historique ou ouvrir un modal
                toast.info('Fonctionnalité à implémenter');
              }}
              editDescription="Voir les dernières connexions à votre compte"
            />
          </div>
        </div>
      )}

      {activeSection === 'preferences-notifications' && (
        <ProfileSectionCard
          title="Notifications"
          description="Gérez vos préférences de notification"
          icon={<Bell className="h-6 w-6" />}
          editTitle="Modifier les notifications"
          editContent={<div>Formulaire à venir</div>}
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
          editContent={<div>Formulaire à venir</div>}
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
          editContent={<PreferencesForm onSubmit={async (data) => console.log(data)} />}
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
          editContent={<div>Formulaire à venir</div>}
        >
          <BillingPreferencesView preferences={mockBillingPrefs} />
        </ProfileSectionCard>
      )}

      {/* Section Confidentialité (anciennement zone dangereuse) */}
      {activeSection === 'danger' && (
        <ProfileSectionCard
          title="Confidentialité"
          icon={<ShieldCheck className="h-6 w-6" />}
          description="Gérez l’accès à vos données et les paramètres sensibles de votre compte."
        >
          <ProfileAccountSettings
            userName={`${user.firstName} ${user.lastName}`}
            onExportData={handleExportData}
            onSignOutAll={handleSignOutAll}
            onDeactivate={handleDeactivate}
            onDeleteAccount={handleDeleteAccount}
            isActive={user.isActive}
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
        greetingMessage="Bienvenue Dr."
        contextMessage={[
          { text: 'Vous avez ', highlight: false },
          { text: '3 consultations', highlight: true },
          { text: " aujourd'hui." },
        ]}
        subtitle={doctor?.specialization}
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
