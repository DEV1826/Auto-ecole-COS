import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from './prisma.client.js';
import { buildFacturePdf, savePdfToFile } from './pdfDocument.service.js';

const { app, shell } = globalThis.__ELECTRON_MAIN__ ?? {};

async function getFacturesExportDirectory() {
  const baseDir = app ? app.getPath('documents') : process.cwd();
  const exportDir = path.join(baseDir, 'Auto-Ecole COS', 'exports', 'factures');
  await fs.mkdir(exportDir, { recursive: true });
  return exportDir;
}

async function loadFactureForPdf(id) {
  return prisma.facture.findUnique({
    where: { id: Number(id) },
    include: {
      candidat: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          adresse: true,
        },
      },
      paiements: {
        select: {
          id: true,
          montant: true,
          date: true,
          mode: true,
          reference: true,
          note: true,
        },
        orderBy: { date: 'desc' },
      },
    },
  });
}

export async function generateFacturePDFDesktop(id) {
  if (!id || isNaN(id)) throw new Error('Identifiant facture invalide.');

  const facture = await loadFactureForPdf(id);
  if (!facture) throw new Error('Facture non trouvee.');

  const exportDir = await getFacturesExportDirectory();
  const filePath = path.join(exportDir, `${facture.numero}.pdf`);
  const { doc } = await buildFacturePdf({ facture });
  await savePdfToFile(doc, filePath);

  await prisma.facture.update({
    where: { id: Number(id) },
    data: { pdfPath: filePath },
  });

  if (shell?.openPath) {
    const openError = await shell.openPath(filePath);
    if (openError) {
      console.warn(
        `[generateFacturePDFDesktop] Impossible d'ouvrir automatiquement ${filePath}: ${openError}`
      );
    }
  }

  return { success: true, path: filePath, message: `PDF genere : ${filePath}` };
}
