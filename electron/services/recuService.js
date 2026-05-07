import path from 'node:path'
import { jsPDF } from 'jspdf'
import { prisma } from './prismaClient.js'
import { getExportDirectory } from './exportService.js'

const paiementInclude = {
  candidat: {
    select: {
      id: true,
      nom: true,
      prenom: true,
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
}

function formatCurrency(value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function buildReceiptNumber(paiement) {
  return `REC-${new Date(paiement.date).getFullYear()}-${String(paiement.id).padStart(5, '0')}`
}

function createReceiptPdf(title, subtitle) {
  const doc = new jsPDF()
  doc.setFillColor(72, 45, 27)
  doc.rect(0, 0, 210, 34, 'F')
  doc.setTextColor(255, 248, 240)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(title, 14, 16)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(subtitle, 14, 24)
  doc.setTextColor(47, 36, 25)
  return doc
}

function drawInfoBlock(doc, label, value, x, y, width) {
  doc.setFillColor(255, 250, 243)
  doc.setDrawColor(218, 201, 182)
  doc.roundedRect(x, y, width, 18, 4, 4, 'FD')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(115, 97, 77)
  doc.text(label, x + 4, y + 6.5)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(47, 36, 25)
  doc.text(String(value), x + 4, y + 13)
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
  }
}

export async function getAll() {
  const paiements = await prisma.paiement.findMany({
    include: paiementInclude,
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
  })

  return paiements.map(mapRecu)
}

export async function getById(id) {
  const paiement = await prisma.paiement.findUnique({
    where: { id: Number(id) },
    include: paiementInclude,
  })

  if (!paiement) {
    throw new Error('Recu introuvable.')
  }

  return mapRecu(paiement)
}

export async function exportReceipt(paiementId) {
  const recu = await getById(paiementId)
  const exportDir = await getExportDirectory()
  const filePath = path.join(exportDir, `${recu.numero}.pdf`)

  const doc = createReceiptPdf(
    'Recu de paiement',
    `Document genere le ${formatDate(new Date())}`,
  )

  drawInfoBlock(doc, 'Numero', recu.numero, 14, 42, 56)
  drawInfoBlock(doc, 'Date', formatDate(recu.date), 74, 42, 42)
  drawInfoBlock(doc, 'Montant', formatCurrency(recu.montant), 120, 42, 76)

  let y = 74
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Informations du paiement', 14, y)
  doc.setDrawColor(200, 100, 45)
  doc.line(14, y + 2, 196, y + 2)
  y += 12

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Candidat : ${`${recu.candidat?.prenom || ''} ${recu.candidat?.nom || ''}`.trim()}`, 14, y)
  y += 8
  doc.text(`Mode de paiement : ${recu.mode}`, 14, y)
  y += 8
  doc.text(`Reference : ${recu.reference || '-'}`, 14, y)
  y += 8
  doc.text(`Facture liee : ${recu.facture?.numero || '-'}`, 14, y)
  y += 8
  doc.text(`Statut facture : ${recu.facture?.statut || '-'}`, 14, y)

  if (recu.note) {
    y += 14
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Observation', 14, y)
    y += 8
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const noteLines = doc.splitTextToSize(recu.note, 178)
    doc.text(noteLines, 14, y)
    y += noteLines.length * 6
  }

  y += 12
  doc.setDrawColor(218, 201, 182)
  doc.line(14, y, 196, y)
  y += 10
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Cachet et signature', 14, y)
  doc.line(14, y + 16, 70, y + 16)
  doc.text('Signature du client', 126, y)
  doc.line(126, y + 16, 182, y + 16)

  const buffer = Buffer.from(doc.output('arraybuffer'))
  const fs = await import('node:fs/promises')
  await fs.writeFile(filePath, buffer)

  return {
    ...recu,
    filePath,
    format: 'pdf',
    status: 'ready',
  }
}
