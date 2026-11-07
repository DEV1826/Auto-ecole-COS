// src/features/admin/pages/AdminUserPermissionsPage.tsx

/**
 * @module features/admin/pages/AdminUserPermissionsPage
 * @description
 * Gestion des permissions d'un utilisateur sous forme de grille
 * ressources × actions. Chaque case est enregistrée immédiatement
 * (attribution ou révocation), avec retour visuel et annulation en cas d'erreur.
 */

import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Banknote,
  BarChart3,
  BookOpen,
  CalendarDays,
  Car,
  ClipboardList,
  FileText,
  GraduationCap,
  Loader2,
  Receipt,
  ShieldCheck,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { PageHeader, errorMessage } from '@/components/forms/FormPageKit';

import { useAuth } from '@/hooks/use.auth';
import { PROTECTED_ROUTES } from '@/config';
import { cn } from '@/lib/utils';
import { NIVEAU_ACCES_CONFIG, ROLE_CONFIG } from '@/types/enums';
import type { UtilisateurDetail } from '@/types/auth.types';

const RESSOURCES: Array<{ key: string; label: string; icon: LucideIcon }> = [
  { key: 'candidats', label: 'Candidats', icon: GraduationCap },
  { key: 'formations', label: 'Formations', icon: BookOpen },
  { key: 'planning', label: 'Planning', icon: CalendarDays },
  { key: 'examens', label: 'Examens', icon: ClipboardList },
  { key: 'moniteurs', label: 'Moniteurs', icon: Users },
  { key: 'vehicules', label: 'Véhicules', icon: Car },
  { key: 'paiements', label: 'Paiements', icon: Banknote },
  { key: 'factures', label: 'Factures', icon: Receipt },
  { key: 'depenses', label: 'Dépenses', icon: Wallet },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'rapports', label: 'Rapports', icon: BarChart3 },
  { key: 'utilisateurs', label: 'Utilisateurs', icon: UserCog },
];

const ACTIONS: Array<{ key: string; label: string }> = [
  { key: 'read', label: 'Consulter' },
  { key: 'create', label: 'Créer' },
  { key: 'update', label: 'Modifier' },
  { key: 'delete', label: 'Supprimer' },
];

type Granted = Map<string, number>; // "ressource:action" -> id de permission

const keyOf = (r: string, a: string) => `${r}:${a}`;

export default function AdminUserPermissionsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const invalidId = !Number.isInteger(userId) || userId <= 0;
  const { getUserById, assignPermission, revokePermission } = useAuth();

  const [user, setUser] = React.useState<UtilisateurDetail | null>(null);
  const [granted, setGranted] = React.useState<Granted>(new Map());
  const [pending, setPending] = React.useState<Set<string>>(new Set());
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const error = invalidId ? "Identifiant d'utilisateur invalide." : fetchError;

  React.useEffect(() => {
    if (invalidId) return;
    let cancelled = false;
    getUserById(userId)
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setGranted(new Map(u.permissions.filter((p) => p.actif !== false).map((p) => [keyOf(p.ressource, p.action), p.id])));
      })
      .catch((err) => !cancelled && setFetchError(errorMessage(err, "Impossible de charger l'utilisateur.")));
    return () => {
      cancelled = true;
    };
  }, [userId, invalidId, getUserById]);

  const setOne = async (ressource: string, action: string, on: boolean) => {
    const k = keyOf(ressource, action);
    if (pending.has(k)) return;
    const permissionId = granted.get(k);
    setPending((s) => new Set(s).add(k));
    try {
      if (on) {
        const perm = await assignPermission(userId, ressource, action);
        setGranted((g) => new Map(g).set(k, perm.id));
      } else if (permissionId) {
        await revokePermission(permissionId);
        setGranted((g) => {
          const next = new Map(g);
          next.delete(k);
          return next;
        });
      }
    } catch (err) {
      toast.error('Modification impossible', { description: errorMessage(err) });
    } finally {
      setPending((s) => {
        const next = new Set(s);
        next.delete(k);
        return next;
      });
    }
  };

  const setRow = async (ressource: string, on: boolean) => {
    for (const a of ACTIONS) {
      if (granted.has(keyOf(ressource, a.key)) !== on) await setOne(ressource, a.key, on);
    }
  };

  if (error) {
    return <ErrorDialog open onOpenChange={() => navigate(PROTECTED_ROUTES.ADMIN.USERS.LIST)} title="Erreur de chargement" message={error} closeText="Retour aux utilisateurs" />;
  }

  const fullAccess = user && (user.niveau === 'SUPER_ADMIN' || user.niveau === 'ADMIN');

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader
        icon={ShieldCheck}
        accent="sky"
        title={user ? `Permissions de ${user.prenom} ${user.nom}` : 'Permissions'}
        badge={user ? `${granted.size} accordée${granted.size > 1 ? 's' : ''}` : undefined}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={PROTECTED_ROUTES.ADMIN.USERS.DETAIL(userId)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Fiche utilisateur
            </Link>
          </Button>
        }
      />

      {user && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline" className={cn('border-0', ROLE_CONFIG[user.role].bgColor, ROLE_CONFIG[user.role].textColor)}>
            {ROLE_CONFIG[user.role].label}
          </Badge>
          <Badge variant="outline" className={cn('border-0', NIVEAU_ACCES_CONFIG[user.niveau].bgColor, NIVEAU_ACCES_CONFIG[user.niveau].textColor)}>
            {NIVEAU_ACCES_CONFIG[user.niveau].label}
          </Badge>
          {fullAccess && (
            <span className="text-muted-foreground">
              Ce niveau d'accès donne déjà les droits d'administration ; les cases ci-dessous précisent les droits détaillés.
            </span>
          )}
        </div>
      )}

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Droits par module</CardTitle>
          <CardDescription>Chaque modification est enregistrée immédiatement et tracée dans le journal d'audit.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {!user ? (
            <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Module</th>
                  {ACTIONS.map((a) => (
                    <th key={a.key} className="px-3 py-2 text-center font-medium">
                      {a.label}
                    </th>
                  ))}
                  <th className="py-2 pl-3 text-right font-medium">Ligne</th>
                </tr>
              </thead>
              <tbody>
                {RESSOURCES.map((r) => {
                  const count = ACTIONS.filter((a) => granted.has(keyOf(r.key, a.key))).length;
                  return (
                    <tr key={r.key} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2.5 pr-4">
                        <span className="flex items-center gap-2 font-medium">
                          <r.icon className="h-4 w-4 text-sky-600" />
                          {r.label}
                        </span>
                      </td>
                      {ACTIONS.map((a) => {
                        const k = keyOf(r.key, a.key);
                        return (
                          <td key={a.key} className="px-3 py-2.5 text-center">
                            {pending.has(k) ? (
                              <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                              <Checkbox
                                checked={granted.has(k)}
                                onCheckedChange={(v) => void setOne(r.key, a.key, v === true)}
                                aria-label={`${a.label} — ${r.label}`}
                              />
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2.5 pl-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => void setRow(r.key, count < ACTIONS.length)}
                        >
                          {count < ACTIONS.length ? 'Tout' : 'Aucun'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
