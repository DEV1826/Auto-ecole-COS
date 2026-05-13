// src/features/admin/pages/AuditLogsListPage.tsx

/**
 * @module features/admin/pages/AuditLogsListPage
 * @description
 * Page principale de la liste des logs d’audit pour l’administration système.
 * Thème : Slate (accent slate-700).
 *
 * Layout :
 * ─ En-tête : titre, nombre total de logs, date, bouton d’export (optionnel)
 * ─ Bloc statistiques (`StatsAuditLogs`) — repliable
 * ─ Tableau complet (`AuditLogsTable`) avec filtres, période, pagination
 *
 * Données mockées (à remplacer par des appels API réels).
 * Les appels d’API doivent être filtrés selon les permissions (seul l’admin peut voir les logs complets).
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * <AuditLogsListPage />
 * ```
 */

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatsAuditLogs } from '../components/StatsAuditLogs';
import { AuditLogsTable } from '../components/AuditLogsTable';
import { useAuth } from '@/hooks/use.auth';
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb';
import type { AuditLog } from '@/types/admin.types';
import { getAvatarUrl } from '@/lib';

// ─────────────────────────────────────────────────────────────────────────────
// Génération de logs d’audit mockés
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Liste des actions possibles dans les logs.
 */
const ACTIONS = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'CREATE_USER',
  'UPDATE_USER',
  'DELETE_USER',
  'CREATE_CANDIDAT',
  'UPDATE_CANDIDAT',
  'DELETE_CANDIDAT',
  'CREATE_PAIEMENT',
  'UPDATE_PAIEMENT',
  'DELETE_PAIEMENT',
  'CREATE_LECON',
  'UPDATE_LECON',
  'DELETE_LECON',
  'CREATE_EXAMEN',
  'UPDATE_EXAMEN',
  'DELETE_EXAMEN',
  'CREATE_FACTURE',
  'UPDATE_FACTURE',
  'DELETE_FACTURE',
  'CREATE_VEHICULE',
  'UPDATE_VEHICULE',
  'DELETE_VEHICULE',
  'CREATE_DOCUMENT',
  'DELETE_DOCUMENT',
  'EXPORT_DATA',
  'PERMISSION_CHANGE',
];

/**
 * Liste des ressources possibles.
 */
const RESSOURCES = [
  'Utilisateur',
  'Candidat',
  'Paiement',
  'Leçon',
  'Examen',
  'Facture',
  'Véhicule',
  'Document',
  'Permission',
  null,
];

/**
 * Utilisateurs mockés pour enrichir les logs.
 */
const MOCK_USERS = [
  { id: 1, email: 'admin@cos.com', nom: 'Admin', prenom: 'Super' },
  { id: 2, email: 'secretaire@cos.com', nom: 'Dupont', prenom: 'Marie' },
  { id: 3, email: 'moniteur@cos.com', nom: 'Martin', prenom: 'Jean' },
];

/**
 * Génère une liste de logs d’audit aléatoires.
 */
function generateMockAuditLogs(count: number = 150): AuditLog[] {
  const logs: AuditLog[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const userId = MOCK_USERS[i % MOCK_USERS.length].id;
    const user = MOCK_USERS.find((u) => u.id === userId) ?? null;
    const action = ACTIONS[i % ACTIONS.length];
    const ressource = RESSOURCES[i % RESSOURCES.length];
    const statut = action.includes('FAILED') ? 'FAILED' : (Math.random() > 0.9 ? 'FAILED' : 'SUCCESS');
    const createdAt = new Date(now);
    createdAt.setDate(now.getDate() - Math.floor(Math.random() * 90)); // derniers 90 jours
    createdAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

    const log: AuditLog = {
      id: i + 1,
      utilisateurId: userId,
      action,
      ressource,
      ressourceId: Math.random() > 0.5 ? Math.floor(Math.random() * 100) + 1 : null,
      description: `${action} ${statut === 'SUCCESS' ? 'réussi' : 'échoué'} sur ${ressource || 'système'}`,
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      statut: statut as 'SUCCESS' | 'FAILED',
      createdAt,
      utilisateur: user ? { id: user.id, email: user.email!, nom: user.nom!, prenom: user.prenom! } : null,
    };
    logs.push(log);
  }

  // Trier par date décroissante (les plus récents en premier)
  logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return logs;
}

