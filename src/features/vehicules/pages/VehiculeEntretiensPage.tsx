// src/features/vehicules/pages/VehiculeEntretiensPage.tsx

/**
 * @module features/vehicules/pages/VehiculeEntretiensPage
 * @description
 * Gestion des entretiens d'un véhicule : synthèse (nombre, coût total, dernier
 * entretien, prochaine échéance), historique, ajout / modification / suppression.
 * Réservé aux administrateurs (route protégée par rôle).
 */

import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CalendarClock,
  Coins,
  Gauge,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Wrench,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { PageHeader, errorMessage } from '@/components/forms/FormPageKit';
import { StatsGrid, type StatsCardProps } from '@/features/dashboard/components/common/StatsCard';
import EntretienDialog, { type EntretienFormValues } from '../components/EntretienDialog';

import { useVehicules } from '@/hooks/use.vehicules';
import type { Entretien, Vehicule } from '@/types/vehicules.types';
import { STATUT_VEHICULE_CONFIG } from '@/types/enums';
import { PROTECTED_ROUTES } from '@/config';
import { cn, formatCurrency } from '@/lib/utils';

const fmt = (d: Date | string) => format(new Date(d), 'd MMM yyyy', { locale: fr });

export default function VehiculeEntretiensPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const vehiculeId = Number(id);
  const { getById, getEntretiensByVehicule, createEntretien, updateEntretien, deleteEntretien } = useVehicules();

  const [vehicule, setVehicule] = React.useState<Vehicule | null>(null);
  const [entretiens, setEntretiens] = React.useState<Entretien[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setLoadError] = React.useState<string | null>(null);
  const invalidId = !Number.isInteger(vehiculeId) || vehiculeId <= 0;
  const loadError = invalidId ? 'Identifiant de véhicule invalide.' : fetchError;
  const [dialog, setDialog] = React.useState<{ open: boolean; entretien: Entretien | null }>({
    open: false,
    entretien: null,
  });
  const [toDelete, setToDelete] = React.useState<Entretien | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    if (invalidId) return;
    try {
      const [v, list] = await Promise.all([getById(vehiculeId), getEntretiensByVehicule(vehiculeId)]);
      setVehicule(v);
      setEntretiens(list);
    } catch (err) {
      setLoadError(errorMessage(err, 'Impossible de charger les entretiens.'));
    } finally {
      setLoading(false);
    }
  }, [vehiculeId, invalidId, getById, getEntretiensByVehicule]);

  React.useEffect(() => {
    // Chargement asynchrone : aucun setState synchrone dans l'effet.
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const sorted = React.useMemo(
    () => [...entretiens].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [entretiens]
  );

  const coutTotal = entretiens.reduce((s, e) => s + (e.cout ?? 0), 0);
  const coutAnnee = entretiens
    .filter((e) => new Date(e.date).getFullYear() === new Date().getFullYear())
    .reduce((s, e) => s + (e.cout ?? 0), 0);
  const dernier = sorted[0];
  const prochainKm =
    vehicule?.prochaineRevisionKm ??
    sorted.find((e) => e.prochainKm)?.prochainKm ??
    null;
  const kmRestants = prochainKm != null && vehicule ? prochainKm - vehicule.kilometrage : null;

  const cards: StatsCardProps[] = [
    {
      id: 'nb',
      title: 'Entretiens',
      value: entretiens.length,
      icon: <Wrench className="h-5 w-5" />,
      Color: 'amber-600',
      description: 'Interventions enregistrées',
    },
    {
      id: 'cout',
      title: 'Coût total',
      value: formatCurrency(coutTotal),
      icon: <Coins className="h-5 w-5" />,
      Color: 'red-600',
      description: `${formatCurrency(coutAnnee)} cette année`,
    },
    {
      id: 'dernier',
      title: 'Dernier entretien',
      value: dernier ? fmt(dernier.date) : '—',
      icon: <CalendarClock className="h-5 w-5" />,
      Color: 'blue-600',
      description: dernier
        ? `${dernier.type} · ${formatDistanceToNow(new Date(dernier.date), { addSuffix: true, locale: fr })}`
        : 'Aucun entretien',
    },
    {
      id: 'prochain',
      title: 'Prochaine échéance',
      value: prochainKm != null ? `${prochainKm.toLocaleString('fr-FR')} km` : '—',
      icon: <Gauge className="h-5 w-5" />,
      Color: 'emerald-600',
      description:
        kmRestants == null
          ? 'Non planifiée'
          : kmRestants <= 0
            ? `Dépassée de ${Math.abs(kmRestants).toLocaleString('fr-FR')} km`
            : `Dans ${kmRestants.toLocaleString('fr-FR')} km`,
    },
  ];

  const handleSave = async (values: EntretienFormValues) => {
    const payload = {
      type: values.type.trim(),
      description: values.description?.trim() || undefined,
      cout: values.cout,
      kilometre: values.kilometre,
      prochainKm: values.prochainKm,
      date: values.date.toISOString(),
      vehiculeId,
    };
    try {
      if (dialog.entretien) {
        const updated = await updateEntretien(dialog.entretien.id, payload);
        setEntretiens((list) => list.map((e) => (e.id === updated.id ? updated : e)));
        toast.success('Entretien modifié');
      } else {
        const created = await createEntretien(payload);
        setEntretiens((list) => [created, ...list]);
        toast.success('Entretien ajouté', { description: `${created.type} du ${fmt(created.date)}` });
      }
      setDialog({ open: false, entretien: null });
      // Le service peut mettre à jour le kilométrage / la prochaine révision du véhicule.
      getById(vehiculeId).then(setVehicule).catch(() => undefined);
    } catch (err) {
      toast.error("Enregistrement impossible", { description: errorMessage(err) });
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteEntretien(toDelete.id);
      setEntretiens((list) => list.filter((e) => e.id !== toDelete.id));
      toast.success('Entretien supprimé');
      setToDelete(null);
    } catch (err) {
      toast.error('Suppression impossible', { description: errorMessage(err) });
    } finally {
      setDeleting(false);
    }
  };

  if (loadError) {
    return (
      <ErrorDialog
        open
        onOpenChange={() => navigate(PROTECTED_ROUTES.VEHICULES.LIST)}
        title="Erreur de chargement"
        message={loadError}
        closeText="Retour à la liste"
      />
    );
  }

  const statutCfg = vehicule ? STATUT_VEHICULE_CONFIG[vehicule.statut] : null;

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader
        icon={Wrench}
        accent="amber"
        title={vehicule ? `Entretiens · ${vehicule.marque} ${vehicule.modele}` : 'Entretiens'}
        badge={vehicule?.immatriculation}
        subtitle={
          vehicule && statutCfg ? (
            <span className="flex items-center gap-2">
              <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', statutCfg.bgColor, statutCfg.textColor)}>
                {statutCfg.label}
              </span>
              <span>{vehicule.kilometrage.toLocaleString('fr-FR')} km au compteur</span>
            </span>
          ) : undefined
        }
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to={PROTECTED_ROUTES.VEHICULES.DETAIL(vehiculeId)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Fiche véhicule
              </Link>
            </Button>
            <Button size="sm" onClick={() => setDialog({ open: true, entretien: null })} disabled={!vehicule}>
              <Plus className="h-4 w-4 mr-1" /> Nouvel entretien
            </Button>
          </>
        }
      />

      {kmRestants != null && kmRestants <= 1000 && (
        <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            {kmRestants <= 0
              ? `La révision prévue à ${prochainKm!.toLocaleString('fr-FR')} km est dépassée.`
              : `Révision à prévoir : plus que ${kmRestants.toLocaleString('fr-FR')} km.`}
          </span>
        </div>
      )}

      <StatsGrid cards={cards} cols={4} isLoading={loading} classGrid="h-auto" />

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Historique des entretiens</CardTitle>
          <CardDescription>Du plus récent au plus ancien.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Wrench />
                </EmptyMedia>
                <EmptyTitle>Aucun entretien</EmptyTitle>
                <EmptyDescription>Ajoutez la première intervention réalisée sur ce véhicule.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="text-right">Kilométrage</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Prochain à</TableHead>
                    <TableHead className="text-right">Coût</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap">{fmt(e.date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {e.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs truncate text-muted-foreground">
                        {e.description || '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {e.kilometre != null ? `${e.kilometre.toLocaleString('fr-FR')} km` : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums hidden sm:table-cell">
                        {e.prochainKm != null ? `${e.prochainKm.toLocaleString('fr-FR')} km` : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {e.cout != null ? `${e.cout.toLocaleString('fr-FR')} FCFA` : '—'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDialog({ open: true, entretien: e })}>
                              <Pencil className="h-4 w-4 mr-2" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => setToDelete(e)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <EntretienDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        entretien={dialog.entretien}
        kilometrageActuel={vehicule?.kilometrage}
        onSubmit={handleSave}
      />

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && !deleting && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet entretien ?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && `${toDelete.type} du ${fmt(toDelete.date)}. `}
              Cette action est définitive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
