// src/features/utils/pages/HelpPage.tsx

/**
 * @module features/utils/pages/HelpPage
 * @description
 * Centre d'aide : recherche, guides pas à pas par module (avec liens directs),
 * questions fréquentes et coordonnées de l'auto-école.
 */

import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Car,
  ClipboardList,
  GraduationCap,
  HelpCircle,
  LifeBuoy,
  Mail,
  MapPin,
  Phone,
  Receipt,
  Search,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PageHeader } from '@/components/forms/FormPageKit';
import { useAdmin } from '@/hooks/use.admin';
import { useAuth } from '@/hooks/use.auth';
import { appConfig } from '@/config/app.config';
import { PROTECTED_ROUTES } from '@/config';
import type { CompanyConfig } from '@/types/admin.types';

type Role = 'ADMIN' | 'SECRETAIRE' | 'MONITEUR';

interface Guide {
  id: string;
  titre: string;
  icon: LucideIcon;
  roles?: Role[];
  etapes: string[];
  lien?: { label: string; to: string };
}

const GUIDES: Guide[] = [
  {
    id: 'inscrire',
    titre: 'Inscrire un nouveau candidat',
    icon: GraduationCap,
    roles: ['ADMIN', 'SECRETAIRE'],
    etapes: [
      'Ouvrez Candidats puis « Nouveau candidat ».',
      'Renseignez son identité, ses coordonnées et la catégorie de permis visée.',
      'Choisissez sa formation : le montant à payer est repris automatiquement.',
      "Enregistrez : vous pouvez enchaîner directement sur l'encaissement du premier paiement.",
    ],
    lien: { label: 'Nouveau candidat', to: PROTECTED_ROUTES.CANDIDATS.CREATE },
  },
  {
    id: 'paiement',
    titre: 'Encaisser un paiement et éditer un reçu',
    icon: Wallet,
    roles: ['ADMIN', 'SECRETAIRE'],
    etapes: [
      'Ouvrez Paiements puis « Nouveau paiement », ou partez de la fiche du candidat.',
      'Choisissez le candidat, le montant et le mode (espèces, mobile money…).',
      'Rattachez si besoin le paiement à une facture : son statut se met à jour.',
      'Depuis le détail du paiement, imprimez ou exportez le reçu.',
    ],
    lien: { label: 'Nouveau paiement', to: PROTECTED_ROUTES.PAIEMENTS.CREATE },
  },
  {
    id: 'facture',
    titre: 'Émettre une facture',
    icon: Receipt,
    roles: ['ADMIN', 'SECRETAIRE'],
    etapes: [
      'Ouvrez Factures puis « Nouvelle facture ».',
      'Choisissez le candidat : le reste à facturer de sa formation vous est proposé.',
      'Ajoutez une échéance si nécessaire, puis émettez la facture (numéro attribué automatiquement).',
      'Les factures échues non réglées apparaissent dans les Notifications.',
    ],
    lien: { label: 'Nouvelle facture', to: PROTECTED_ROUTES.FACTURES.CREATE },
  },
  {
    id: 'lecon',
    titre: 'Planifier une leçon',
    icon: CalendarDays,
    roles: ['ADMIN', 'SECRETAIRE'],
    etapes: [
      'Ouvrez Planning puis « Planifier », ou partez de la fiche du candidat ou du moniteur.',
      'Choisissez le candidat, le moniteur, le type de leçon, la date, l’heure et la durée.',
      'Pour la conduite, choisissez un véhicule (ceux de la catégorie du candidat sont proposés en premier).',
      "Les conflits d'horaire (moniteur, candidat, véhicule) sont refusés à l'enregistrement.",
    ],
    lien: { label: 'Planifier une leçon', to: PROTECTED_ROUTES.PLANNING.CREATE },
  },
  {
    id: 'cloturer',
    titre: 'Clôturer une leçon (effectuée, absence, annulation)',
    icon: CalendarDays,
    etapes: [
      'Dans le tableau des leçons, ouvrez le menu « … » de la leçon.',
      'Choisissez « Marquer comme effectuée », « Signaler une absence » ou « Annuler ».',
      'Les heures effectuées alimentent la progression du candidat et les rapports.',
    ],
    lien: { label: 'Ouvrir le planning', to: PROTECTED_ROUTES.PLANNING.CALENDAR },
  },
  {
    id: 'examen',
    titre: 'Inscrire à un examen et saisir le résultat',
    icon: ClipboardList,
    roles: ['ADMIN', 'SECRETAIRE'],
    etapes: [
      'Ouvrez Examens puis « Nouvel examen » : candidat, type (code ou conduite), date et centre.',
      'Après l’épreuve, modifiez l’examen pour saisir le résultat (reçu / ajourné) et la note.',
      'Pour un candidat reçu, générez l’attestation depuis le tableau des examens.',
    ],
    lien: { label: 'Nouvel examen', to: PROTECTED_ROUTES.EXAMENS.CREATE },
  },
  {
    id: 'vehicule',
    titre: "Suivre l'entretien d'un véhicule",
    icon: Car,
    roles: ['ADMIN'],
    etapes: [
      'Ouvrez la fiche du véhicule puis « Entretiens ».',
      "Ajoutez chaque intervention avec son coût, le kilométrage et, si possible, le kilométrage du prochain entretien.",
      'Les révisions à prévoir (moins de 1 000 km) sont signalées dans les Notifications et le rapport de flotte.',
    ],
    lien: { label: 'Véhicules', to: PROTECTED_ROUTES.VEHICULES.LIST },
  },
  {
    id: 'rapports',
    titre: 'Consulter et exporter les rapports',
    icon: BarChart3,
    roles: ['ADMIN', 'SECRETAIRE'],
    etapes: [
      'Ouvrez un rapport (financier, candidats, leçons, flotte) et choisissez la période.',
      'Le bouton « Exporter » produit un fichier Excel détaillé.',
      'La page Exports permet de combiner plusieurs rapports et de produire une synthèse PDF.',
      'Les fichiers sont enregistrés dans Documents › Auto-Ecole COS › exports.',
    ],
    lien: { label: 'Exports', to: PROTECTED_ROUTES.RAPPORTS.EXPORT },
  },
  {
    id: 'utilisateurs',
    titre: 'Créer un compte et gérer les droits',
    icon: ShieldCheck,
    roles: ['ADMIN'],
    etapes: [
      'Ouvrez Administration › Utilisateurs puis « Nouvel utilisateur ».',
      'Choisissez le rôle (administrateur, secrétaire, moniteur) et le niveau d’accès.',
      'Depuis la fiche, ajustez les permissions module par module ou fermez les sessions ouvertes.',
    ],
    lien: { label: 'Nouvel utilisateur', to: PROTECTED_ROUTES.ADMIN.USERS.CREATE },
  },
];

