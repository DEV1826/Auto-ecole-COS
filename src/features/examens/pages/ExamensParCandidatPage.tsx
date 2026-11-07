// src/features/examens/pages/ExamensParCandidatPage.tsx

/**
 * @module features/examens/pages/ExamensParCandidatPage
 * @description
 * Vue consolidée des examens d'un candidat : parcours par épreuve (code puis
 * conduite) avec tentatives, réussite et prochain passage, puis historique
 * complet avec actions (voir, modifier, supprimer, attestation).
 */

import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { ArrowLeft, BookOpen, Car, CheckCircle2, ClipboardList, ClipboardPlus, Clock, Percent, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorDialog } from '@/components/ui/error-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageHeader, errorMessage } from '@/components/forms/FormPageKit';
import { StatsGrid, type StatsCardProps } from '@/features/dashboard/components/common/StatsCard';
import { ExamensTable } from '../components/ExamensTable';

import { useCandidats } from '@/hooks/use.candidats';
import { useExamens } from '@/hooks/use.examens';
import { useAuth } from '@/hooks/use.auth';
import { PROTECTED_ROUTES } from '@/config';
import { cn, getAvatarUrl, openDesktopPath } from '@/lib/utils';
import { RESULTAT_EXAMEN_CONFIG } from '@/types/enums';
import type { TypeExamen } from '@/types/enums';
import type { Candidat } from '@/types/candidats.types';
import type { Examen } from '@/types/examens.types';

const fmt = (d: Date | string) => format(new Date(d), 'd MMM yyyy', { locale: fr });

