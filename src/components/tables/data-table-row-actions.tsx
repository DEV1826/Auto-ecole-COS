// src/components/tables/data-table-row-actions.tsx

/**
 * @module tables/data-table-row-actions
 * @description Menu d'actions contextuelles pour chaque ligne (supporte sous‑menus)
 */

import { MoreHorizontal, Edit, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import type { DataTableRowActionsProps, CustomRowAction } from './types';

function renderAction<TData>(action: CustomRowAction<TData>, row: TData): React.ReactNode {
  if (action.submenu && action.submenu.length > 0) {
    return (
      <DropdownMenuSub key={action.label}>
        <DropdownMenuSubTrigger className={action.className}>
          {action.icon && <span className="mr-2">{action.icon}</span>}
          {action.label}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {action.submenu.map((sub, idx) => (
            <DropdownMenuItem
              key={idx}
              className={sub.className}
              onClick={(e) => {
                e.stopPropagation();
                sub.onClick?.(row);
              }}
            >
              {sub.icon && <span className="mr-2">{sub.icon}</span>}
              {sub.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  // Sinon, un élément simple
  return (
    <DropdownMenuItem
      key={action.label}
      className={action.className}
      onClick={(e) => {
        e.stopPropagation();
        action.onClick?.(row);
      }}
    >
      {action.icon && <span className="mr-2">{action.icon}</span>}
      {action.label}
    </DropdownMenuItem>
  );
}

export function DataTableRowActions<TData>({ row, actions }: DataTableRowActionsProps<TData>) {
  const { onEdit, onDelete, onDuplicate, customActions = [] } = actions || {};
  const allActions: CustomRowAction<TData>[] = [];

  if (onEdit) {
    allActions.push({
      label: 'Modifier',
      icon: <Edit className="mr-2 h-4 w-4" />,
      onClick: (r) => onEdit(r),
    });
  }
  if (onDuplicate) {
    allActions.push({
      label: 'Dupliquer',
      icon: <Copy className="mr-2 h-4 w-4" />,
      onClick: (r) => onDuplicate(r),
    });
  }
  allActions.push(...customActions);

  const deleteAction: CustomRowAction<TData> | undefined = onDelete
    ? {
        label: 'Supprimer',
        icon: <Trash2 className="mr-2 h-4 w-4" />,
        className: 'text-destructive focus:text-destructive',
        onClick: (r) => onDelete(r),
      }
    : undefined;

  // Regrouper les actions : les customActions peuvent contenir des sous‑menus
  const mainActions = allActions.filter((a) => !a.submenu);
  const submenuActions = allActions.filter((a) => a.submenu && a.submenu.length > 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 ">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {mainActions.map((action) => renderAction(action, row))}
        {submenuActions.map((action) => renderAction(action, row))}
        {deleteAction && (
          <>
            <DropdownMenuSeparator />
            {renderAction(deleteAction, row)}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
