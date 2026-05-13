/**
 * @module common/Maintenance/CountdownTimer
 * @description Compte à rebours élégant pour la page de maintenance.
 * Affiche les jours, heures, minutes et secondes dans des blocs numériques.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CountdownTimerProps {
  /** Timestamp cible (millisecondes) */
  targetDate: number;
  /** Fonction appelée à la fin du compte à rebours */
  onComplete?: () => void;
  /** Classes additionnelles */
  className?: string;
}

/**
 * Affiche un compte à rebours jours:heures:minutes:secondes avec un design moderne.
 */
export function CountdownTimer({ targetDate, onComplete, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(interval);
        onComplete?.();
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % 86400000) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % 3600000) / (1000 * 60));
      const seconds = Math.floor((difference % 60000) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  const timeUnits = [
    { label: 'Jours', value: timeLeft.days },
    { label: 'Heures', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Secondes', value: timeLeft.seconds },
  ];

  return (
    <div className={cn('flex flex-wrap justify-center items-center gap-2 md:gap-3', className)}>
      {timeUnits.map((unit, idx) => (
        <React.Fragment key={unit.label}>
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-primary/10 text-xl font-bold text-primary shadow-sm md:h-20 md:w-20 md:text-3xl lg:h-24 lg:w-24 lg:text-4xl">
              {String(unit.value).padStart(2, '0')}
            </div>
            <span className="mt-1 text-[10px] font-medium text-muted-foreground md:mt-2 md:text-xs">
              {unit.label}
            </span>
          </div>
          {idx < timeUnits.length - 1 && (
            <span className="text-xl font-bold text-primary/40 md:text-3xl lg:text-4xl">:</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
