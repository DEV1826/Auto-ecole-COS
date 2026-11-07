// src/features/admin/pages/AdminUserDetailPage.tsx

/**
 * @module features/admin/pages/AdminUserDetailPage
 * @description
 * Fiche d'un utilisateur : identité, rôle et niveau, sessions actives (révocation),
 * permissions, activité récente (journal d'audit), réinitialisation du mot de
 * passe par code et activation / désactivation du compte.
 */

import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Copy,
  KeyRound,
  Laptop,
  LogOut,
  Mail,
  Pencil,
  Power,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

import { useAuth } from '@/hooks/use.auth';
import { useAdmin } from '@/hooks/use.admin';
import { PROTECTED_ROUTES } from '@/config';
import { cn } from '@/lib/utils';
import { NIVEAU_ACCES_CONFIG, ROLE_CONFIG } from '@/types/enums';
import type { Session, UtilisateurDetail } from '@/types/auth.types';
import type { AuditLog } from '@/types/admin.types';

const fmtDateTime = (d: Date | string) => format(new Date(d), "d MMM yyyy 'à' HH:mm", { locale: fr });
const ago = (d: Date | string) => formatDistanceToNow(new Date(d), { addSuffix: true, locale: fr });

function describeAgent(ua: string | null): string {
  if (!ua) return 'Appareil inconnu';
  if (/Electron/i.test(ua)) return 'Application de bureau';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac OS/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return ua.slice(0, 40);
}

type Confirm =
  | { kind: 'toggle' }
  | { kind: 'revoke-all' }
  | { kind: 'reset' }
  | null;

