// src/features/home/components/HeroCarousel.tsx

/**
 * @module features/home/components/HeroCarousel
 * @description Carrousel d'images pour la page d'accueil.
 * Utilise le composant shadcn Carousel avec autoplay et navigation par dots.
 *
 * @example
 * ```tsx
 * <HeroCarousel />
 * ```
 */

import * as React from 'react';
import Autoplay, { type AutoplayType } from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

/**
 * Structure d’une diapositive du carrousel.
 */
interface Slide {
  /** URL de l’image */
  image: string;
  /** Titre (optionnel, affiché en surimpression) */
  title?: string;
  /** Description (optionnelle) */
  description?: string;
}

/**
 * Liste par défaut des diapositives (à remplacer par vos propres images).
 * Placez les images dans `/public/images/` ou ajustez les chemins.
 */
const DEFAULT_SLIDES: Slide[] = [
  {
    image: '/images/cards/card-01.png',
    title: 'Obtenez votre permis en toute confiance',
    description: 'Des moniteurs expérimentés et des véhicules modernes.',
  },
  {
    image: '/images/cards/card-02.jpg',
    title: 'Suivi personnalisé',
    description: 'Application de gestion intégrée pour candidats et moniteurs.',
  },
  {
    image: '/images/cards/card-03.jpg',
    title: 'Réussite garantie',
    description: 'Taux de réussite exceptionnel grâce à nos méthodes.',
  },
];

interface HeroCarouselProps {
  /** Liste personnalisée des diapositives */
  slides?: Slide[];
  /** Délai d’autoplay en millisecondes (défaut : 5000) */
  autoplayDelay?: number;
  /** Classes additionnelles */
  className?: string;
}

/**
 * Carrousel hero de la page d’accueil.
 * - Autoplay avec arrêt au survol
 * - Flèches de navigation et indicateurs (dots)
 * - Adaptation responsive
 */
export function HeroCarousel({
  slides = DEFAULT_SLIDES,
  autoplayDelay = 5000,
  className,
}: HeroCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [plugins, setPlugins] = React.useState<AutoplayType[]>([]);

  // Initialize autoplay plugin on first render
  React.useEffect(() => {
    let isMounted = true;
    const autoplayPlugin = Autoplay({
      delay: autoplayDelay,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      playOnInit: true,
    });
    // Defer state update to next tick to avoid synchronous setState warning
    Promise.resolve().then(() => {
      if (isMounted) {
        setPlugins([autoplayPlugin]);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [autoplayDelay]);

  // Listen to carousel selection changes
  React.useEffect(() => {
    if (!api) return;
    api.on('select', () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <div className={cn('relative w-full ', className)}>
      <Carousel
        setApi={setApi}
        plugins={plugins}
        opts={{ loop: true, align: 'center' }}
        className="w-full"
      >
        <CarouselContent>
          {slides.map((slide, idx) => (
            <CarouselItem key={idx}>
              <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-muted/30">
                <img
                  src={slide.image}
                  alt={slide.title || `Slide ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
                {/* Overlay texte (optionnel) */}
                {(slide.title || slide.description) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-4 text-center text-white">
                    {slide.title && (
                      <h2 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
                        {slide.title}
                      </h2>
                    )}
                    {slide.description && (
                      <p className="mt-2 max-w-md text-sm text-white/90 md:text-base">
                        {slide.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Dots indicateurs */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => api?.scrollTo(idx)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                current === idx ? 'w-6 bg-primary' : 'w-1.5 bg-primary/30'
              )}
              aria-label={`Aller à la diapositive ${idx + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
}
