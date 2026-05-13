// src/components/common/QRCode.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import QRCodeLib from 'qrcode';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

export interface QRCodeProps {
  value: string;
  size?: number;
  logoUrl?: string;
  logoSize?: number;
  darkColor?: string;
  lightColor?: string;
  errorCorrection?: 'L' | 'M' | 'Q' | 'H';
  /** Ajoute une bordure et un ombrage (défaut: true) */
  styled?: boolean;
  /** Padding intérieur en pixels (défaut: 16) */
  padding?: number;
  className?: string;
}

export function QRCode({
  value,
  size = 280,
  logoUrl = '/icons/icon.svg',
  logoSize = 60,
  darkColor = '#000000',
  lightColor = '#ffffff',
  errorCorrection = 'H',
  styled = true,
  padding = 5,
  className,
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const generate = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!canvasRef.current) return;

        // Générer la matrice QR
        const qrCodeData = await QRCodeLib.create(value, {
          errorCorrectionLevel: errorCorrection,
        });
        const modules = qrCodeData.modules;
        const moduleCount = modules.size;

        // Dimensions internes du QR (sans le padding)
        const qrInnerSize = size;
        const moduleSize = qrInnerSize / moduleCount;

        // Dimensions finales du canvas (avec padding)
        const canvasWidth = styled ? qrInnerSize + padding * 2 : qrInnerSize;
        const canvasHeight = styled ? qrInnerSize + padding * 2 : qrInnerSize;

        const canvas = canvasRef.current;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not available');

        // Fond blanc (couvre toute la zone)
        ctx.fillStyle = lightColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Décalage pour le dessin des modules
        const offset = styled ? padding : 0;

        // Dessiner les modules (points ronds)
        const dotScale = 0.85;
        const radiusFactor = (moduleSize * dotScale) / 2;

        for (let row = 0; row < moduleCount; row++) {
          for (let col = 0; col < moduleCount; col++) {
            if (modules.get(row, col)) {
              const x = offset + col * moduleSize;
              const y = offset + row * moduleSize;
              const centerX = x + moduleSize / 2;
              const centerY = y + moduleSize / 2;
              ctx.beginPath();
              ctx.arc(centerX, centerY, radiusFactor, 0, 2 * Math.PI);
              ctx.fillStyle = darkColor;
              ctx.fill();
            }
          }
        }

        // Ajouter le logo centré (dans la zone interne du QR)
        if (logoUrl) {
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
              if (!mounted) {
                resolve();
                return;
              }
              // Position du logo dans le canvas (centrée sur la zone interne)
              const logoX = offset + (qrInnerSize - logoSize) / 2;
              const logoY = offset + (qrInnerSize - logoSize) / 2;

              // Fond blanc derrière le logo
              ctx.fillStyle = lightColor;
              ctx.fillRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4);

              // Dessiner le logo
              ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
              resolve();
            };
            img.onerror = () => {
              console.warn('Logo introuvable, QR généré sans logo');
              resolve();
            };
            img.src = logoUrl;
          });
        }

        if (mounted) setIsLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Erreur de génération');
          setIsLoading(false);
        }
      }
    };

    generate();

    return () => {
      mounted = false;
    };
  }, [value, size, logoUrl, logoSize, darkColor, lightColor, errorCorrection, styled, padding]);

  if (error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-md bg-muted p-1 text-center text-xs text-destructive',
          className
        )}
      >
        {error}
      </div>
    );
  }

  const containerWidth = styled ? size + padding * 2 : size;
  const containerHeight = styled ? size + padding * 2 : size;

  return (
    <div
      className={cn('relative inline-block', styled && 'rounded-2xl bg-white shadow-sm', className)}
      style={styled ? { padding: `${padding}px` } : undefined}
    >
      <canvas ref={canvasRef} style={{ display: isLoading ? 'none' : 'block' }} />
      {isLoading && (
        <div
          className="flex items-center justify-center"
          style={{ width: containerWidth, height: containerHeight }}
        >
          <Spinner className="size-6 text-primary" />
        </div>
      )}
    </div>
  );
}
