// src/features/admin/components/UserDetailDialog.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * @module features/admin/components/UserDetailDialog
 * @description
 * Dialogue modal pour afficher les détails d’un utilisateur : informations générales,
 * permissions, sessions actives.
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use.auth';
import { getAvatarUrl } from '@/lib/utils';
import { ROLE_CONFIG, NIVEAU_ACCES_CONFIG } from '@/types/enums';
import type { Utilisateur, Session } from '@/types/auth.types';
import type { Permission } from '@/types/admin.types';

export interface UserDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: number | null;
}

export function UserDetailDialog({ open, onOpenChange, userId }: UserDetailDialogProps) {
    const { getUserById, getUserPermissions, getUserSessions, revokeSession } = useAuth();
    const [user, setUser] = React.useState<Utilisateur | null>(null);
    const [permissions, setPermissions] = React.useState<Permission[]>([]);
    const [sessions, setSessions] = React.useState<Session[]>([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (open && userId) {
            const loadData = async () => {
                setLoading(true);
                try {
                    const [userData, perms, sess] = await Promise.all([
                        getUserById(userId),
                        getUserPermissions(userId),
                        getUserSessions(userId),
                    ]);
                    setUser(userData);
                    setPermissions(perms);
                    setSessions(sess);
                } catch (err) {
                    toast.error('Erreur lors du chargement des détails');
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        }
    }, [open, userId, getUserById, getUserPermissions, getUserSessions]);

    const handleRevokeSession = async (sessionId: number) => {
        if (window.confirm('Révoquer cette session ? L’utilisateur sera déconnecté.')) {
            try {
                await revokeSession(sessionId);
                toast.success('Session révoquée');
                const updated = await getUserSessions(userId!);
                setSessions(updated);
            } catch (err) {
                toast.error('Erreur lors de la révocation');
            }
        }
    };

    if (!userId) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Détails de l’utilisateur</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full rounded-md" />
                        <Skeleton className="h-48 w-full rounded-md" />
                    </div>
                ) : user ? (
                    <>
                        {/* En-tête */}
                        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                            <Avatar className="h-16 w-16 border-2 border-blue-200">
                                <AvatarImage src={getAvatarUrl(user.displayName || `${user.prenom} ${user.nom}`)} />
                                <AvatarFallback className="bg-blue-700 text-white text-lg">
                                    {user.prenom?.[0]}{user.nom?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="text-xl font-semibold">{user.displayName || `${user.prenom} ${user.nom}`}</h3>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                <div className="flex gap-2 mt-2">
                                    <Badge variant="outline">{ROLE_CONFIG[user.role]?.label}</Badge>
                                    <Badge variant="outline">{NIVEAU_ACCES_CONFIG[user.niveau]?.label}</Badge>
                                    <Badge variant={user.actif ? 'success' : 'secondary'}>{user.actif ? 'Actif' : 'Inactif'}</Badge>
                                </div>
                            </div>
                        </div>

                        <Tabs defaultValue="info" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="info">Informations</TabsTrigger>
                                <TabsTrigger value="permissions">Permissions ({permissions.length})</TabsTrigger>
                                <TabsTrigger value="sessions">Sessions ({sessions.filter(s => s.actif).length})</TabsTrigger>
                            </TabsList>

                            <TabsContent value="info" className="space-y-2 pt-2">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="font-medium">Nom :</span> <span>{user.nom}</span>
                                    <span className="font-medium">Prénom :</span> <span>{user.prenom}</span>
                                    <span className="font-medium">Email :</span> <span>{user.email}</span>
                                    <span className="font-medium">Rôle :</span> <span>{ROLE_CONFIG[user.role]?.label}</span>
                                    <span className="font-medium">Niveau :</span> <span>{NIVEAU_ACCES_CONFIG[user.niveau]?.label}</span>
                                    <span className="font-medium">Statut :</span> <span>{user.actif ? 'Actif' : 'Inactif'}</span>
                                </div>
                            </TabsContent>

                            <TabsContent value="permissions" className="pt-2">
                                {permissions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Aucune permission spécifique.</p>
                                ) : (
                                    <div className="space-y-1">
                                        {permissions.map(p => (
                                            <div key={p.id} className="flex justify-between items-center border-b py-1">
                                                <span className="text-sm font-mono">{p.ressource}.{p.action}</span>
                                                <Badge variant="outline">{p.actif ? 'Active' : 'Inactive'}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="sessions" className="pt-2">
                                {sessions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Aucune session active.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {sessions.map(s => (
                                            <div key={s.id} className="flex justify-between items-center border-b py-2">
                                                <div>
                                                    <p className="text-sm">{s.userAgent?.slice(0, 50)}</p>
                                                    <p className="text-xs text-muted-foreground">IP: {s.ipAddress || 'N/A'} · Dernier accès: {new Date(s.dernierAcces).toLocaleString()}</p>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => handleRevokeSession(s.id)} disabled={!s.actif}>
                                                    Révoquer
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </>
                ) : (
                    <p className="text-center text-muted-foreground">Utilisateur non trouvé</p>
                )}
            </DialogContent>
        </Dialog>
    );
}