export default function AdminUserDetailPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const invalidId = !Number.isInteger(userId) || userId <= 0;
  const {
    user: currentUser,
    getUserById,
    getUserSessions,
    revokeSession,
    revokeAllUserSessions,
    updateUser,
    requestPasswordResetByEmail,
  } = useAuth();
  const { getAuditLogs } = useAdmin();

  const [user, setUser] = React.useState<UtilisateurDetail | null>(null);
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState<Confirm>(null);
  const [busy, setBusy] = React.useState(false);
  const [resetCode, setResetCode] = React.useState<string | null>(null);
  const error = invalidId ? "Identifiant d'utilisateur invalide." : fetchError;
  const isSelf = currentUser?.id === userId;

  const load = React.useCallback(async () => {
    if (invalidId) return;
    try {
      const [u, s] = await Promise.all([getUserById(userId), getUserSessions(userId)]);
      setUser(u);
      setSessions(s.filter((x) => x.actif));
    } catch (err) {
      setFetchError(errorMessage(err, "Impossible de charger l'utilisateur."));
    }
    try {
      const res = await getAuditLogs({ utilisateurId: userId, limit: 10, page: 1 });
      setLogs(res.logs ?? []);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, [userId, invalidId, getUserById, getUserSessions, getAuditLogs]);

  React.useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      toast.error('Action impossible', { description: errorMessage(err) });
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const handleConfirm = () => {
    if (!user || !confirm) return;
    if (confirm.kind === 'toggle') {
      void run(async () => {
        const updated = await updateUser(user.id, { actif: !user.actif });
        setUser({ ...user, actif: updated.actif });
        if (!updated.actif) await revokeAllUserSessions(user.id).then(() => setSessions([]));
        toast.success(updated.actif ? 'Compte réactivé' : 'Compte désactivé');
      });
    } else if (confirm.kind === 'revoke-all') {
      void run(async () => {
        await revokeAllUserSessions(user.id);
        setSessions([]);
        toast.success('Toutes les sessions ont été fermées');
      });
    } else if (confirm.kind === 'reset') {
      void run(async () => {
        const res = await requestPasswordResetByEmail(user.email, true);
        if (res.code) setResetCode(res.code);
        else toast.info(res.message);
      });
    }
  };

  const handleRevokeOne = (session: Session) =>
    void run(async () => {
      await revokeSession(session.id);
      setSessions((list) => list.filter((s) => s.id !== session.id));
      toast.success('Session fermée');
    });

  if (error) {
    return <ErrorDialog open onOpenChange={() => navigate(PROTECTED_ROUTES.ADMIN.USERS.LIST)} title="Erreur de chargement" message={error} closeText="Retour aux utilisateurs" />;
  }

  if (!user) {
    return (
      <div className="space-y-5 p-4 md:p-1 pb-12">
        <Skeleton className="h-14 w-80" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="h-80" />
          <Skeleton className="h-80 lg:col-span-2" />
        </div>
      </div>
    );
  }

  const role = ROLE_CONFIG[user.role];
  const niveau = NIVEAU_ACCES_CONFIG[user.niveau];
  const permissionsParRessource = user.permissions.reduce<Record<string, string[]>>((acc, p) => {
    (acc[p.ressource] ??= []).push(p.action);
    return acc;
  }, {});

  const confirmTexts: Record<NonNullable<Confirm>['kind'], { title: string; body: string; action: string }> = {
    toggle: user.actif
      ? { title: 'Désactiver ce compte ?', body: "L'utilisateur ne pourra plus se connecter et ses sessions ouvertes seront fermées.", action: 'Désactiver' }
      : { title: 'Réactiver ce compte ?', body: "L'utilisateur pourra de nouveau se connecter.", action: 'Réactiver' },
    'revoke-all': { title: 'Fermer toutes les sessions ?', body: "L'utilisateur sera déconnecté de tous ses appareils.", action: 'Fermer les sessions' },
    reset: {
      title: 'Générer un code de réinitialisation ?',
      body: "Un code à usage unique, valable 1 heure, sera généré. Communiquez-le à l'utilisateur pour qu'il choisisse un nouveau mot de passe.",
      action: 'Générer le code',
    },
  };

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader
        icon={UserRound}
        accent="sky"
        title={`${user.prenom} ${user.nom}`}
        badge={user.actif ? 'Actif' : 'Désactivé'}
        subtitle={
          <>
            <Mail className="h-3 w-3" />
            <span>{user.email}</span>
          </>
        }
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to={PROTECTED_ROUTES.ADMIN.USERS.LIST}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Utilisateurs
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={PROTECTED_ROUTES.ADMIN.USERS.PERMISSIONS(user.id)}>
                <ShieldCheck className="h-4 w-4 mr-1" /> Permissions
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to={PROTECTED_ROUTES.ADMIN.USERS.EDIT(user.id)}>
                <Pencil className="h-4 w-4 mr-1" /> Modifier
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Identité & actions */}
        <Card className="rounded-md">
          <CardContent className="pt-6 space-y-5">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className={cn('flex size-20 items-center justify-center rounded-full text-2xl font-bold', role.bgColor, role.textColor)}>
                {`${user.prenom[0] ?? ''}${user.nom[0] ?? ''}`.toUpperCase()}
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                <Badge variant="outline" className={cn('border-0', role.bgColor, role.textColor)}>
                  <role.icon className="h-3 w-3 mr-1" /> {role.label}
                </Badge>
                <Badge variant="outline" className={cn('border-0', niveau.bgColor, niveau.textColor)}>
                  {niveau.label}
                </Badge>
              </div>
              {niveau.description && <p className="text-xs text-muted-foreground">{niveau.description}</p>}
            </div>
            <dl className="space-y-2 text-sm">
              {user.createdAt && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Créé</dt>
                  <dd>{format(new Date(user.createdAt), 'd MMM yyyy', { locale: fr })}</dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground flex items-center gap-1.5"><Laptop className="h-3.5 w-3.5" /> Sessions actives</dt>
                <dd className="tabular-nums">{sessions.length}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Permissions</dt>
                <dd className="tabular-nums">{user.permissions.length}</dd>
              </div>
            </dl>
            <div className="grid gap-2 border-t pt-4">
              <Button variant="outline" size="sm" className="justify-start" onClick={() => setConfirm({ kind: 'reset' })} disabled={busy}>
                <KeyRound className="h-4 w-4 mr-2" /> Réinitialiser le mot de passe
              </Button>
              {!isSelf && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn('justify-start', user.actif && 'text-destructive hover:text-destructive')}
                  onClick={() => setConfirm({ kind: 'toggle' })}
                  disabled={busy}
                >
                  <Power className="h-4 w-4 mr-2" /> {user.actif ? 'Désactiver le compte' : 'Réactiver le compte'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-5">
          {/* Sessions */}
          <Card className="rounded-md">
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="text-base font-semibold">Sessions actives</CardTitle>
                <CardDescription>Appareils actuellement connectés avec ce compte.</CardDescription>
              </div>
              {sessions.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setConfirm({ kind: 'revoke-all' })} disabled={busy}>
                  <LogOut className="h-4 w-4 mr-1" /> Tout fermer
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">Aucune session active.</p>
              ) : (
                sessions.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-md border p-3">
                    <Laptop className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{describeAgent(s.userAgent)}</p>
                      <p className="text-xs text-muted-foreground">
                        Ouverte {ago(s.createdAt)} · dernière activité {ago(s.dernierAcces)}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRevokeOne(s)} disabled={busy}>
                      Fermer
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card className="rounded-md">
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="text-base font-semibold">Permissions</CardTitle>
                <CardDescription>Droits accordés en plus de ceux du rôle.</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to={PROTECTED_ROUTES.ADMIN.USERS.PERMISSIONS(user.id)}>Gérer</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {Object.keys(permissionsParRessource).length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune permission spécifique.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(permissionsParRessource).map(([ressource, actions]) => (
                    <div key={ressource} className="rounded-md border px-2.5 py-1.5 text-xs">
                      <span className="font-medium capitalize">{ressource}</span>
                      <span className="text-muted-foreground"> · {actions.join(', ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activité */}
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-sky-600" /> Activité récente
              </CardTitle>
              <CardDescription>Dix dernières actions enregistrées au journal d'audit.</CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
              ) : logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune activité enregistrée.</p>
              ) : (
                <ul className="divide-y">
                  {logs.map((log) => (
                    <li key={log.id} className="flex items-start gap-3 py-2 text-sm">
                      <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', log.statut === 'SUCCESS' ? 'bg-emerald-500' : 'bg-red-500')} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{log.description || log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.action}
                          {log.ressource && ` · ${log.ressource}`}
                        </p>
                      </div>
                      <time className="shrink-0 text-xs text-muted-foreground" dateTime={new Date(log.createdAt).toISOString()}>
                        {fmtDateTime(log.createdAt)}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && !busy && setConfirm(null)}>
        {confirm && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmTexts[confirm.kind].title}</AlertDialogTitle>
              <AlertDialogDescription>{confirmTexts[confirm.kind].body}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                disabled={busy}
                onClick={(e) => {
                  e.preventDefault();
                  handleConfirm();
                }}
              >
                {confirmTexts[confirm.kind].action}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>

      <AlertDialog open={resetCode !== null} onOpenChange={(open) => !open && setResetCode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Code de réinitialisation</AlertDialogTitle>
            <AlertDialogDescription>
              Transmettez ce code à {user.prenom}. Il est valable 1 heure et ne peut servir qu'une fois, depuis « Mot de passe oublié ».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center justify-center gap-3 py-2">
            <span className="font-mono text-3xl font-bold tracking-[0.4em]">{resetCode}</span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Copier le code"
              onClick={() => resetCode && navigator.clipboard.writeText(resetCode).then(() => toast.success('Code copié'))}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction>Fermer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
