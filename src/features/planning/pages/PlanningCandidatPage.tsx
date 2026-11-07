// src/features/planning/pages/PlanningCandidatPage.tsx

/**
 * @module features/planning/pages/PlanningCandidatPage
 * @description
 * Planning d'un candidat : progression (heures de code / conduite effectuées
 * par rapport à sa formation), prochaines leçons, absences et historique.
 */

import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CalendarPlus, Car, CalendarX, Clock, GraduationCap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { PageHeader, errorMessage } from '@/components/forms/FormPageKit';
import { StatsGrid, type StatsCardProps } from '@/features/dashboard/components/common/StatsCard';
import { LeconsTable } from '../components/LeconsTable';
import LeconsAgenda from '../components/LeconsAgenda';
import { useLeconActions } from '../hooks/useLeconActions';

import { useCandidats } from '@/hooks/use.candidats';
import { usePlanning } from '@/hooks/use.planning';
import { useAuth } from '@/hooks/use.auth';
import { PROTECTED_ROUTES } from '@/config';
import { STATUT_CANDIDAT_CONFIG } from '@/types/enums';
import type { Candidat } from '@/types/candidats.types';
import type { Lecon } from '@/types/planning.types';

const heures = (minutes: number) => {
  const h = minutes / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} h`;
};

function ProgressRow({
  icon: Icon,
  label,
  doneMinutes,
  plannedMinutes,
  targetHours,
}: {
  icon: React.ElementType;
  label: string;
  doneMinutes: number;
  plannedMinutes: number;
  targetHours?: number | null;
}) {
  const pct = targetHours ? Math.min(100, Math.round((doneMinutes / 60 / targetHours) * 100)) : null;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium">
          <Icon className="h-4 w-4 text-violet-600" />
          {label}
        </span>
        <span className="tabular-nums text-muted-foreground">
          <span className="font-semibold text-foreground">{heures(doneMinutes)}</span>
          {targetHours ? ` / ${targetHours} h` : ''}
        </span>
      </div>
      {pct !== null && <Progress value={pct} className="h-2" />}
      <p className="text-xs text-muted-foreground">
        {pct !== null ? `${pct} % du forfait` : 'Aucun forfait associé'}
        {plannedMinutes > 0 && ` · ${heures(plannedMinutes)} encore planifiées`}
      </p>
    </div>
  );
}

export default function PlanningCandidatPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { candidatId: idParam } = useParams<{ candidatId: string }>();
  const candidatId = Number(idParam);
  const { getById } = useCandidats();
  const { getByCandidat } = usePlanning();
  const { user } = useAuth();
  const canPlan = user?.role === 'ADMIN' || user?.role === 'SECRETAIRE';

  const [candidat, setCandidat] = React.useState<Candidat | null>(null);
  const [lecons, setLecons] = React.useState<Lecon[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setError] = React.useState<string | null>(null);
  const invalidId = !Number.isInteger(candidatId) || candidatId <= 0;
  const error = invalidId ? 'Identifiant de candidat invalide.' : fetchError;

  const load = React.useCallback(async () => {
    if (invalidId) return;
    try {
      const [c, l] = await Promise.all([getById(candidatId), getByCandidat(candidatId)]);
      setCandidat(c);
      setLecons(l);
    } catch (err) {
      setError(errorMessage(err, 'Impossible de charger le planning.'));
    } finally {
      setLoading(false);
    }
  }, [candidatId, invalidId, getById, getByCandidat]);

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

  const sum = (pred: (l: Lecon) => boolean) => lecons.filter(pred).reduce((s, l) => s + l.duree, 0);
  const isCode = (l: Lecon) => l.type === 'CODE';
  const codeFait = sum((l) => isCode(l) && l.statut === 'EFFECTUEE');
  const conduiteFaite = sum((l) => !isCode(l) && l.statut === 'EFFECTUEE');
  const codePlanifie = sum((l) => isCode(l) && l.statut === 'PLANIFIEE');
  const conduitePlanifiee = sum((l) => !isCode(l) && l.statut === 'PLANIFIEE');
  const absences = lecons.filter((l) => l.statut === 'ABSENCE').length;
  const aVenir = lecons.filter((l) => l.statut === 'PLANIFIEE' && new Date(l.date) >= new Date()).length;
  const forfait = candidat?.formation?.formation;

  const cards: StatsCardProps[] = [
    {
      id: 'total',
      title: 'Leçons effectuées',
      value: lecons.filter((l) => l.statut === 'EFFECTUEE').length,
      icon: <GraduationCap className="h-5 w-5" />,
      Color: 'emerald-600',
      description: heures(codeFait + conduiteFaite),
    },
    {
      id: 'a-venir',
      title: 'À venir',
      value: aVenir,
      icon: <Clock className="h-5 w-5" />,
      Color: 'blue-600',
      description: heures(codePlanifie + conduitePlanifiee),
    },
    {
      id: 'conduite',
      title: 'Heures de conduite',
      value: heures(conduiteFaite),
      icon: <Car className="h-5 w-5" />,
      Color: 'amber-600',
      description: forfait?.heuresConduite ? `Forfait : ${forfait.heuresConduite} h` : 'Effectuées',
    },
    {
      id: 'absences',
      title: 'Absences',
      value: absences,
      icon: <CalendarX className="h-5 w-5" />,
      Color: 'red-600',
      description: 'Leçons manquées',
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

  const nom = candidat ? `${candidat.prenom} ${candidat.nom}` : 'Candidat';
  const statutCfg = candidat ? STATUT_CANDIDAT_CONFIG[candidat.statut] : null;
  const createUrl = `${PROTECTED_ROUTES.PLANNING.CREATE}?candidatId=${candidatId}`;

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader
        icon={GraduationCap}
        accent="violet"
        title={`Planning de ${nom}`}
        badge={candidat ? `Permis ${candidat.categorie}` : undefined}
        subtitle={statutCfg?.label}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to={PROTECTED_ROUTES.CANDIDATS.DETAIL(candidatId)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Fiche candidat
              </Link>
            </Button>
            {canPlan && (
              <Button size="sm" asChild>
                <Link to={createUrl}>
                  <CalendarPlus className="h-4 w-4 mr-1" /> Planifier
                </Link>
              </Button>
            )}
          </>
        }
      />

      <StatsGrid cards={cards} cols={4} isLoading={loading} classGrid="h-auto" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="rounded-md xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Progression de la formation</CardTitle>
            <CardDescription>
              {forfait ? `${forfait.nom} — heures effectuées par rapport au forfait.` : 'Heures effectuées (aucune formation associée).'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProgressRow
              icon={BookOpen}
              label="Code de la route"
              doneMinutes={codeFait}
              plannedMinutes={codePlanifie}
              targetHours={forfait?.heuresCode}
            />
            <ProgressRow
              icon={Car}
              label="Conduite"
              doneMinutes={conduiteFaite}
              plannedMinutes={conduitePlanifiee}
              targetHours={forfait?.heuresConduite}
            />
          </CardContent>
        </Card>
        <LeconsAgenda
          lecons={lecons}
          loading={loading}
          getParticipant={(l) => (l.moniteur ? `Avec ${l.moniteur.prenom} ${l.moniteur.nom}` : `Moniteur #${l.moniteurId}`)}
        />
      </div>

      <LeconsTable
        lecons={lecons}
        isLoading={loading}
        onRefresh={load}
        actions={actions}
        variant="admin"
        enrichments={{
          getCandidatNomComplet: () => nom,
          getMoniteurNomComplet: (l) => (l.moniteur ? `${l.moniteur.prenom} ${l.moniteur.nom}` : `Moniteur #${l.moniteurId}`),
          getVehiculeImmatriculation: (l) => l.vehicule?.immatriculation ?? '—',
          getVehiculeLibelle: (l) => (l.vehicule ? `${l.vehicule.marque} ${l.vehicule.modele}` : 'Sans véhicule'),
        }}
        enablePagination
        enableToolbar
        defaultPageSize={10}
        title="Toutes les leçons"
        description={`Historique et leçons à venir de ${nom}`}
        onAddClick={canPlan ? () => navigate(createUrl) : undefined}
        asCard
      />
    </div>
  );
}
