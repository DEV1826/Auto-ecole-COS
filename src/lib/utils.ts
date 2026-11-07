import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

type CsvCell = string | number | boolean | null | undefined | Date;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function resolveAssetPath(assetPath?: string | null) {
  if (!assetPath) return '';
  if (
    assetPath.startsWith('http://') ||
    assetPath.startsWith('https://') ||
    assetPath.startsWith('data:') ||
    assetPath.startsWith('blob:')
  ) {
    return assetPath;
  }

  if (assetPath.startsWith('/')) {
    return `${import.meta.env.BASE_URL}${assetPath.slice(1)}`;
  }

  return assetPath;
}

export async function openDesktopPath(targetPath?: string | null) {
  if (!targetPath) return false;

  if (window.api?.documents?.open) {
    await window.api.documents.open(targetPath);
    return true;
  }

  window.open(targetPath, '_blank', 'noopener,noreferrer');
  return true;
}

export async function printDesktopPdf(targetPath?: string | null, title?: string) {
  if (!targetPath) return false;

  if (window.api?.documents?.print) {
    return window.api.documents.print(targetPath, title);
  }

  await openDesktopPath(targetPath);
  return { success: true, path: targetPath };
}

export const getAvatarUrl = (name: string) => {
  const displayName = name || 'Visiteur';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=1a74a4&radius=50`;
};

/**
 * Formate un nombre en notation courte (K, M) pour l’affichage.
 * @param num - Nombre à formater
 * @returns Chaîne formatée
 * @internal
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

/**
 * Formate un montant en FCFA avec notation compacte.
 * @internal
 */
export function formatCurrency(num: number): string {
  return `${formatCompactNumber(num)} FCFA`;
}

function escapeCsvValue(value: CsvCell): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();

  const stringValue = String(value);
  if (/[",;\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export function buildCsvContent(headers: string[], rows: CsvCell[][]): string {
  const csvRows = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(';'));
  return `${csvRows.join('\n')}\n`;
}

export async function saveDesktopCsv(
  folder: string,
  baseName: string,
  headers: string[],
  rows: CsvCell[][]
) {
  if (!window.api?.exports?.saveFile) {
    throw new Error("L'export desktop n'est pas disponible.");
  }

  return window.api.exports.saveFile({
    folder,
    baseName,
    extension: 'csv',
    content: buildCsvContent(headers, rows),
  });
}
