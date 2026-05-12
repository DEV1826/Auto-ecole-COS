/**
 * @module features/candidats/pages/CandidatDetailPage
 * @description Fiche complète d'un candidat
 */

import { Construction } from "lucide-react";

export default function CandidatDetailPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-4">
      <Construction className="size-16 text-muted-foreground mb-4" />
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        Détail candidat
      </h1>
      <p className="text-muted-foreground max-w-md">
        Cette page est en cours de construction.
      </p>
    </div>
  );
}
