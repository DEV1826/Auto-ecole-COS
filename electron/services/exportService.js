import fs from 'node:fs/promises';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import { prisma } from './prisma.client.js';

function formatCurrency(value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

async function ensureExportDir() {
  const exportDir = path.join(process.cwd(), 'exports');
  await fs.mkdir(exportDir, { recursive: true });
  return exportDir;
}

export async function getExportDirectory() {
  return ensureExportDir();
}

async function writePdf(doc, filePath) {
  const buffer = Buffer.from(doc.output('arraybuffer'));
  await fs.writeFile(filePath, buffer);
}

function createPdfDocument(title, subtitle) {
  const doc = new jsPDF();

  doc.setFillColor(72, 45, 27);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(255, 248, 240);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(title, 14, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(subtitle, 14, 24);
  doc.setTextColor(47, 36, 25);

  return doc;
}

function drawSectionTitle(doc, title, y) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title, 14, y);
  doc.setDrawColor(200, 100, 45);
  doc.line(14, y + 2, 196, y + 2);
}

function drawMetricCard(doc, x, y, width, title, value) {
  doc.setFillColor(255, 250, 243);
  doc.setDrawColor(218, 201, 182);
  doc.roundedRect(x, y, width, 24, 4, 4, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(115, 97, 77);
  doc.text(title, x + 4, y + 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(47, 36, 25);
  doc.text(value, x + 4, y + 17);
}

function drawSimpleTable(doc, columns, rows, startY) {
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = startY;

  const drawHeader = () => {
    doc.setFillColor(244, 239, 231);
    doc.rect(14, y, 182, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    columns.forEach((column) => {
      doc.text(column.label, column.x, y + 5.5);
    });
    y += 10;
  };

  drawHeader();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  rows.forEach((row) => {
    if (y > pageHeight - 18) {
      doc.addPage();
      y = 18;
      drawHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
    }

    columns.forEach((column) => {
      const value = String(row[column.key] ?? '-');
      const lines = doc.splitTextToSize(value, column.width);
      doc.text(lines, column.x, y);
    });

    doc.setDrawColor(235, 227, 215);
    doc.line(14, y + 3, 196, y + 3);
    y += 8;
  });

  return y;
}

export async function exportDashboardSnapshot(payload = {}) {
  const exportDir = await ensureExportDir();
  const filePath = path.join(
    exportDir,
    `bilan-autoecole-${new Date().toISOString().slice(0, 10)}.pdf`
  );

  const [candidatsActifs, paiements, depenses, caisse, examensPlanifies] = await Promise.all([
    prisma.candidat.count({ where: { statut: { in: ['EN_COURS', 'EN_ATTENTE'] } } }),
    prisma.paiement.findMany({ orderBy: [{ date: 'desc' }, { id: 'desc' }], take: 12 }),
    prisma.depense.findMany({ orderBy: [{ date: 'desc' }, { id: 'desc' }], take: 12 }),
    prisma.caisse.findFirst({ orderBy: [{ date: 'desc' }, { id: 'desc' }] }),
    prisma.examen.count({ where: { date: { gte: new Date() } } }),
  ]);

  const totalPaiements = paiements.reduce((sum, item) => sum + Number(item.montant || 0), 0);
  const totalDepenses = depenses.reduce((sum, item) => sum + Number(item.montant || 0), 0);

  const doc = createPdfDocument('Bilan Auto-Ecole', `Document genere le ${formatDate(new Date())}`);

  drawMetricCard(doc, 14, 42, 42, 'Candidats actifs', String(candidatsActifs));
  drawMetricCard(doc, 60, 42, 42, 'Paiements', formatCurrency(totalPaiements));
  drawMetricCard(doc, 106, 42, 42, 'Depenses', formatCurrency(totalDepenses));
  drawMetricCard(doc, 152, 42, 44, 'Solde caisse', formatCurrency(caisse?.solde || 0));

  let y = 78;
  drawSectionTitle(doc, 'Synthese generale', y);
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Examens planifies : ${examensPlanifies}`, 14, y);
  y += 6;
  doc.text(`Nombre de paiements recents analyses : ${paiements.length}`, 14, y);
  y += 6;
  doc.text(`Nombre de depenses recentes analysees : ${depenses.length}`, 14, y);

  y += 12;
  drawSectionTitle(doc, 'Derniers paiements', y);
  y += 10;
  y = drawSimpleTable(
    doc,
    [
      { label: 'Date', key: 'date', x: 16, width: 24 },
      { label: 'Montant', key: 'montant', x: 48, width: 36 },
      { label: 'Mode', key: 'mode', x: 90, width: 28 },
      { label: 'Reference', key: 'reference', x: 122, width: 30 },
      { label: 'Candidat', key: 'candidat', x: 156, width: 38 },
    ],
    paiements.slice(0, 8).map((item) => ({
      date: formatDate(item.date),
      montant: formatCurrency(item.montant),
      mode: item.mode,
      reference: item.reference || '-',
      candidat: `#${item.candidatId}`,
    })),
    y
  );

  y += 8;
  drawSectionTitle(doc, 'Dernieres depenses', y);
  y += 10;
  drawSimpleTable(
    doc,
    [
      { label: 'Date', key: 'date', x: 16, width: 24 },
      { label: 'Montant', key: 'montant', x: 48, width: 36 },
      { label: 'Categorie', key: 'categorie', x: 90, width: 42 },
      { label: 'Reference', key: 'reference', x: 136, width: 28 },
      { label: 'Description', key: 'description', x: 166, width: 28 },
    ],
    depenses.slice(0, 8).map((item) => ({
      date: formatDate(item.date),
      montant: formatCurrency(item.montant),
      categorie: item.categorie,
      reference: item.reference || '-',
      description: item.description || '-',
    })),
    y
  );

  await writePdf(doc, filePath);

  return {
    exportedAt: new Date().toISOString(),
    filePath,
    format: payload.format || 'pdf',
    status: 'ready',
  };
}

