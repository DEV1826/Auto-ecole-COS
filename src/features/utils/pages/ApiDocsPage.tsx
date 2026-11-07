// src/features/utils/pages/ApiDocsPage.tsx

/**
 * @module features/utils/pages/ApiDocsPage
 * @description
 * Référence technique du pont IPC (`window.api`) pour les administrateurs et
 * développeurs : méthodes réellement exposées (lues à l'exécution), conventions
 * d'appel, codes d'erreur et restrictions de rôle.
 *
 * Source de vérité des droits : electron/ipc/security.js (PUBLIC_CHANNELS,
 * CHANNEL_ROLES). La table ci-dessous en est un résumé à tenir à jour.
 */

import * as React from 'react';
import { Code2, KeyRound, Lock, Search, ShieldAlert, Unlock } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/forms/FormPageKit';

const PUBLICS = new Set([
  'auth.login',
  'auth.logout',
  'auth.validate',
  'auth.refresh',
  'auth.verifyDeveloperSetupCode',
  'auth.createInitialSetup',
  'auth.requestPasswordResetByEmail',
  'auth.validateResetCode',
  'auth.resetPassword',
]);

const RESTRICTIONS: Array<{ canaux: string; roles: string }> = [
  { canaux: 'admin:getAuditLogs, admin:getAdminStats, admin:getAdminTrends, admin:updateCompanyConfig', roles: 'ADMIN' },
  { canaux: 'vehicules:create / update / delete, vehicules:*Entretien', roles: 'ADMIN' },
  { canaux: 'formations:create, formations:delete, moniteurs:delete, rapports:kpi', roles: 'ADMIN' },
  { canaux: 'formations:update, moniteurs:create / update, examens:create / update / delete', roles: 'ADMIN, SECRETAIRE' },
  { canaux: 'rapports:financier, rapports:export, exports:* (sauf saveFile), export:bilan / excel / recu', roles: 'ADMIN, SECRETAIRE' },
  { canaux: 'auth:createUser / updateUser / deleteUser / assignPermission / revokePermission / getAllUsers', roles: 'Niveau ADMIN ou SUPER_ADMIN (vérifié par le service)' },
  { canaux: 'auth:getUserSessions / getUserPermissions / checkPermission / revokeSession / revokeAllUserSessions', roles: "L'utilisateur lui-même ou un administrateur" },
];

const ERREURS: Array<{ code: string; sens: string }> = [
  { code: 'AUTH_REQUIRED', sens: "Aucun token ou session invalide/expirée. L'interface tente un rafraîchissement puis déconnecte." },
  { code: 'FORBIDDEN', sens: "Rôle insuffisant pour le canal, ou appel provenant d'une origine non autorisée." },
  { code: 'RATE_LIMITED', sens: 'Trop de tentatives échouées (connexion, code de setup, code de réinitialisation).' },
];

function listApi(): Array<{ ns: string; methods: string[] }> {
  const api = (window as unknown as { api?: Record<string, unknown> }).api;
  if (!api) return [];
  return Object.entries(api)
    .filter(([, v]) => v && typeof v === 'object')
    .map(([ns, v]) => ({
      ns,
      methods: Object.entries(v as Record<string, unknown>)
        .filter(([, f]) => typeof f === 'function')
        .map(([m]) => m)
        .sort(),
    }))
    .sort((a, b) => a.ns.localeCompare(b.ns));
}

export default function ApiDocsPage(): React.JSX.Element {
  const [query, setQuery] = React.useState('');
  const namespaces = React.useMemo(() => listApi(), []);
  const q = query.trim().toLowerCase();
  const filtered = namespaces
    .map((n) => ({ ...n, methods: n.methods.filter((m) => !q || `${n.ns}.${m}`.toLowerCase().includes(q)) }))
    .filter((n) => n.methods.length > 0);
  const total = namespaces.reduce((s, n) => s + n.methods.length, 0);

  return (
    <div className="space-y-5 p-4 md:p-1 pb-12">
      <PageHeader icon={Code2} title="Documentation de l'API interne" accent="slate" badge={`${total} méthodes`} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> Conventions d'appel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Le renderer appelle <code className="rounded bg-muted px-1">window.api.&lt;module&gt;.&lt;méthode&gt;(…)</code>. Le preload
              (sandboxé) transmet le canal <code className="rounded bg-muted px-1">module:méthode</code> au processus principal en joignant le
              token d'accès courant.
            </p>
            <p>
              Le processus principal valide le token (JWT + session active), applique les restrictions de rôle puis exécute le
              handler. L'identité de l'appelant est lue dans la session : un identifiant d'utilisateur passé dans les paramètres n'est
              jamais utilisé pour décider des droits.
            </p>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
{`const { candidats, total } = await window.api.candidats.getAll({ page: 1, limit: 20 });
const lecon = await window.api.planning.create({ date, duree: 60, type: 'CONDUITE', candidatId, moniteurId, vehiculeId });`}
            </pre>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" /> Codes d'erreur
            </CardTitle>
            <CardDescription>Préfixe du message d'erreur renvoyé par le processus principal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {ERREURS.map((e) => (
              <div key={e.code} className="flex gap-3 text-sm">
                <code className="h-fit shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">{e.code}</code>
                <span className="text-muted-foreground">{e.sens}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4" /> Restrictions de rôle
          </CardTitle>
          <CardDescription>Tous les autres canaux exigent seulement une session valide. Référence : electron/ipc/security.js.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Canaux</TableHead>
                <TableHead>Autorisés</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RESTRICTIONS.map((r) => (
                <TableRow key={r.canaux}>
                  <TableCell className="font-mono text-xs">{r.canaux}</TableCell>
                  <TableCell className="text-sm">{r.roles}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader className="gap-3">
          <div>
            <CardTitle className="text-base font-semibold">Méthodes exposées</CardTitle>
            <CardDescription>
              Lues à l'exécution sur <code>window.api</code>.{' '}
              <span className="inline-flex items-center gap-1"><Unlock className="h-3 w-3" /> = accessible sans connexion.</span>
            </CardDescription>
          </div>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filtrer : facture, export…" className="pl-9" aria-label="Filtrer les méthodes" />
          </div>
        </CardHeader>
        <CardContent>
          {namespaces.length === 0 ? (
            <p className="text-sm text-muted-foreground">window.api est indisponible (application lancée hors d'Electron ?).</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((n) => (
                <div key={n.ns} className="rounded-md border p-3">
                  <p className="mb-2 flex items-center justify-between font-mono text-sm font-semibold">
                    {n.ns}
                    <Badge variant="outline" className="text-[10px]">{n.methods.length}</Badge>
                  </p>
                  <ul className="space-y-0.5">
                    {n.methods.map((m) => (
                      <li key={m} className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                        {PUBLICS.has(`${n.ns}.${m}`) && <Unlock className="h-3 w-3 text-emerald-600" aria-label="Public" />}
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