function EpreuveCard({ type, examens }: { type: TypeExamen; examens: Examen[] }) {
  const list = examens
    .filter((e) => e.type === type)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const reussite = list.find((e) => e.resultat === 'RECU');
  const passes = list.filter((e) => e.resultat !== 'EN_ATTENTE');
  const prochain = list.find((e) => e.resultat === 'EN_ATTENTE');
  const Icon = type === 'CODE' ? BookOpen : Car;

  return (
    <Card className="rounded-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Icon className="h-4 w-4 text-indigo-600" />
              {type === 'CODE' ? 'Code de la route' : 'Conduite'}
            </CardTitle>
            <CardDescription>
              {passes.length} tentative{passes.length > 1 ? 's' : ''}
              {prochain && ` · prochain passage le ${fmt(prochain.date)}`}
            </CardDescription>
          </div>
          {reussite ? (
            <Badge className="border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Obtenu
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Non obtenu
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Aucun examen enregistré.</p>
        ) : (
          <ol className="relative space-y-3 border-l pl-5">
            {list.map((e, i) => {
              const cfg = RESULTAT_EXAMEN_CONFIG[e.resultat];
              return (
                <li key={e.id} className="relative">
                  <span
                    className={cn(
                      'absolute -left-[27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-background',
                      cfg.bgColor
                    )}
                  >
                    <cfg.icon className={cn('h-2.5 w-2.5', cfg.textColor)} />
                  </span>
                  <Link to={PROTECTED_ROUTES.EXAMENS.DETAIL(e.id)} className="block rounded-md px-2 py-1 -mx-2 hover:bg-muted/50">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium">
                        Tentative {i + 1} · {fmt(e.date)}
                      </span>
                      <span className={cn('text-xs font-medium', cfg.textColor)}>
                        {cfg.label}
                        {e.note != null && ` · ${e.note}/20`}
                      </span>
                    </div>
                    {e.centre && <p className="text-xs text-muted-foreground">{e.centre}</p>}
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export default function ExamensParCandidatPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { candidatId: idParam } = useParams<{ candidatId: string }>();
  const candidatId = Number(idParam);
  const invalidId = !Number.isInteger(candidatId) || candidatId <= 0;
  const { getById } = useCandidats();
  const { getByCandidat, delete: deleteExamen, printCertificate } = useExamens();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const canManage = isAdmin || user?.role === 'SECRETAIRE';

  const [candidat, setCandidat] = React.useState<Candidat | null>(null);
  const [examens, setExamens] = React.useState<Examen[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [toDelete, setToDelete] = React.useState<Examen | null>(null);
  const error = invalidId ? 'Identifiant de candidat invalide.' : fetchError;

  const load = React.useCallback(async () => {
    if (invalidId) return;
    try {
      const [c, list] = await Promise.all([getById(candidatId), getByCandidat(candidatId)]);
      setCandidat(c);
      setExamens(list);
    } catch (err) {
      setFetchError(errorMessage(err, 'Impossible de charger les examens.'));
    } finally {
      setLoading(false);
    }
  }, [candidatId, invalidId, getById, getByCandidat]);

  React.useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const passes = examens.filter((e) => e.resultat !== 'EN_ATTENTE');
  const recus = passes.filter((e) => e.resultat === 'RECU').length;
  const ajournes = passes.filter((e) => e.resultat === 'AJOURNE').length;
  const enAttente = examens.length - passes.length;
  const taux = passes.length ? Math.round((recus / passes.length) * 100) : 0;

  const cards: StatsCardProps[] = [
    { id: 'total', title: 'Examens', value: examens.length, icon: <ClipboardList className="h-5 w-5" />, Color: 'blue-600', description: 'Tous types confondus' },
    { id: 'recus', title: 'Réussis', value: recus, icon: <CheckCircle2 className="h-5 w-5" />, Color: 'emerald-600', description: `${ajournes} ajourné${ajournes > 1 ? 's' : ''}` },
    { id: 'attente', title: 'En attente', value: enAttente, icon: <Clock className="h-5 w-5" />, Color: 'amber-600', description: 'Résultat non saisi' },
    { id: 'taux', title: 'Taux de réussite', value: `${taux}%`, icon: <Percent className="h-5 w-5" />, Color: 'red-600', description: 'Sur les épreuves passées' },
  ];

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteExamen(toDelete.id);
      setExamens((list) => list.filter((e) => e.id !== toDelete.id));
      toast.success('Examen supprimé');
    } catch (err) {
      toast.error('Suppression impossible', { description: errorMessage(err) });
    } finally {
      setToDelete(null);
    }
  };

  const handlePrint = async (examen: Examen) => {
    try {
      const result = await printCertificate(examen.id);
      if (result.success && result.path) {
        toast.success('Attestation générée');
        await openDesktopPath(result.path);
      } else {
        toast.error(result.message || "Génération de l'attestation impossible");
      }
    } catch (err) {
      toast.error("Génération de l'attestation impossible", { description: errorMessage(err) });
    }
  };

  if (error) {
    return (
      <ErrorDialog open onOpenChange={() => navigate(PROTECTED_ROUTES.EXAMENS.LIST)} title="Erreur de chargement" message={error} closeText="Retour aux examens" />
    );
  }

  const nom = candidat ? `${candidat.prenom} ${candidat.nom}` : 'Candidat';
  const createUrl = `${PROTECTED_ROUTES.EXAMENS.CREATE}?candidatId=${candidatId}`;

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader
        icon={ClipboardList}
        title={`Examens de ${nom}`}
        badge={candidat ? `Permis ${candidat.categorie}` : undefined}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to={PROTECTED_ROUTES.CANDIDATS.DETAIL(candidatId)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Fiche candidat
              </Link>
            </Button>
            {canManage && (
              <Button size="sm" asChild>
                <Link to={createUrl}>
                  <ClipboardPlus className="h-4 w-4 mr-1" /> Inscrire à un examen
                </Link>
              </Button>
            )}
          </>
        }
      />

      <StatsGrid cards={cards} cols={4} isLoading={loading} classGrid="h-auto" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <EpreuveCard type="CODE" examens={examens} />
        <EpreuveCard type="CONDUITE" examens={examens} />
      </div>

      <ExamensTable
        examens={examens}
        isLoading={loading}
        onRefresh={load}
        variant={isAdmin ? 'admin' : 'secretaire'}
        enrichments={{
          getCandidatNomComplet: () => nom,
          getCandidatEmail: () => candidat?.email ?? '',
          getCandidatAvatarUrl: () => getAvatarUrl(nom),
          getCandidatInitials: () => `${candidat?.prenom?.[0] ?? ''}${candidat?.nom?.[0] ?? ''}`.toUpperCase(),
        }}
        actions={{
          onView: (e) => navigate(PROTECTED_ROUTES.EXAMENS.DETAIL(e.id)),
          onEdit: canManage ? (e) => navigate(PROTECTED_ROUTES.EXAMENS.EDIT(e.id)) : undefined,
          onDelete: isAdmin ? async (e) => setToDelete(e) : undefined,
          onPrintCertificate: canManage ? handlePrint : undefined,
        }}
        enablePagination
        enableToolbar
        defaultPageSize={10}
        title="Historique des examens"
        description={`Toutes les épreuves de ${nom}`}
        showAddButton={canManage}
        onAddClick={() => navigate(createUrl)}
        asCard
      />

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet examen ?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && `Examen du ${fmt(toDelete.date)}. `}Cette action est définitive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()} className="bg-destructive text-white hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {!loading && examens.length === 0 && (
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <XCircle className="h-4 w-4" /> Ce candidat n'est inscrit à aucun examen.
        </p>
      )}
    </div>
  );
}
