/**
 * @module features/formations/pages/FormationsListPage
 * @description Toutes les formations
 */

import { Construction } from "lucide-react";

export default function FormationsListPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-4">
      <Construction className="size-16 text-muted-foreground mb-4" />
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        Liste des formations
      </h1>
      <p className="text-muted-foreground max-w-md">
        Cette page est en cours de construction.
      </p>
    </div>
  );
}
