/**
 * @module features/utils/pages/ApiDocsPage
 * @description Référence API
 */

import { Construction } from "lucide-react";

export default function ApiDocsPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-4">
      <Construction className="size-16 text-muted-foreground mb-4" />
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        Documentation API
      </h1>
      <p className="text-muted-foreground max-w-md">
        Cette page est en cours de construction.
      </p>
    </div>
  );
}