export async function exportFactures(payload = {}) {
  const exportDir = await ensureExportDir();
  const factures = await prisma.facture.findMany({
    include: {
      candidat: {
        select: { nom: true, prenom: true },
      },
      paiements: {
        select: { montant: true },
      },
    },
    orderBy: [{ dateEmission: 'desc' }, { id: 'desc' }],
  });

  const format = payload.format || 'xlsx';

  if (format === 'pdf') {
    const filePath = path.join(exportDir, `factures-${new Date().toISOString().slice(0, 10)}.pdf`);
    const total = factures.reduce((sum, facture) => sum + Number(facture.montantTotal || 0), 0);
    const doc = createPdfDocument('Registre des factures', `Edition du ${formatDate(new Date())}`);

    drawMetricCard(doc, 14, 42, 56, 'Nombre de factures', String(factures.length));
    drawMetricCard(doc, 74, 42, 58, 'Montant total', formatCurrency(total));
    drawMetricCard(
      doc,
      136,
      42,
      60,
      'Factures payees',
      String(factures.filter((item) => item.statut === 'PAYEE').length)
    );

    let y = 78;
    drawSectionTitle(doc, 'Liste des factures', y);
    y += 10;
    drawSimpleTable(
      doc,
      [
        { label: 'Numero', key: 'numero', x: 16, width: 28 },
        { label: 'Client', key: 'client', x: 48, width: 52 },
        { label: 'Date', key: 'dateEmission', x: 104, width: 22 },
        { label: 'Montant', key: 'montant', x: 130, width: 30 },
        { label: 'Statut', key: 'statut', x: 164, width: 28 },
      ],
      factures.map((facture) => ({
        numero: facture.numero,
        client: facture.candidat
          ? `${facture.candidat.prenom} ${facture.candidat.nom}`
          : 'Sans candidat',
        dateEmission: formatDate(facture.dateEmission),
        montant: formatCurrency(facture.montantTotal),
        statut: facture.statut,
      })),
      y
    );

    await writePdf(doc, filePath);

    return {
      exportedAt: new Date().toISOString(),
      count: factures.length,
      filePath,
      format,
      status: 'ready',
    };
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Factures');

  sheet.columns = [
    { header: 'Numero', key: 'numero', width: 18 },
    { header: 'Client', key: 'client', width: 28 },
    { header: 'Date emission', key: 'dateEmission', width: 16 },
    { header: 'Montant', key: 'montant', width: 16 },
    { header: 'Statut', key: 'statut', width: 24 },
    { header: 'Paiements lies', key: 'paiementsCount', width: 18 },
  ];

  factures.forEach((facture) => {
    sheet.addRow({
      numero: facture.numero,
      client: facture.candidat
        ? `${facture.candidat.prenom} ${facture.candidat.nom}`
        : 'Sans candidat',
      dateEmission: formatDate(facture.dateEmission),
      montant: Number(facture.montantTotal || 0),
      statut: facture.statut,
      paiementsCount: facture.paiements.length,
    });
  });

  sheet.getRow(1).font = { bold: true };
  sheet.getColumn('montant').numFmt = '#,##0 "FCFA"';

  const filePath = path.join(exportDir, `factures-${new Date().toISOString().slice(0, 10)}.xlsx`);

  await workbook.xlsx.writeFile(filePath);

  return {
    exportedAt: new Date().toISOString(),
    count: factures.length,
    filePath,
    format,
    status: 'ready',
  };
}