/**
 * Statistiques agrégées pour les logs d’audit.
 */
export interface AuditLogsStats {
  total: number;
  successCount: number;
  failedCount: number;
  byAction: Record<string, number>;
  last7Days: number;
  thisMonth: number;
}

/**
 * Génère les statistiques à partir des logs.
 */
function generateMockStats(logs: AuditLog[]): AuditLogsStats {
  const total = logs.length;
  const successCount = logs.filter((l) => l.statut === 'SUCCESS').length;
  const failedCount = logs.filter((l) => l.statut === 'FAILED').length;

  const byAction: Record<string, number> = {};
  logs.forEach((log) => {
    byAction[log.action] = (byAction[log.action] || 0) + 1;
  });

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const last7Days = logs.filter((l) => l.createdAt >= sevenDaysAgo).length;
  const thisMonth = logs.filter((l) => l.createdAt >= startOfMonth).length;

  return { total, successCount, failedCount, byAction, last7Days, thisMonth };
}

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────

export default function AuditLogsListPage(): React.JSX.Element {
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === 'ADMIN';

  // Données mockées
  const [logs, setLogs] = React.useState<AuditLog[]>(() => generateMockAuditLogs(150));
  const [stats, setStats] = React.useState<AuditLogsStats>(() => generateMockStats(logs));
  const [isLoading, setIsLoading] = React.useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const fresh = generateMockAuditLogs(150);
    setLogs(fresh);
    setStats(generateMockStats(fresh));
    setIsLoading(false);
    toast.success('Logs d’audit actualisés');
  };

  const handleViewDetails = (log: AuditLog) => {
    toast.info(`Détails du log : ${log.action} - ${log.description}`);
    // Ici, on pourrait ouvrir un modal avec le JSON complet
  };

  const handleFilterByUser = (userId: number) => {
    toast.info(`Filtrer par utilisateur ID ${userId}`);
    // En pratique, on appliquerait un filtre côté serveur
  };

  const handleExport = () => {
    toast.success('Export des logs (simulé)');
    // Logique d’export CSV/JSON
  };

  // Déterminer la variante du tableau (admin/auditor)
  const variant = isAdmin ? 'admin' : 'auditor';

  return (
    <>
      <div className="space-y-5 p-4 md:p-1 pb-10">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-12 rounded-md bg-slate-700 text-white shadow-sm shrink-0">
              <FileText className="size-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Journal d’audit</h1>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <span className="capitalize">
                  {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
                </span>
                <span>·</span>
                <Badge
                  variant="outline"
                  className="text-[10px] h-4 px-1.5 border-0 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {logs.length} événements
                </Badge>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="h-8 gap-1 text-xs">
              <Download className="h-3.5 w-3.5" />
              Exporter
            </Button>
            <PageBreadcrumb className="hidden lg:flex" />
          </div>
        </div>

        {/* Statistiques repliables */}
        <div className="space-y-2">
          <StatsAuditLogs
            stats={stats}
            isLoading={isLoading}
            showTrends={isAdmin}
          />
        </div>

        {/* Tableau des logs d’audit */}
        <AuditLogsTable
          logs={logs}
          variant={variant}
          enrichments={{
            getNomComplet: (log) => {
              const user = log.utilisateur;
              return user ? `${user.prenom} ${user.nom}`.trim() : 'Anonyme';
            },
            getEmail: (log) => log.utilisateur?.email ?? '',
            getAvatarUrl: (log) => getAvatarUrl(`${log.utilisateur?.nom}`),
            getInitials: (log) => {
              const user = log.utilisateur;
              return user ? `${user.prenom?.[0]}${user.nom?.[0]}`.toUpperCase() : '??';
            },
          }}
          actions={{
            onViewDetails: handleViewDetails,
            onFilterByUser: isAdmin ? handleFilterByUser : undefined,
          }}
          defaultPeriodFilter="month"
          showPeriodFilter
          enablePagination
          enableToolbar
          defaultPageSize={20}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          title="Historique des événements système"
          description="Consultez l’ensemble des actions sensibles enregistrées dans le système"
          asCard
          className="w-full"
        />
      </div>
    </>
  );
}