/**
 * @module features/admin/pages/AdminCompanyConfigPage
 * @description
 * Page de configuration de l’entreprise pour l’administrateur.
 * Thème : Bleu (accent blue-700).
 *
 * Layout :
 * ─ En-tête : `ProfileHeader` avec avatar (logo de l’entreprise), titre, message contextuel
 * ─ Sidebar de navigation (desktop) / menu mobile pour les sections :
 *     • Informations générales
 *     • Adresse
 *     • Législation
 *     • Logo
 *     • Utilisateurs du système (admins, secrétaires, moniteurs)
 *     • Avancé (métadonnées + À propos – développeur)
 * ─ Chaque section éditable utilise `ProfileSectionCard` avec `ProfileInfoRow` et modale d’édition
 * ─ Validation Zod pour tous les champs
 * ─ Données mockées (à remplacer par des appels API réels)
 *
 * @author Stive Junior
 * @version 2.0.0
 *
 * @example
 * ```tsx
 * <AdminCompanyConfigPage />
 * ```
 */

import * as React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  Settings,
  ShieldCheck,
  Upload,
  Users,
  UserCog,
  CalendarCheck,
  GraduationCap,
  Eye,
  Pencil,
  Power,
  ImageIcon,
  Camera,
  Code,
  LockIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn, getAvatarUrl } from '@/lib/utils';

// Composants UI
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Composants réutilisables du profil
import {
  ProfileSidebar,
  ProfileSectionCard,
  ProfileInfoRow,
  type SidebarSection,
} from '@/features/profile/components';
import { ProfileMobileNav } from '@/features/profile/components/ProfileMobileNav';

// Types
import type { CompanyConfig } from '@/types/admin.types';
import type { Utilisateur } from '@/types/auth.types';
import { appConfig } from '@/config';

// ============================================================
// SCHÉMAS DE VALIDATION ZOD
// ============================================================

/**
 * Schéma de validation pour les informations générales.
 */
const generalInfoSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  telephone: z
    .string()
    .regex(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{4,12}$/,
      'Numéro de téléphone invalide'
    )
    .optional()
    .nullable(),
  email: z.email('Email invalide').optional().nullable(),
  siteWeb: z.string().url('URL invalide').optional().nullable(),
});

/**
 * Schéma de validation pour l’adresse.
 */
const addressSchema = z.object({
  adresse: z.string().max(255).optional().nullable(),
});

/**
 * Schéma de validation pour les informations légales.
 */
const legalSchema = z.object({
  numeroFiscal: z.string().max(50).optional().nullable(),
});

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA & HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// ============================================================
// DONNÉES MOCKÉES (à remplacer par des appels API réels)
// ============================================================

/**
 * Génère une configuration d’entreprise fictive.
 */
function generateMockCompanyConfig(): CompanyConfig {
  return {
    id: 1,
    nom: 'COS Auto-École',
    adresse: '123 Avenue de la Conduite, Quartier Omnisport, Yaoundé, Cameroun',
    telephone: '+237 6 00 00 00 00',
    email: 'contact@cos-autoecole.com',
    siteWeb: 'https://www.cos-autoecole.com',
    numeroFiscal: 'CI-2025-001234',
    logoPath: appConfig.logo,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  };
}

/**
 * Génère une liste d’utilisateurs mockés (admins, secrétaires, moniteurs).
 */
function generateMockSystemUsers(): Utilisateur[] {
  return [
    {
      id: 1,
      email: 'admin@cos.com',
      nom: 'Admin',
      prenom: 'Super',
      role: 'ADMIN',
      niveau: 'SUPER_ADMIN',
      actif: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date(),
      displayName: 'Super Admin',
    },
    {
      id: 2,
      email: 'secretaire@cos.com',
      nom: 'Dupont',
      prenom: 'Marie',
      role: 'SECRETAIRE',
      niveau: 'STANDARD',
      actif: true,
      createdAt: new Date('2023-02-15'),
      updatedAt: new Date(),
      displayName: 'Marie Dupont',
    },
    {
      id: 3,
      email: 'moniteur1@cos.com',
      nom: 'Martin',
      prenom: 'Jean',
      role: 'MONITEUR',
      niveau: 'STANDARD',
      actif: true,
      createdAt: new Date('2023-03-10'),
      updatedAt: new Date(),
      displayName: 'Jean Martin',
    },
    {
      id: 4,
      email: 'moniteur2@cos.com',
      nom: 'Dubois',
      prenom: 'Marc',
      role: 'MONITEUR',
      niveau: 'STANDARD',
      actif: false,
      createdAt: new Date('2023-04-20'),
      updatedAt: new Date(),
      displayName: 'Marc Dubois',
    },
  ];
}


// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT : DIALOG D'ÉDITION UNIVERSEL
// ─────────────────────────────────────────────────────────────────────────────

// ============================================================
// COMPOSANT : MODAL/DRAWER D'ÉDITION DE CHAMP
// ============================================================

interface EditFieldProps {
  field: string;
  label: string;
  value: string | null | undefined;
  type?: 'text' | 'textarea' | 'email' | 'url' | 'tel';
  rows?: number;
  schema?: z.ZodSchema;
  onSave: (value: string) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditFieldDialog = ({
  field,
  label,
  value,
  type = 'text',
  rows,
  schema,
  onSave,
  open,
  onOpenChange,
}: EditFieldProps): React.JSX.Element => {
  const [inputValue, setInputValue] = React.useState(value ?? '');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const isMobile = useIsMobile();

  const handleSave = async () => {
    setError(null);
    if (schema) {
      const result = schema.safeParse({ [field]: inputValue });
      if (!result.success) {
        setError(result.error.message ?? 'Valeur invalide');
        return;
      }
    }
    setLoading(true);
    try {
      await onSave(inputValue);
      onOpenChange(false);
      toast.success(`${label} mis à jour`);
    } catch (err) {
      toast.error(`Erreur lors de la mise à jour de ${label}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`edit-${field}`}>{label}</Label>
        {type === 'textarea' ? (
          <Textarea
            id={`edit-${field}`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            rows={rows ?? 3}
            placeholder={`Saisissez ${label.toLowerCase()}`}
          />
        ) : (
          <Input
            id={`edit-${field}`}
            type={type}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Saisissez ${label.toLowerCase()}`}
          />
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={loading} className="bg-blue-700 hover:bg-blue-800">
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Modifier {label}</DrawerTitle>
            <DrawerDescription>Modifiez le champ ci-dessous.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier {label}</DialogTitle>
          <DialogDescription>Modifiez le champ ci-dessous.</DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

// ============================================================
// COMPOSANT : TABLEAU DES UTILISATEURS DU SYSTÈME (mini gestion)
// ============================================================

interface SystemUsersSectionProps {
  users: Utilisateur[];
  isLoading?: boolean;
  onViewUser?: (user: Utilisateur) => void;
  onEditUser?: (user: Utilisateur) => void;
  onToggleActive?: (user: Utilisateur) => Promise<void>;
}


function SystemUsersSection({
  users,
  isLoading = false,
  onViewUser,
  onEditUser,
  onToggleActive,
}: SystemUsersSectionProps): React.JSX.Element {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Aucun utilisateur enregistré.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const fullName = `${user.prenom} ${user.nom}`;
            const roleLabel =
              user.role === 'ADMIN'
                ? 'Administrateur'
                : user.role === 'SECRETAIRE'
                  ? 'Secrétaire'
                  : 'Moniteur';
            const roleIcon =
              user.role === 'ADMIN' ? (
                <UserCog className="h-3 w-3" />
              ) : user.role === 'SECRETAIRE' ? (
                <CalendarCheck className="h-3 w-3" />
              ) : (
                <GraduationCap className="h-3 w-3" />
              );

            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getAvatarUrl(fullName)} />
                      <AvatarFallback className="text-xs">
                        {user.prenom?.[0]}
                        {user.nom?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{fullName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-1 text-xs border-0 bg-muted/40">
                    {roleIcon}
                    {roleLabel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] border-0',
                      user.actif
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    )}
                  >
                    {user.actif ? 'Actif' : 'Inactif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onViewUser?.(user)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Voir le détail</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onEditUser?.(user)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Modifier</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onToggleActive?.(user)}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{user.actif ? 'Désactiver' : 'Activer'}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────


export default function AdminCompanyConfigPage(): React.JSX.Element {

  const isDesktop = !useIsMobile();

  // États principaux
  const [company, setCompany] = React.useState<CompanyConfig | null>(null);
  const [systemUsers, setSystemUsers] = React.useState<Utilisateur[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeSection, setActiveSection] = React.useState('general');
  const [uploadingLogo, setUploadingLogo] = React.useState(false);

  // État du dialogue d'édition
  const [editingField, setEditingField] = React.useState<{
    field: string;
    label: string;
    value: string | null | undefined;
    type?: 'text' | 'textarea' | 'email' | 'url' | 'tel';
    rows?: number;
    schema?: z.ZodSchema;
    onSave: (value: string) => Promise<void>;
  } | null>(null);

  // Chargement des données mockées
  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await new Promise((r) => setTimeout(r, 500));
      setCompany(generateMockCompanyConfig());
      setSystemUsers(generateMockSystemUsers());
      setIsLoading(false);
    };
    loadData();
  }, []);

  // ── Handlers de mise à jour des champs de l’entreprise ──────────────────
  const updateField = async (field: keyof CompanyConfig, value: string) => {
    if (!company) return;
    const updated = { ...company, [field]: value, updatedAt: new Date() };
    await new Promise((r) => setTimeout(r, 500));
    setCompany(updated);
    toast.success(`${field} mis à jour`);
  };

  const updateNom = (val: string) => updateField('nom', val);
  const updateTelephone = (val: string) => updateField('telephone', val);
  const updateEmail = (val: string) => updateField('email', val);
  const updateSiteWeb = (val: string) => updateField('siteWeb', val);
  const updateAdresse = (val: string) => updateField('adresse', val);
  const updateNumeroFiscal = (val: string) => updateField('numeroFiscal', val);

  // ── Gestion du logo ──────────────────────────────────────────────────────
  const handleLogoUpload = async (file: File) => {
    if (!company) return;
    setUploadingLogo(true);
    await new Promise((r) => setTimeout(r, 800));
    const fakeUrl = URL.createObjectURL(file);
    setCompany({ ...company, logoPath: fakeUrl });
    setUploadingLogo(false);
    toast.success('Logo mis à jour');
  };

  const handleLogoClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/svg+xml';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) await handleLogoUpload(file);
    };
    input.click();
  };

