'use client';

import { ChevronsUpDown, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { appConfig } from '@/config';

/**
 * Structure d'un compte pour le sélecteur.
 */
export interface Account {
  /** Identifiant unique du compte */
  id: string;
  /** Nom du compte (ex: "COS Auto-École", "Dr. Dupont") */
  name: string;
  /** Email associé */
  email: string;
  /** URL de l'avatar (optionnel) */
  avatarUrl?: string;
  /** Indique si c'est le compte actif */
  isCurrent?: boolean;
}

export interface AccountSwitcherProps {
  /** Liste des comptes disponibles */
  accounts: Account[];
  /** Compte actuellement sélectionné */
  activeAccount?: Account;
  /** Fonction appelée lors du changement de compte */
  onSwitchAccount?: (account: Account) => void;
  /** Fonction appelée pour ajouter un compte */
  onAddAccount?: () => void;
  /** Titre du groupe de comptes (optionnel) */
  label?: string;
  /** Classes CSS supplémentaires */
  className?: string;
}

/**
 * Sélecteur de compte en en-tête de la sidebar.
 * - Affiche le logo de l'application (ou l'avatar du compte actif).
 * - En mode réduit (sidebar fermée ou mobile), affiche uniquement le logo/avatar.
 * - Menu déroulant pour basculer entre comptes ou en ajouter.
 *
 * @example
 * ```tsx
 * <AccountSwitcher
 *   accounts={accounts}
 *   activeAccount={currentAccount}
 *   onSwitchAccount={handleSwitch}
 *   onAddAccount={handleAdd}
 * />
 * ```
 */
export function AccountSwitcher({
  accounts,
  activeAccount,
  onSwitchAccount,
  onAddAccount,
  label = 'Comptes',
  className,
}: AccountSwitcherProps) {
  const { isMobile, state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const current = activeAccount || accounts[0];
  if (!current) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Détermine l'élément affiché dans le bouton : logo ou avatar du compte actif
  const displayElement =
    isCollapsed || isMobile ? (
      // Mode réduit : juste le logo (ou avatar) sans texte
      <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary/10">
        <img src={appConfig.logo} alt="Logo" className="size-6 object-contain" />
      </div>
    ) : (
      // Mode expansé : logo + nom + chevron
      <>
        <div className="flex aspect-square size-18 items-center justify-center rounded-md">
          <img src={appConfig.logo} alt="Logo" className="size-15 object-contain" />
        </div>
        <div className="flex flex-1 flex-col text-left text-sm leading-tight">
          <span className="truncate font-semibold">{current.name}</span>
          <span className="truncate text-xs text-muted-foreground">{current.email}</span>
        </div>
        <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
      </>
    );

  return (
    <SidebarMenu className={className}>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
                (isCollapsed || isMobile) && 'justify-center px-2'
              )}
            >
              {displayElement}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-md"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">{label}</DropdownMenuLabel>
            {accounts.map((account, index) => (
              <DropdownMenuItem
                key={account.id}
                onClick={() => onSwitchAccount?.(account)}
                className={cn(
                  'gap-2 p-2',
                  account.id === current.id && 'bg-accent text-accent-foreground'
                )}
              >
                <Avatar className="size-6">
                  <AvatarImage src={account.avatarUrl} alt={account.name} />
                  <AvatarFallback>{getInitials(account.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{account.name}</span>
                  <span className="text-xs text-muted-foreground">{account.email}</span>
                </div>

                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAddAccount?.()} className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Ajouter un compte</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
