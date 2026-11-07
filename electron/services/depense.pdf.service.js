import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from './prisma.client.js';
import { createBrandedPdf, drawSummaryCards, drawSectionTitle, drawSimpleTable, drawFooter, savePdfToFile } from './pdfDocument.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { app, shell } = globalThis.__ELECTRON_MAIN__ ?? {};

async function getDepensesExportDirectory() {
  const baseDir = app ? app.getPath('documents') : process.cwd();
  const exportDir = path.join(baseDir, 'Auto-Ecole COS', 'exports', 'depenses');
  await fs.mkdir(exportDir, { recursive: true });
  return exportDir;
}

async function loadDepenseForPdf(id) {
  return prisma.depense.findUnique({
    where: { id: Number(id) },
    include: {
      vehicule: {
        select: { id: true, immatriculation: true, marque: true, modele: true },
      },
    },
  });
}

function formatCurrencySimple(n) {
  return `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;
}

export async function generateDepensePDFDesktop(id) {
  if (!id || isNaN(id)) throw new Error('Identifiant dépense invalide.');

  const depense = await loadDepenseForPdf(id);
  if (!depense) throw new Error('Dépense non trouvée.');

  const exportDir = await getDepensesExportDirectory();
  const fileName = `depense-${depense.id}.pdf`;
  const filePath = path.join(exportDir, fileName);

  const title = 'Dépense';
  const subtitle = `Edition du ${new Intl.DateTimeFormat('fr-FR').format(new Date())}`;
  const documentLabel = `Dépense #${depense.id}`;

  const { doc, company } = await createBrandedPdf({ title, subtitle, documentLabel });

  // Summary cards
  let y = 52;
  drawSummaryCards(
    doc,
    [
      { label: 'Montant', value: formatCurrencySimple(depense.montant) },
      { label: 'Catégorie', value: String(depense.categorie) },
      { label: 'Date', value: new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(depense.date)) },
    ],
    y
  );

  y += 30;

  y = drawSectionTitle(doc, 'Détails', y);

  const rows = [
    ['Fournisseur', depense.fournisseur || '-'],
    ['Référence', depense.reference || '-'],
    ['Véhicule', depense.vehicule ? `${depense.vehicule.marque} ${depense.vehicule.modele} (${depense.vehicule.immatriculation})` : '-'],
    ['Description', depense.description || '-'],
  ];

  // Reuse drawSimpleTable: supply columns with widths similar to other docs
  drawSimpleTable(
    doc,
    [
      { label: 'Champ', width: 50 },
      { label: 'Valeur', width: 140 },
    ],
    rows.map(r => [r[0], r[1]]),
    y
  );

  drawFooter(doc, company);

  await savePdfToFile(doc, filePath);

  if (shell?.openPath) {
    const openError = await shell.openPath(filePath);
    if (openError) {
      console.warn(`[generateDepensePDFDesktop] Impossible d'ouvrir automatiquement ${filePath}: ${openError}`);
    }
  }

  return { success: true, path: filePath, message: `PDF genere : ${filePath}` };
}