  // ── Actions sur les utilisateurs du système ─────────────────────────────
  const handleViewUser = (usr: Utilisateur) => {
    toast.info(`Voir le détail de ${usr.displayName}`);
  };
  const handleEditUser = (usr: Utilisateur) => {
    toast.info(`Modifier ${usr.displayName}`);
  };
  const handleToggleUserActive = async (usr: Utilisateur) => {
    await new Promise((r) => setTimeout(r, 600));
    setSystemUsers((prev) =>
      prev.map((u) => (u.id === usr.id ? { ...u, actif: !u.actif } : u))
    );
    toast.success(`Utilisateur ${usr.actif ? 'désactivé' : 'activé'}`);
  };

  // ── Sections de la sidebar ──────────────────────────────────────────────
  const sections: SidebarSection[] = [
    { id: 'general', label: 'Informations générales', icon: <Building className="h-4 w-4" /> },
    { id: 'address', label: 'Adresse', icon: <MapPin className="h-4 w-4" /> },
    { id: 'legal', label: 'Législation', icon: <FileText className="h-4 w-4" /> },
    { id: 'logo', label: 'Logo', icon: <ImageIcon className="h-4 w-4" /> },
    { id: 'users', label: 'Utilisateurs', icon: <Users className="h-4 w-4" /> },
    { id: 'advanced', label: 'Avancé', icon: <Settings className="h-4 w-4" /> },
    { id: 'software', label: 'Licence & Dev', icon: <Code className="h-4 w-4" /> },
  ];


