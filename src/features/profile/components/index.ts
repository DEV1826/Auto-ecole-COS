/**
 * @module features/profile/components
 * @description Point d'entrée des composants du module profil VitaCare
 * @author Stive Junior
 * @version 1.0.0
 */

export { ProfileHeader } from './ProfileHeader';
export type { ProfileHeaderProps } from './ProfileHeader';
export type { ProfileSidebarProps } from './ProfileSidebar';
export { ProfileMobileNav } from './ProfileMobileNav';
export type { ProfileMobileNavProps } from './ProfileMobileNav';
export type { ProfileInfoRowProps } from './ProfileInfoRow';

export { ProfileSectionCard } from './ProfileSection';
export type { ProfileSectionCardProps } from './ProfileSection';

export { ProfileAccountSettings } from './ProfileAccountSettings';
export type { ProfileAccountSettingsProps } from './ProfileAccountSettings';

export { PersonalInfoForm, ChangePasswordForm } from './ProfileForms';

export { ProfileSidebar, type SidebarSection } from './ProfileSidebar';
export { ProfileInfoRow } from './ProfileInfoRow';
export * from './ProfileForms';