const FAQ: Array<{ q: string; r: string; roles?: Role[] }> = [
  {
    q: "J'ai oublié mon mot de passe.",
    r: "Sur l'écran de connexion, cliquez sur « Mot de passe oublié » puis demandez un code à un administrateur : il le génère depuis votre fiche utilisateur. Le code est valable une heure.",
  },
  {
    q: 'Pourquoi suis-je déconnecté automatiquement ?',
    r: "Une session expire après 24 heures, ou plus tôt si un administrateur a fermé vos sessions ou désactivé votre compte. Reconnectez-vous simplement.",
  },
  {
    q: 'Une leçon est refusée pour « conflit ».',
    r: 'Le moniteur, le candidat ou le véhicule a déjà une leçon sur ce créneau. Choisissez une autre heure ou une autre ressource.',
  },
  {
    q: 'Le montant ou le candidat d’une facture ne sont pas modifiables.',
    r: "C'est volontaire : une facture émise est figée. Annulez-la (statut « Annulée ») puis émettez-en une nouvelle.",
    roles: ['ADMIN', 'SECRETAIRE'],
  },
  {
    q: 'Où sont enregistrés les exports et les reçus ?',
    r: 'Dans votre dossier Documents › Auto-Ecole COS › exports. Le bouton « Dossier des exports » de la page Exports l’ouvre directement.',
  },
  {
    q: "Certaines pages affichent « Accès réservé ».",
    r: 'Elles dépendent de votre rôle (par exemple les finances pour le secrétariat et la direction). Adressez-vous à un administrateur si vous en avez besoin.',
  },
];

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function HelpPage(): React.JSX.Element {
  const { user } = useAuth();
  const { getCompanyConfig } = useAdmin();
  const role = user?.role as Role | undefined;
  const [query, setQuery] = React.useState('');
  const [company, setCompany] = React.useState<CompanyConfig | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getCompanyConfig()
      .then((c) => !cancelled && setCompany(c))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [getCompanyConfig]);

  const q = normalize(query.trim());
  const allowed = <T extends { roles?: Role[] }>(x: T) => !x.roles || (role ? x.roles.includes(role) : false);
  const guides = GUIDES.filter(allowed).filter((g) => !q || normalize(`${g.titre} ${g.etapes.join(' ')}`).includes(q));
  const faq = FAQ.filter(allowed).filter((f) => !q || normalize(`${f.q} ${f.r}`).includes(q));

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader icon={HelpCircle} title="Aide" accent="teal" badge={`Version ${appConfig.version}`} />

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher : facture, mot de passe, leçon…"
          className="h-11 pl-9"
          aria-label="Rechercher dans l'aide"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="rounded-md xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-teal-600" /> Guides pas à pas
            </CardTitle>
            <CardDescription>Les tâches courantes, adaptées à votre rôle.</CardDescription>
          </CardHeader>
          <CardContent>
            {guides.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Aucun guide ne correspond à « {query} ».</p>
            ) : (
              <Accordion type="multiple" className="w-full">
                {guides.map((g) => (
                  <AccordionItem key={g.id} value={g.id}>
                    <AccordionTrigger className="text-left">
                      <span className="flex items-center gap-2">
                        <g.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {g.titre}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ol className="ml-6 list-decimal space-y-1.5 text-sm">
                        {g.etapes.map((e) => (
                          <li key={e}>{e}</li>
                        ))}
                      </ol>
                      {g.lien && (
                        <Link to={g.lien.to} className="mt-3 inline-block text-sm font-medium text-teal-700 hover:underline dark:text-teal-400">
                          {g.lien.label} →
                        </Link>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <LifeBuoy className="h-4 w-4 text-teal-600" /> Besoin d'aide ?
              </CardTitle>
              <CardDescription>Contactez votre administrateur ou l'auto-école.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{company?.nom ?? appConfig.name}</p>
              {company?.telephone && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" /> {company.telephone}
                </p>
              )}
              {company?.email && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${company.email}`} className="hover:underline">
                    {company.email}
                  </a>
                </p>
              )}
              {company?.adresse && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {company.adresse}
                </p>
              )}
              <p className="border-t pt-2 text-xs text-muted-foreground">
                {appConfig.name} · version {appConfig.version}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Questions fréquentes</CardTitle>
            </CardHeader>
            <CardContent>
              {faq.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune question ne correspond.</p>
              ) : (
                <Accordion type="single" collapsible>
                  {faq.map((f) => (
                    <AccordionItem key={f.q} value={f.q}>
                      <AccordionTrigger className="text-left text-sm">{f.q}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">{f.r}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