  // ── Rendu du contenu (selon section active) ──────────────────────────────
  const renderContent = () => {
    if (!company) return null;

    return (
      <div className="space-y-6">
        {/* Section Générale */}
        {activeSection === 'general' && (
          <ProfileSectionCard
            title="Informations générales"
            description="Nom, téléphone, email, site web"
            icon={<Building className="h-6 w-6" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <ProfileInfoRow
                label="Nom de l'entreprise"
                value={company.nom}
                icon={Building}
                onEdit={() =>
                  setEditingField({
                    field: 'nom',
                    label: "Nom de l'entreprise",
                    value: company.nom,
                    onSave: updateNom,
                  })
                }
              />
              <ProfileInfoRow
                label="Téléphone"
                value={company.telephone ?? 'Non renseigné'}
                icon={Phone}
                onEdit={() =>
                  setEditingField({
                    field: 'telephone',
                    label: 'Téléphone',
                    value: company.telephone,
                    type: 'tel',
                    schema: generalInfoSchema.pick({ telephone: true }),
                    onSave: updateTelephone,
                  })
                }
              />
              <ProfileInfoRow
                label="Email"
                value={company.email ?? 'Non renseigné'}
                icon={Mail}
                type="email"
                onEdit={() =>
                  setEditingField({
                    field: 'email',
                    label: 'Email',
                    value: company.email,
                    type: 'email',
                    schema: generalInfoSchema.pick({ email: true }),
                    onSave: updateEmail,
                  })
                }
              />
              <ProfileInfoRow
                label="Site web"
                value={company.siteWeb ?? 'Non renseigné'}
                icon={Globe}
                type="url"
                onEdit={() =>
                  setEditingField({
                    field: 'siteWeb',
                    label: 'Site web',
                    value: company.siteWeb,
                    type: 'url',
                    schema: generalInfoSchema.pick({ siteWeb: true }),
                    onSave: updateSiteWeb,
                  })
                }
              />
            </div>
          </ProfileSectionCard>
        )}

        {/* Section Adresse */}
        {activeSection === 'address' && (
          <ProfileSectionCard
            title="Adresse"
            description="Adresse postale complète"
            icon={<MapPin className="h-6 w-6" />}
          >
            <ProfileInfoRow
              label="Adresse"
              value={company.adresse ?? 'Non renseignée'}
              icon={MapPin}
              type="textarea"
              onEdit={() =>
                setEditingField({
                  field: 'adresse',
                  label: 'Adresse',
                  value: company.adresse,
                  type: 'textarea',
                  rows: 3,
                  schema: addressSchema.pick({ adresse: true }),
                  onSave: updateAdresse,
                })
              }
            />
          </ProfileSectionCard>
        )}

        {/* Section Législation */}
        {activeSection === 'legal' && (
          <ProfileSectionCard
            title="Informations légales"
            description="Numéro d’identification fiscale"
            icon={<FileText className="h-6 w-6" />}
          >
            <ProfileInfoRow
              label="Numéro fiscal"
              value={company.numeroFiscal ?? 'Non renseigné'}
              icon={ShieldCheck}
              onEdit={() =>
                setEditingField({
                  field: 'numeroFiscal',
                  label: 'Numéro fiscal',
                  value: company.numeroFiscal,
                  schema: legalSchema.pick({ numeroFiscal: true }),
                  onSave: updateNumeroFiscal,
                })
              }
            />
          </ProfileSectionCard>
        )}

        {/* Section Logo */}
        {activeSection === 'logo' && (
          <ProfileSectionCard
            title="Logo de l'entreprise"
            description="Image utilisée dans les en‑têtes, factures et le site"
            icon={<ImageIcon className="h-6 w-6" />}
          >
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div
                className="relative group cursor-pointer"
                onClick={handleLogoClick}
                aria-label="Modifier le logo"
              >
                <Avatar className="h-32 w-32 rounded-md shadow-md border">
                  <AvatarImage src={company.logoPath ?? getAvatarUrl(company.nom)} />
                  <AvatarFallback className="text-4xl font-bold bg-blue-100 text-blue-700">
                    {company.nom.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Cliquez sur le logo pour le modifier. Formats acceptés : JPEG, PNG, WEBP, SVG.
                </p>
                {uploadingLogo && <p className="text-xs text-blue-600">Téléversement en cours...</p>}
              </div>
            </div>
          </ProfileSectionCard>
        )}

        {/* Section Utilisateurs du système */}
        {activeSection === 'users' && (
          <ProfileSectionCard
            title="Utilisateurs du système"
            description="Administrateurs, secrétaires et moniteurs"
            icon={<Users className="h-6 w-6" />}
          >
            <SystemUsersSection
              users={systemUsers}
              isLoading={isLoading}
              onViewUser={handleViewUser}
              onEditUser={handleEditUser}
              onToggleActive={handleToggleUserActive}
            />
          </ProfileSectionCard>
        )}

        {/* Section Avancé (métadonnées + À propos) */}
        {activeSection === 'advanced' && (
          <div className="space-y-6">
            <ProfileSectionCard title="Métadonnées Système" description="Traçabilité et audit de configuration" icon={<Settings className="h-6 w-6" />}>
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-md bg-muted/50">
                  <Avatar className="h-12 w-12 border-2 border-primary">
                    <AvatarImage src={company.logoPath ?? getAvatarUrl(company.nom)} />
                    <AvatarFallback>GH</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold">Créé par GeekHub</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-slate-800 text-[9px]">{company.numeroFiscal}</Badge>
                      <span className="text-[10px] text-muted-foreground">{format(company.createdAt, 'PPp', { locale: fr })}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between py-3 border-b text-sm">
                    <span className="font-medium text-muted-foreground">UUID Configuration</span>
                    <span className="font-mono text-xs">conf_8892_zxa_2026</span>
                  </div>
                  <div className="flex justify-between py-3 border-b text-sm">
                    <span className="font-medium text-muted-foreground">Dernière Synchronisation</span>
                    <span className="text-xs">{formatDistanceToNow(company.updatedAt, { addSuffix: true, locale: fr })}</span>
                  </div>
                </div>
              </div>
            </ProfileSectionCard>

          </div>
        )}


        {activeSection === 'software' && (

          <ProfileSectionCard title="Droits Logiciels" description="Propriété intellectuelle et maintenance technique" icon={<Code className="h-6 w-6" />}>
            <div className="rounded-2xl bg-slate-950 p-6 text-white relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Code size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg leading-none">Geekhub Enterprise</h4>
                    <p className="text-slate-400 text-xs">Licence de déploiement perpétuelle</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Ce logiciel est une œuvre originale développée par <span className="text-blue-400 font-bold">Geekhub</span>.
                  Toute reproduction ou redistribution non autorisée est strictement interdite par les lois internationales.
                </p>
                <div className="flex gap-4 pt-2">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Version 1.2.0-STABLE
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                    <LockIcon size={10} /> Chiffrement AES-256
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 opacity-10 rotate-12">
                <Code size={200} />
              </div>
            </div>
          </ProfileSectionCard>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-1 pb-10">
        <Skeleton className="h-48 w-full rounded-md" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 md:p-1 pb-10">
      {/* En‑tête avec ProfileHeader */}
      <PageBreadcrumb />



      <Card className="relative overflow-hidden border-none shadow-xl ">
        <CardContent className="p-8 md:p-5 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative group">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-white shadow-xl bg-white">
                <AvatarImage src={company?.logoPath ?? undefined} />
                <AvatarFallback className="bg-blue-700 text-white text-5xl rounded-full font-black">
                  {company?.nom.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Button size="icon" className="absolute bottom-2 right-2 rounded-full bg-blue-700 hover:bg-blue-800 border-4 border-white size-10">
                <Camera size={18} />
              </Button>
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-blue-950 dark:text-white uppercase ">
                    {company?.nom}
                  </h1>
                </div>
                <p className="text-blue-600/80 font-medium flex items-center justify-center md:justify-start gap-2">
                  <MapPin size={16} /> {company?.adresse}
                </p>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <div className="px-4 py-2 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-2">
                  <Mail size={14} className="text-blue-700" />
                  <span className="text-xs font-bold text-blue-900">{company?.email}</span>
                </div>
                <div className="px-4 py-2 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-2">
                  <Phone size={14} className="text-blue-700" />
                  <span className="text-xs font-bold text-blue-900">{company?.telephone}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Navigation et contenu */}
      {!isDesktop ? (
        <>
          <ProfileMobileNav
            sections={sections}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            className="mb-4"
          />
          <div className="mt-6">{renderContent()}</div>
        </>
      ) : (
        <div className="flex gap-6">
          <aside className="w-64 shrink-0">
            <ProfileSidebar
              sections={sections}
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              showDangerSeparator={false}
            />
          </aside>
          <main className="flex-1 min-w-0">{renderContent()}</main>
        </div>
      )}

      {/* 4. MODAL D'ÉDITION ÉLÉGANT */}
      {editingField && (
        <EditFieldDialog
          {...editingField}
          open={!!editingField}
          onOpenChange={(o) => !o && setEditingField(null)}
        />
      )}
    </div>
  );
}