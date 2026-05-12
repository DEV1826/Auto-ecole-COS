'use client';

import * as React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ChevronRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { appConfig, PUBLIC_ROUTES } from '@/config';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Kbd } from '@/components/ui/kbd';
import { useIsMobile } from '@/hooks/use-mobile';
import { GridShape } from '../layout';

export interface FooterLink {
  title: string;
  href: string;
  external?: boolean;
  icon?: React.ReactNode;
}

export interface FooterSection {
  title: string;
  icon?: React.ReactNode;
  links: FooterLink[];
}

export interface SocialLink {
  name: string;
  href: string;
  icon: React.ReactNode;
  external?: boolean;
}

export interface FooterProps {
  /** Sections de liens (colonne) */
  sections?: FooterSection[];
  /** Liens sociaux */
  socialLinks?: SocialLink[];
  /** Informations de contact */
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  /** Classes additionnelles */
  className?: string;
  /** Variante d'affichage : 'default', 'simple' ou 'form' */
  variant?: 'default' | 'simple' | 'form';
}

/**
 * Icône Twitter personnalisée (SVG inline)
 */
const TwitterIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 21 20"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M15.6705 1.875H18.4272L12.4047 8.75833L19.4897 18.125H13.9422L9.59717 12.4442L4.62554 18.125H1.86721L8.30887 10.7625L1.51221 1.875H7.20054L11.128 7.0675L15.6705 1.875ZM14.703 16.475H16.2305L6.37054 3.43833H4.73137L14.703 16.475Z" />
  </svg>
);

const Facebook = () => (
  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879v-6.99h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.99C18.343 21.128 22 16.991 22 12z" />
  </svg>
);

const Instagram = () => (
  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

/**
 * Liens sociaux avec images locales ou composants dédiés
 */
const defaultSocialLinks: SocialLink[] = [
  {
    name: 'Facebook',
    href: 'https://facebook.com',
    icon: <Facebook />,
    external: true,
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com',
    icon: <TwitterIcon />,
    external: true,
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    icon: <Instagram />,
    external: true,
  },
];

const defaultSections: FooterSection[] = [
  {
    title: 'Légal',
    icon: <Shield className="size-4" />,
    links: [
      {
        title: 'Conditions générales',
        href: '/legal/terms',
        icon: <ChevronRight className="size-3" />,
      },
      {
        title: 'Confidentialité',
        href: '/legal/privacy',
        icon: <ChevronRight className="size-3" />,
      },

      {
        title: 'Mentions légales',
        href: '/legal/notice',
        icon: <ChevronRight className="size-3" />,
      },
    ],
  },
];

const defaultContactInfo = {
  email: 'contact@ Auto-École COS.com',
  phone: '+33 1 23 45 67 89',
  address: '123 avenue de la Santé, 75001 Odza, Cameroun',
};

/**
 * Footer complet responsive avec sections, newsletter, liens sociaux et contact.
 * - Variante 'default' : affichage complet en grille responsive.
 * - Variante 'simple' : centré, avec newsletter et réseaux sociaux.
 * - Variante 'form' : ultra compact (copyright + thème mobile).
 */
export function Footer({
  sections = defaultSections,
  socialLinks = defaultSocialLinks,
  contactInfo = defaultContactInfo,
  className,
  variant = 'default',
}: FooterProps) {
  const isForm = variant === 'form';
  const isMobile = useIsMobile();

  if (isForm) {
    return (
      <div className="flex items-center bg-blue-50/70 dark:bg-blue-50/5 justify-center gap-2 py-6 text-center text-xs text-muted-foreground flex-row sm:gap-4">
        {/* Footer léger avec copyright */}
        <p>
          &copy; {new Date().getFullYear()} {appConfig.name}. Tous droits réservés.
        </p>
        <Separator orientation="vertical" className="hidden h-full sm:inline" />
        <div className="flex items-center gap-4">
          <ThemeToggle
            variant={isMobile ? 'icon-only' : 'dropdown'}
            showText
            size="xs"
            rounded="full"
          />
        </div>
      </div>
    );
  }

  return (
    <footer className={cn('border-t bg-blue-50/70 dark:bg-blue-50/5 backdrop-blur-sm', className)}>
      {/* Éléments décoratifs (grilles) */}
      <GridShape position="top-right" model={2} />
      <GridShape position="bottom-left" model={2} />

      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        {/* Layout Principal : Grille optimisée */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Colonne Marque & Newsletter (4 colonnes sur 12) */}
          <div className="lg:col-span-4 col-span- space-y-6">
            <Link to={PUBLIC_ROUTES.HOME} className="flex items-center gap-2 group">
              <img
                src="/icons/logo.svg"
                alt={appConfig.name}
                className="h-9 w-auto transition-transform group-hover:scale-105"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Votre partenaire santé au quotidien. Une plateforme sécurisée pour gérer vos soins et
              rester connecté à vos praticiens.
            </p>
            <div className="pt-2">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Mail className="size-4 text-primary" /> Restez informé
              </h4>
            </div>
          </div>

          {/* Sections de Liens (6 colonnes sur 12) */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {sections.map((section) => (
              <div key={section.title} className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <span className="p-1.5 bg-blue-800 rounded-xs text-white">{section.icon}</span>
                  {section.title}
                </h3>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.title}>
                      <Link
                        to={link.href}
                        className="group flex items-center text-sm text-muted-foreground hover:text-primary transition-all duration-200"
                      >
                        <ChevronRight className="size-2.5  opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-primary" />
                        <span className="group-hover:translate-x-1 transition-transform">
                          {link.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact (2 colonnes sur 12) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="p-1.5 bg-blue-800 rounded-xs text-white">
                  <Phone className="size-4" />
                </span>
                Contact
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-3 hover:text-primary transition-colors cursor-pointer">
                  <Mail className="size-4 shrink-0 text-primary/60" />
                  <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="size-4 shrink-0 mt-0.5 text-primary/60" />
                  <span className="leading-tight">{contactInfo.address}</span>
                </li>
              </ul>
            </div>

            <div className="pt-2">
              <div className="flex gap-2">
                {socialLinks.map((social) => (
                  <Tooltip key={social.name}>
                    <TooltipTrigger asChild>
                      <Button
                        key={social.name}
                        variant="secondary"
                        size="icon"
                        className="size-9 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300"
                        asChild
                      >
                        <a
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={social.name}
                        >
                          {social.icon}
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span>{social.name}</span> <Kbd>{social.icon}</Kbd>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-10 opacity-50" />

        {/* Footer Bottom */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <p>
              © {new Date().getFullYear()} {appConfig.name}. Tous droits réservés.
            </p>
            <div className="hidden md:block w-1 h-1 bg-muted-foreground/30 rounded-xs" />
          </div>

          <div className="flex items-center gap-4">
            <Link to="/legal/terms" className="hover:text-primary transition-colors">
              CGU
            </Link>
            <Link to="/legal/privacy" className=" hover:text-primary transition-colors">
              Confidentialité
            </Link>
            <ThemeToggle
              variant={isMobile ? 'icon-only' : 'dropdown'}
              showText={!isMobile}
              size="xs"
              rounded="full"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
