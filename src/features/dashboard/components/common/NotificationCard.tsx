// src/features/dashboard/components/common/NotificationCard.tsx

/**
 * @module dashboard/components/common/NotificationCard
 * @description Carte de notification individuelle pour afficher les alertes, messages, rappels, etc.
 * Supporte différents types (message, alerte, rendez-vous, médicament), priorité, état lu/non lu,
 * et des actions contextuelles (marquer comme lu, supprimer, répondre).
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @example
 * ```tsx
 * <NotificationCard
 *   notification={notification}
 *   onMarkAsRead={handleMarkAsRead}
 *   onDelete={handleDelete}
 *   onReply={handleReply}
 *   onOpen={handleOpen}
 *   variant="default"
 *   showActions
 * />
 * ```
 */

import * as React from 'react';
import {
  Bell,
  Check,
  Reply,
  Trash2,
  FileText,
  AlertCircle,
  MessageSquare,
  Pill,
  Stethoscope,
  Clock,
  MoreVertical,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Notification, NotificationPriority, NotificationType } from '@/types';

/**
 * Propriétés du composant NotificationCard
 */
export interface NotificationCardProps {
  /** La notification à afficher */
  notification: Notification;
  /** Variante d'affichage (défaut: 'default') */
  variant?: 'default' | 'compact' | 'minimal';
  /** Afficher les actions (marquer lu, supprimer, répondre) (défaut: true) */
  showActions?: boolean;
  /** Fonction appelée lors du clic sur la notification (redirection) */
  onOpen?: (notification: Notification) => void;
  /** Fonction pour marquer comme lue */
  onMarkAsRead?: (id: string) => void;
  /** Fonction pour supprimer */
  onDelete?: (id: string) => void;
  /** Fonction pour répondre (uniquement pour les messages) */
  onReply?: (id: string) => void;
  /** Classes additionnelles */
  className?: string;
}

/**
 * Retourne l'icône principale selon le type
 */
function getTypeIcon(type: NotificationType) {
  switch (type) {
    case 'message':
      return <MessageSquare className="h-5 w-5" />;
    case 'alert':
      return <AlertCircle className="h-5 w-5" />;
    case 'info':
      return <Clock className="h-5 w-5" />;
    case 'appointment_reminder':
      return <Stethoscope className="h-5 w-5" />;
    case 'medication_reminder':
      return <Pill className="h-5 w-5" />;
    case 'system':
      return <Bell className="h-5 w-5" />;
    case 'update':
      return <FileText className="h-5 w-5" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
}

/**
 * Retourne la classe CSS pour la pastille de priorité
 */
function getPriorityColor(priority: NotificationPriority) {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500';
    case 'high':
      return 'bg-orange-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
}

/**
 * Retourne le libellé de priorité
 */
function getPriorityLabel(priority: NotificationPriority) {
  switch (priority) {
    case 'urgent':
      return 'Urgent';
    case 'high':
      return 'Haute';
    case 'medium':
      return 'Moyenne';
    case 'low':
      return 'Basse';
    default:
      return '';
  }
}

/**
 * Carte de notification individuelle.
 * Utilise `Card` de ShadCN pour une apparence cohérente.
 */
export function NotificationCard({
  notification,
  variant = 'default',
  showActions = true,
  onOpen,
  onMarkAsRead,
  onDelete,
  onReply,
  className,
}: NotificationCardProps) {
  const handleClick = () => {
    if (onOpen) onOpen(notification);
    else if (notification.link) window.location.href = notification.link;
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead?.(notification.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(notification.id);
  };

  const handleReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReply?.(notification.id);
  };

  const isUnread = !notification.read;
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: fr,
  });

  // Rendu compact (moins de détails)
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors hover:bg-muted/50',
          isUnread && 'bg-primary/5',
          className
        )}
        onClick={handleClick}
      >
        <div className="relative shrink-0">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary',
              isUnread && 'ring-2 ring-primary/30'
            )}
          >
            {getTypeIcon(notification.type)}
          </div>
          {notification.priority !== 'low' && (
            <span
              className={cn(
                'absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full',
                getPriorityColor(notification.priority)
              )}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{notification.title}</p>
            {isUnread && <span className="h-2 w-2 rounded-full bg-primary" />}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{notification.content}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">{timeAgo}</p>
        </div>
        {showActions && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!notification.read && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleMarkAsRead}>
                <Check className="h-3 w-3" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!notification.read && (
                  <DropdownMenuItem onClick={handleMarkAsRead}>
                    <Check className="mr-2 h-3 w-3" />
                    Marquer comme lu
                  </DropdownMenuItem>
                )}
                {notification.type === 'message' && onReply && (
                  <DropdownMenuItem onClick={handleReply}>
                    <Reply className="mr-2 h-3 w-3" />
                    Répondre
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-3 w-3" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    );
  }

  // Rendu minimal (encore plus simple)
  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted/50',
          className
        )}
        onClick={handleClick}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
          {getTypeIcon(notification.type)}
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium truncate">{notification.title}</p>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
        {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
      </div>
    );
  }

  // Rendu par défaut (complet)
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isUnread && 'border-l-4 border-l-primary',
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-start gap-3 p-4 pb-2">
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            {getTypeIcon(notification.type)}
          </div>
          {notification.priority !== 'low' && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full',
                getPriorityColor(notification.priority)
              )}
              title={getPriorityLabel(notification.priority)}
            />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-semibold">{notification.title}</h4>
            {isUnread && (
              <Badge className="bg-primary text-primary-foreground text-xs">Nouveau</Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {getPriorityLabel(notification.priority)}
            </Badge>
          </div>
          {notification.metadata?.senderName && (
            <p className="text-sm text-muted-foreground">{notification.metadata.senderName}</p>
          )}
        </div>
        {showActions && (
          <div className="flex items-center gap-1">
            {!notification.read && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleMarkAsRead}
                title="Marquer comme lu"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!notification.read && (
                  <DropdownMenuItem onClick={handleMarkAsRead}>
                    <Check className="mr-2 h-3 w-3" />
                    Marquer comme lu
                  </DropdownMenuItem>
                )}
                {notification.type === 'message' && onReply && (
                  <DropdownMenuItem onClick={handleReply}>
                    <Reply className="mr-2 h-3 w-3" />
                    Répondre
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-3 w-3" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground">{notification.content}</p>
        {notification.metadata?.medicationName && (
          <div className="mt-2 flex items-center gap-2 text-xs bg-primary/5 p-2 rounded-md">
            <Pill className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">{notification.metadata.medicationName}</span>
            {notification.metadata.dosage && (
              <span className="text-muted-foreground">{notification.metadata.dosage}</span>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
        {notification.link && (
          <Button variant="link" size="sm" className="h-auto p-0 text-xs">
            Voir détails
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
