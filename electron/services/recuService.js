import path from 'node:path';
import { prisma } from './prisma.client.js';
import { getExportDirectory } from './exportService.js';
import { buildReceiptPdf, savePdfToFile } from './pdfDocument.service.js';

const paiementInclude = {
  candidat: {
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      telephone: true,
      categorie: true,
    },
  },
  facture: {
    select: {
      id: true,
      numero: true,
      montantTotal: true,
      statut: true,
    },
  },
};

function buildReceiptNumber(paiement) {
  return `REC-${new Date(paiement.date).getFullYear()}-${String(paiement.id).padStart(5, '0')}`;
}

function mapRecu(paiement) {
  return {
    id: paiement.id,
    numero: buildReceiptNumber(paiement),
    paiementId: paiement.id,
    date: paiement.date,
    montant: Number(paiement.montant || 0),
    mode: paiement.mode,
    reference: paiement.reference || '',
    note: paiement.note || '',
    candidat: paiement.candidat
      ? {
          id: paiement.candidat.id,
          nom: paiement.candidat.nom,
          prenom: paiement.candidat.prenom,
          email: paiement.candidat.email,
          telephone: paiement.candidat.telephone,
          categorie: paiement.candidat.categorie,
        }
      : null,
    facture: paiement.facture
      ? {
          id: paiement.facture.id,
          numero: paiement.facture.numero,
          montantTotal: Number(paiement.facture.montantTotal || 0),
          statut: paiement.facture.statut,
        }
      : null,
  };
}

export async function getAll() {
  const paiements = await prisma.paiement.findMany({
    include: paiementInclude,
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
  });

  return paiements.map(mapRecu);
}

export async function getById(id) {
  const paiement = await prisma.paiement.findUnique({
    where: { id: Number(id) },
    include: paiementInclude,
  });

  if (!paiement) {
    throw new Error('Recu introuvable.');
  }

  return mapRecu(paiement);
}

export async function exportReceipt(paiementId) {
  const recu = await getById(paiementId);
  const exportDir = await getExportDirectory();
  const filePath = path.join(exportDir, `${recu.numero}.pdf`);
  const { doc } = await buildReceiptPdf({ paiement: recu, receiptNumber: recu.numero });
  await savePdfToFile(doc, filePath);

  return {
    ...recu,
    filePath,
    format: 'pdf',
    status: 'ready',
  };
}
