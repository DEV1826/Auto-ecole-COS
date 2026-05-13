'use client';

/**
 * @module features/auth/components/RegisterSuccess
 * @description
 * Message de succès affiché après une inscription réussie.
 *
 * ## Fonctionnement
 * - Affiche une carte avec animation de fondu.
 * - Contient un message confirmant l'inscription.
 * - Un bouton redirige vers la page de connexion.
 *
 * ## Utilisation
 * ```tsx
 * const [isRegistered, setIsRegistered] = useState(false);
 * // après register réussi
 * setIsRegistered(true);
 * // dans le rendu
 * {isRegistered ? (
 *   <RegisterSuccess email={data.email} />
 * ) : (
 *   <RegisterForm />
 * )}
 * ```
 *
 * @see {@link PUBLIC_ROUTES.AUTH.LOGIN}
 *
 * @author Stive Junior
 * @version 1.0.0
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PUBLIC_ROUTES } from '@/config/routes';

interface RegisterSuccessProps {
  /** Email utilisé lors de l'inscription */
  email?: string;
}

export function RegisterSuccess({ email }: RegisterSuccessProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-center"
    >
      <Card className="max-w-md w-full border-none ring-0 shadow-lg">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/40"
          >
            <CheckCircle2 className="h-10 w-10 text-blue-700 dark:text-blue-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground">Compte réussie !</h2>
          {email && (
            <p className="text-sm text-muted-foreground mt-2">
              Un email de confirmation a été envoyé à <strong>{email}</strong>.
            </p>
          )}
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-6">
            Vous pouvez maintenant vous connecter pour accéder à votre espace personnel.
          </p>
          <Button
            asChild
            className="w-full gap-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md h-12 text-base font-semibold"
          >
            <Link to={PUBLIC_ROUTES.AUTH.LOGIN}>
              Se connecter
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
