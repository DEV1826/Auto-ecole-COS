// src/features/planning/pages/PlanningMoniteurPage.tsx

/**
 * @module features/planning/pages/PlanningMoniteurPage
 * @description
 * Planning individuel d'un moniteur : indicateurs, semaine en cours (calendrier),
 * prochaines leçons et historique complet avec actions.
 */

import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { startOfWeek, endOfWeek, startOfMonth } from 'date-fns';
import { ArrowLeft, CalendarDays, CalendarPlus, CheckCircle2, Clock, UserRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { PageHeader, errorMessage } from '@/components/forms/FormPageKit';
import { StatsGrid, type StatsCardProps } from '@/features/dashboard/components/common/StatsCard';
import { MoniteursAvailabilityCalendar } from '@/features/moniteurs/components/MoniteursAvailabilityCalendar';
import { LeconsTable } from '../components/LeconsTable';
import LeconsAgenda from '../components/LeconsAgenda';
import { useLeconActions } from '../hooks/useLeconActions';

import { useMoniteurs } from '@/hooks/use.moniteurs';
import { usePlanning } from '@/hooks/use.planning';
import { useAuth } from '@/hooks/use.auth';
import { PROTECTED_ROUTES } from '@/config';
import type { Moniteur } from '@/types/moniteurs.types';
import type { Lecon } from '@/types/planning.types';

export default function PlanningMoniteurPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { moniteurId: idParam } = useParams<{ moniteurId: string }>();
  const moniteurId = Number(idParam);
  const { getById } = useMoniteurs();
  const { getByMoniteur } = usePlanning();
  const { user } = useAuth();
  const canPlan = user?.role === 'ADMIN' || user?.role === 'SECRETAIRE';

  const [moniteur, setMoniteur] = React.useState<Moniteur | null>(null);
  const [lecons, setLecons] = React.useState<Lecon[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setError] = React.useState<string | null>(null);
  const invalidId = !Number.isInteger(moniteurId) || moniteurId <= 0;
  const error = invalidId ? 'Identifiant de moniteur invalide.' : fetchError;

  const load = React.useCallback(async () => {
    if (invalidId) return;
    try {
      const [m, l] = await Promise.all([getById(moniteurId), getByMoniteur(moniteurId)]);
      setMoniteur(m);
      setLecons(l);
    } catch (err) {
      setError(errorMessage(err, 'Impossible de charger le planning.'));
    } finally {
      setLoading(false);
    }
  }, [moniteurId, invalidId, getById, getByMoniteur]);

  React.useEffect(() => {
    // Chargement asynchrone : aucun setState synchrone dans l'effet.
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const handleChanged = React.useCallback(
    (updated: Lecon) => setLecons((list) => list.map((l) => (l.id === updated.id ? { ...l, ...updated } : l))),
    []
  );
  const actions = useLeconActions(handleChanged);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const inRange = (l: Lecon, a: Date, b: Date) => {
    const d = new Date(l.date);
    return d >= a && d <= b;
  };
  const semaine = lecons.filter((l) => inRange(l, weekStart, weekEnd) && l.statut !== 'ANNULEE');
  const heuresSemaine = semaine.reduce((s, l) => s + l.duree, 0) / 60;
  const effectueesMois = lecons.filter((l) => l.statut === 'EFFECTUEE' && new Date(l.date) >= startOfMonth(now));
  const terminees = lecons.filter((l) => l.statut !== 'PLANIFIEE');
  const tauxRealisation = terminees.length
    ? Math.round((terminees.filter((l) => l.statut === 'EFFECTUEE').length / terminees.length) * 100)
    : 0;
  const aVenir = lecons.filter((l) => l.statut === 'PLANIFIEE' && new Date(l.date) >= now).length;

  const cards: StatsCardProps[] = [
    {
      id: 'semaine',
      title: 'Cette semaine',
      value: semaine.length,
      icon: <CalendarDays className="h-5 w-5" />,
      Color: 'blue-600',
      description: `${heuresSemaine.toFixed(1).replace('.0', '')} h de leçons`,
    },
    {
      id: 'a-venir',
      title: 'À venir',
      value: aVenir,
      icon: <Clock className="h-5 w-5" />,
      Color: 'amber-600',
      description: 'Leçons planifiées',
    },
    {
      id: 'mois',
      title: 'Effectuées ce mois',
      value: effectueesMois.length,
      icon: <CheckCircle2 className="h-5 w-5" />,
      Color: 'emerald-600',
      description: `${(effectueesMois.reduce((s, l) => s + l.duree, 0) / 60).toFixed(1).replace('.0', '')} h`,
    },
    {
      id: 'taux',
      title: 'Taux de réalisation',
      value: `${tauxRealisation}%`,
      icon: <UserRound className="h-5 w-5" />,
      Color: 'red-600',
      description: 'Hors annulations par planification',
    },
  ];

  if (error) {
    return (
      <ErrorDialog
        open
        onOpenChange={() => navigate(PROTECTED_ROUTES.PLANNING.CALENDAR)}
        title="Erreur de chargement"
        message={error}
        closeText="Retour au planning"
      />
    );
  }

  const nom = moniteur ? `${moniteur.prenom} ${moniteur.nom}` : 'Moniteur';

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader
        icon={CalendarDays}
        accent="violet"
        title={`Planning de ${nom}`}
        badge={moniteur ? (moniteur.actif ? 'Actif' : 'Inactif') : undefined}
        subtitle={moniteur?.specialite ?? undefined}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to={PROTECTED_ROUTES.MONITEURS.DETAIL(moniteurId)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Fiche moniteur
              </Link>
            </Button>
            {canPlan && (
              <Button size="sm" asChild>
                <Link to={`${PROTECTED_ROUTES.PLANNING.CREATE}?moniteurId=${moniteurId}`}>
                  <CalendarPlus className="h-4 w-4 mr-1" /> Planifier
                </Link>
              </Button>
            )}
          </>
        }
      />

      <StatsGrid cards={cards} cols={4} isLoading={loading} classGrid="h-auto" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 min-w-0">
          {Number.isInteger(moniteurId) && moniteurId > 0 && (
            <MoniteursAvailabilityCalendar moniteurId={moniteurId} onRefresh={load} />
          )}
        </div>
        <LeconsAgenda
          lecons={lecons}
          loading={loading}
          getParticipant={(l) => (l.candidat ? `${l.candidat.prenom} ${l.candidat.nom}` : `Candidat #${l.candidatId}`)}
        />
      </div>

      <LeconsTable
        lecons={lecons}
        isLoading={loading}
        onRefresh={load}
        actions={actions}
        variant={user?.role === 'MONITEUR' ? 'moniteur' : 'admin'}
        enrichments={{
          getMoniteurNomComplet: () => nom,
          getCandidatNomComplet: (l) => (l.candidat ? `${l.candidat.prenom} ${l.candidat.nom}` : `Candidat #${l.candidatId}`),
          getVehiculeImmatriculation: (l) => l.vehicule?.immatriculation ?? '—',
          getVehiculeLibelle: (l) => (l.vehicule ? `${l.vehicule.marque} ${l.vehicule.modele}` : 'Sans véhicule'),
        }}
        enablePagination
        enableToolbar
        defaultPageSize={10}
        title="Toutes les leçons"
        description={`Historique et leçons à venir de ${nom}`}
        onAddClick={canPlan ? () => navigate(`${PROTECTED_ROUTES.PLANNING.CREATE}?moniteurId=${moniteurId}`) : undefined}
        asCard
      />
    </div>
  );
}
