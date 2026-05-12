/**
 * @module common/AccountInactive
 * @description Page affichée lorsque le compte utilisateur est désactivé.
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Ban } from 'lucide-react';

export function AccountInactive() {
  return (
    <>
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-xs bg-destructive/10">
              <Ban className="size-10 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Compte inactif</CardTitle>
            <CardDescription>
              Votre compte a été désactivé. Veuillez contacter le support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Si vous pensez qu"il s"agit d"une erreur, contactez-nous à{' '}
              <a href="mailto:support@ Auto-École COS.com" className="text-primary hover:underline">
                support@ Auto-École COS.com
              </a>
              .
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/">Retour à l"accueil</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
