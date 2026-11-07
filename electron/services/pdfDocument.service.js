import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { jsPDF } from 'jspdf';
import { getCompanyConfig } from './admin.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAGE = {
  width: 210,
  height: 297,
  marginX: 3,
  marginY: 10,
};

const BRAND = {
  primary: [28, 92, 160],
  primarySoft: [232, 241, 250],
  secondary: [239, 68, 68],
  text: [24, 24, 27],
  muted: [100, 116, 139],
  border: [203, 213, 225],
  surface: [248, 250, 252],
};

function getAppRootDir() {
  return path.resolve(__dirname, '..', '..');
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/[\u00A0\u202F]/g, ' ');

  return `${formatted} FCFA`;
}

function safeText(value, fallback = '-') {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveLogoPath(config) {
  const rootDir = getAppRootDir();
  const customPath = config.logoPath?.trim();
  const candidates = [];

  if (customPath) {
    candidates.push(customPath);
    candidates.push(path.resolve(rootDir, customPath));
  }

  candidates.push(
    path.join(rootDir, 'dist', 'icons', 'hero.png'),
    path.join(rootDir, 'public', 'icons', 'hero.png'),
    path.join(rootDir, 'dist', 'images', 'cap.png'),
    path.join(rootDir, 'public', 'images', 'cap.png')
  );

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function loadLogoDataUrl(config) {
  const logoPath = await resolveLogoPath(config);
  if (!logoPath) return null;

  const extension = path.extname(logoPath).toLowerCase();
  if (extension !== '.png' && extension !== '.jpg' && extension !== '.jpeg') {
    return null;
  }

  const mimeType = extension === '.png' ? 'image/png' : 'image/jpeg';
  const buffer = await fs.readFile(logoPath);
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

function drawWatermarkLogo(doc, logoDataUrl, { x, y, width, height, opacity = 0.025 }) {
  if (!logoDataUrl) return;

  try {
    if (typeof doc.GState === 'function') {
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity }));
      doc.addImage(logoDataUrl, 'PNG', x, y, width, height, undefined, 'FAST');
      doc.restoreGraphicsState();
      return;
    }

    doc.addImage(logoDataUrl, 'PNG', x, y, width, height, undefined, 'FAST');
  } catch {
    // Ignore watermark issues to keep PDF generation resilient.
  }
}

function buildCompanyMeta(company) {
  return [company.adresse, company.telephone, company.email, company.siteWeb]
    .filter(Boolean)
    .join(' | ');
}

function buildCompanyFooter(company) {
  return [company.nom, company.telephone, company.email, company.numeroFiscal ? `NIF: ${company.numeroFiscal}` : '']
    .filter(Boolean)
    .join(' | ');
}

export async function getPdfCompanyIdentity() {
  const config = await getCompanyConfig();
  const logoDataUrl = await loadLogoDataUrl(config);

  return {
    nom: safeText(config.nom, 'Auto-Ecole COS'),
    adresse: safeText(config.adresse, ''),
    telephone: safeText(config.telephone, ''),
    email: safeText(config.email, ''),
    siteWeb: safeText(config.siteWeb, ''),
    numeroFiscal: safeText(config.numeroFiscal, ''),
    logoDataUrl,
  };
}

export async function createBrandedPdf({ title, subtitle, documentLabel }) {
  const company = await getPdfCompanyIdentity();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, PAGE.width, 42, 'F');
  doc.setFillColor(...BRAND.secondary);
  doc.rect(0, 42, PAGE.width, 3, 'F');

  if (company.logoDataUrl) {
    try {
      doc.addImage(company.logoDataUrl, 'PNG', 14, 8, 24, 24, undefined, 'FAST');
    } catch {
      // Ignore logo decoding issues and keep the document usable.
    }
  }

  const headerLeft = company.logoDataUrl ? 43 : 14;
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(company.nom, headerLeft, 17);

  const companyMeta = [company.adresse, company.telephone, company.email, company.siteWeb]
    .filter(Boolean)
    .join(' | ');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (companyMeta) {
    const metaLines = doc.splitTextToSize(companyMeta, 100);
    doc.text(metaLines, headerLeft, 24);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  const rightTitleWidth = doc.getTextWidth(title);
  doc.text(title, PAGE.width - PAGE.marginX - rightTitleWidth, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(documentLabel, PAGE.width - PAGE.marginX, 24, { align: 'right' });
  if (subtitle) {
    doc.text(subtitle, PAGE.width - PAGE.marginX, 30, { align: 'right' });
  }

  doc.setTextColor(...BRAND.text);
  return { doc, company };
}

export function drawSectionTitle(doc, label, y) {
  doc.setFillColor(...BRAND.primarySoft);
  doc.roundedRect(PAGE.marginX, y - 6, PAGE.width - PAGE.marginX * 2, 10, 2, 2, 'F');
  doc.setTextColor(...BRAND.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(label, PAGE.marginX + 4, y);
  doc.setTextColor(...BRAND.text);
  return y + 8;
}

export function drawSummaryCards(doc, cards, startY, options = {}) {
  const gap = options.gap ?? 4;
  const cardHeight = options.cardHeight ?? 21;
  const drawBorder = options.drawBorder ?? true;
  const cardWidth = (PAGE.width - PAGE.marginX * 2 - gap * (cards.length - 1)) / cards.length;
  let x = PAGE.marginX;

  for (const card of cards) {
    doc.setFillColor(...BRAND.surface);
    if (drawBorder) {
      doc.setDrawColor(...BRAND.border);
      doc.roundedRect(x, startY, cardWidth, cardHeight, 3, 3, 'FD');
    } else {
      doc.roundedRect(x, startY, cardWidth, cardHeight, 3, 3, 'F');
    }
    doc.setTextColor(...BRAND.muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(card.label, x + 4, startY + 7);
    doc.setTextColor(...BRAND.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const valueLines = doc.splitTextToSize(safeText(card.value), cardWidth - 8);
    doc.text(valueLines, x + 4, startY + 14.5);
    x += cardWidth + gap;
  }

  return startY + cardHeight + 6;
}

export function drawLabelValueGrid(doc, items, startY, options = {}) {
  const columnCount = options.columns ?? 2;
  const rowHeight = options.rowHeight ?? 11;
  const gap = options.gap ?? 4;
  const drawBorder = options.drawBorder ?? true;
  const labelOffsetY = options.labelOffsetY ?? 4.5;
  const valueOffsetY = options.valueOffsetY ?? 8;
  const width = PAGE.width - PAGE.marginX * 2;
  const columnWidth = (width - gap * (columnCount - 1)) / columnCount;
  let y = startY;

  for (let index = 0; index < items.length; index += columnCount) {
    const row = items.slice(index, index + columnCount);
    row.forEach((item, col) => {
      const x = PAGE.marginX + col * (columnWidth + gap);
      doc.setFillColor(...BRAND.surface);
      if (drawBorder) {
        doc.setDrawColor(...BRAND.border);
        doc.roundedRect(x, y, columnWidth, rowHeight, 2, 2, 'FD');
      } else {
        doc.roundedRect(x, y, columnWidth, rowHeight, 2, 2, 'F');
      }
      doc.setTextColor(...BRAND.muted);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(item.label, x + 3, y + labelOffsetY);
      doc.setTextColor(...BRAND.text);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      const valueLines = doc.splitTextToSize(safeText(item.value), columnWidth - 6);
      doc.text(valueLines, x + 3, y + valueOffsetY);
    });
    y += rowHeight + gap;
  }

  return y;
}

export function drawParagraphBlock(doc, title, text, startY) {
  let y = drawSectionTitle(doc, title, startY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.text);
  const lines = doc.splitTextToSize(safeText(text), PAGE.width - PAGE.marginX * 2 - 4);
  doc.text(lines, PAGE.marginX + 2, y);
  return y + lines.length * 5 + 4;
}

export function drawSimpleTable(doc, columns, rows, startY) {
  const widths = columns.map((column) => column.width);
  let y = startY;
  const pageBottom = PAGE.height - PAGE.marginY - 18;

  const drawHeader = () => {
    let x = PAGE.marginX;
    doc.setFillColor(...BRAND.primarySoft);
    doc.setDrawColor(...BRAND.border);
    columns.forEach((column, index) => {
      doc.rect(x, y, widths[index], 8, 'FD');
      doc.setTextColor(...BRAND.primary);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(column.label, x + 2, y + 5.2);
      x += widths[index];
    });
    y += 8;
  };

  drawHeader();

  for (const row of rows) {
    const cellLines = columns.map((column, index) =>
      doc.splitTextToSize(safeText(row[index]), widths[index] - 4)
    );
    const rowHeight = Math.max(...cellLines.map((lines) => Math.max(1, lines.length))) * 4.5 + 4;

    if (y + rowHeight > pageBottom) {
      doc.addPage();
      y = PAGE.marginY;
      drawHeader();
    }

    let x = PAGE.marginX;
    columns.forEach((column, index) => {
      doc.setDrawColor(...BRAND.border);
      doc.rect(x, y, widths[index], rowHeight);
      doc.setTextColor(...BRAND.text);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(cellLines[index], x + 2, y + 5);
      x += widths[index];
    });

    y += rowHeight;
  }

  return y;
}

export function drawFooter(doc, company) {
  const footerY = PAGE.height - 12;
  doc.setDrawColor(...BRAND.border);
  doc.line(PAGE.marginX, footerY - 5, PAGE.width - PAGE.marginX, footerY - 5);
  doc.setTextColor(...BRAND.muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const footerText = [
    company.nom,
    company.numeroFiscal ? `NIF: ${company.numeroFiscal}` : '',
    company.telephone,
    company.email,
  ]
    .filter(Boolean)
    .join(' | ');

  doc.text(footerText || 'Document genere par Auto-Ecole COS', PAGE.marginX, footerY);
}

export async function savePdfToFile(doc, filePath) {
  const buffer = Buffer.from(doc.output('arraybuffer'));
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
}

export function buildReceiptDocumentData(paiement, receiptNumber) {
  const candidatNom = paiement.candidat
    ? `${paiement.candidat.prenom || ''} ${paiement.candidat.nom || ''}`.trim()
    : `Candidat #${paiement.candidatId || paiement.id}`;
  const montantVerse = Number(paiement.montant || 0);

  return {
    subtitle: `Edition du ${formatDate(new Date())}`,
    documentLabel: `Recu ${receiptNumber}`,
    summaryCards: [
      { label: 'Numero de recu', value: receiptNumber },
      { label: 'Date de paiement', value: formatDate(paiement.date) },
      { label: 'Montant verse', value: formatCurrency(montantVerse) },
    ],
    candidateItems: [
      { label: 'Candidat', value: candidatNom },
      { label: 'Categorie', value: paiement.candidat?.categorie || '-' },
      { label: 'Telephone', value: paiement.candidat?.telephone || '-' },
      { label: 'Email', value: paiement.candidat?.email || '-' },
    ],
    paymentItems: [
      { label: 'Mode de paiement', value: paiement.mode },
      { label: 'Reference', value: paiement.reference || '-' },
      ...(paiement.facture ? [{ label: 'Facture liee', value: paiement.facture.numero }] : []),
    ],
    note: paiement.note || '',
  };
}

export async function buildReceiptPdf({ paiement, receiptNumber, title = 'Recu de paiement' }) {
  const data = buildReceiptDocumentData(paiement, receiptNumber);
  const company = await getPdfCompanyIdentity();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const copies = [
    { top: 5, bottom: 141, label: 'Exemplaire client' },
    { top: 151, bottom: 287, label: 'Exemplaire comptabilite' },
  ];

  const drawReceiptCopy = ({ top, bottom, label }) => {
    const left = PAGE.marginX;
    const width = PAGE.width - PAGE.marginX * 2;
    const compactSectionTitle = (sectionLabel, startY) => {
      doc.setFillColor(...BRAND.primarySoft);
      doc.roundedRect(left, startY - 4.5, width, 7.5, 2, 2, 'F');
      doc.setTextColor(...BRAND.primary);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(sectionLabel, left + 4, startY);
      doc.setTextColor(...BRAND.text);
      return startY + 6;
    };
    doc.setFillColor(...BRAND.primary);
    doc.roundedRect(left, top, width, 18, 4, 4, 'F');
    doc.setFillColor(...BRAND.secondary);
    doc.rect(left, top + 18, width, 2, 'F');

      drawWatermarkLogo(doc, company.logoDataUrl, {
        x: left + (width - 96) / 2,
        y: top + 38,
        width: 96,
        height: 96,
        opacity: 0.022,
      });

    if (company.logoDataUrl) {
      try {
        doc.addImage(company.logoDataUrl, 'PNG', left + 4, top + 3.5, 10, 10, undefined, 'FAST');
      } catch {
        // Keep document generation resilient.
      }
    }

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.text(company.nom, left + 17, top + 8);
      const headerMeta = buildCompanyMeta(company);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.6);
      if (headerMeta) {
        doc.text(doc.splitTextToSize(headerMeta, width - 86), left + 17, top + 13);
      }
      doc.text(label, left + width - 4, top + 6, { align: 'right' });
      doc.text(title, left + width - 4, top + 11, { align: 'right' });
      doc.text(data.documentLabel, left + width - 4, top + 16, { align: 'right' });

        let y = top + 25;
    doc.setTextColor(...BRAND.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Informations du recu', left + 2, y);
    y += 3;
    doc.setDrawColor(...BRAND.border);
    doc.line(left + 2, y, left + width - 2, y);
    y += 4;

        y = drawSummaryCards(doc, data.summaryCards, y, {
          gap: 4,
          cardHeight: 17,
          drawBorder: false,
        });
        y = compactSectionTitle('Informations du candidat', y - 0.5);
        y = drawLabelValueGrid(doc, data.candidateItems, y, {
          columns: 2,
          rowHeight: 10,
          gap: 2,
          drawBorder: false,
          labelOffsetY: 4,
          valueOffsetY: 7.2,
        });
        y = compactSectionTitle('Informations du paiement', y - 0.5);
        y = drawLabelValueGrid(doc, data.paymentItems, y, {
          columns: 3,
          rowHeight: 10,
          gap: 2,
          drawBorder: false,
          labelOffsetY: 4,
          valueOffsetY: 7.2,
        });

      const signatureY = bottom - 18;
      if (data.note) {
        const noteStartY = Math.min(y + 1.5, signatureY - 11);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('Observation :', left + 3, noteStartY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        const noteLines = doc.splitTextToSize(safeText(data.note), width * 0.42).slice(0, 2);
        doc.text(noteLines, left + 3, noteStartY + 4);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Cachet et signature', left + 3, signatureY);
      doc.line(left + 3, signatureY + 10, left + 55, signatureY + 10);
      doc.text('Signature du client', left + width - 3, signatureY, { align: 'right' });
      doc.line(left + width - 55, signatureY + 10, left + width - 3, signatureY + 10);

      const footerText = buildCompanyFooter(company);
      if (footerText) {
        doc.setFontSize(6.5);
        doc.setTextColor(...BRAND.muted);
        doc.text(footerText, left + width / 2, bottom - 3, { align: 'center' });
        doc.setTextColor(...BRAND.text);
      }
    };

  copies.forEach(drawReceiptCopy);

  doc.setDrawColor(160, 160, 160);
  doc.setLineDashPattern([2, 2], 0);
    doc.line(PAGE.marginX, 146, PAGE.width - PAGE.marginX, 146);
  doc.setLineDashPattern([], 0);

  return { doc, company };
}

export async function buildFacturePdf({ facture }) {
  const totalPaye = (facture.paiements || []).reduce((sum, paiement) => sum + Number(paiement.montant || 0), 0);
  const montantTotal = Number(facture.montantTotal || 0);
  const reste = Math.max(0, montantTotal - totalPaye);
  const candidatNom = facture.candidat
    ? `${facture.candidat.prenom || ''} ${facture.candidat.nom || ''}`.trim()
    : `Candidat #${facture.candidatId || facture.id}`;
  const company = await getPdfCompanyIdentity();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const copies = [
    { top: 10, bottom: 141, label: 'Exemplaire client' },
    { top: 149, bottom: 280, label: 'Exemplaire comptabilite' },
  ];

  const drawFactureCopy = ({ top, bottom, label }) => {
    const left = PAGE.marginX;
    const width = PAGE.width - PAGE.marginX * 2;

    doc.setFillColor(...BRAND.primary);
    doc.roundedRect(left, top, width, 22, 4, 4, 'F');
    doc.setFillColor(...BRAND.secondary);
    doc.rect(left, top + 22, width, 2, 'F');

      drawWatermarkLogo(doc, company.logoDataUrl, {
        x: left + (width - 96) / 2,
        y: top + 40,
        width: 96,
        height: 96,
        opacity: 0.022,
      });

    if (company.logoDataUrl) {
      try {
        doc.addImage(company.logoDataUrl, 'PNG', left + 4, top + 4, 14, 14, undefined, 'FAST');
      } catch {
        // Keep document generation resilient.
      }
    }

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(company.nom, left + 21, top + 9);
      const headerMeta = buildCompanyMeta(company);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      if (headerMeta) {
        doc.text(doc.splitTextToSize(headerMeta, width - 92), left + 21, top + 15);
      }
      doc.text(label, left + width - 4, top + 8, { align: 'right' });
      doc.text(`Facture ${safeText(facture.numero)}`, left + width - 4, top + 14, { align: 'right' });
      doc.text(`Edition du ${formatDate(new Date())}`, left + width - 4, top + 19, { align: 'right' });

    let y = top + 31;
    doc.setTextColor(...BRAND.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Informations facture', left + 2, y);
    y += 4;
    doc.setDrawColor(...BRAND.border);
    doc.line(left + 2, y, left + width - 2, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const leftCol = left + 3;
    const rightCol = left + width / 2 + 4;
    const lineGap = 5;

    const leftItems = [
      ['Numero', facture.numero],
      ['Date emission', formatDate(facture.dateEmission)],
      ['Echeance', formatDate(facture.dateEcheance)],
      ['Statut', facture.statut],
      ['Montant total', formatCurrency(montantTotal)],
    ];
    const rightItems = [
      ['Client', candidatNom],
      ['Telephone', facture.candidat?.telephone || '-'],
      ['Email', facture.candidat?.email || '-'],
      ['Adresse', facture.candidat?.adresse || '-'],
      ['Reste a payer', formatCurrency(reste)],
    ];

    leftItems.forEach(([key, value], index) => {
      const rowY = y + index * lineGap;
      doc.setFont('helvetica', 'bold');
      doc.text(`${key} :`, leftCol, rowY);
      doc.setFont('helvetica', 'normal');
      doc.text(safeText(value), leftCol + 26, rowY);
    });

    rightItems.forEach(([key, value], index) => {
      const rowY = y + index * lineGap;
      doc.setFont('helvetica', 'bold');
      doc.text(`${key} :`, rightCol, rowY);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(safeText(value), 52);
      doc.text(lines, rightCol + 22, rowY);
    });

    y += 30;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Paiements enregistres', left + 2, y);
    y += 4;
    doc.line(left + 2, y, left + width - 2, y);
    y += 5;

    const columns = [
      { label: 'Date', x: left + 3 },
      { label: 'Mode', x: left + 33 },
      { label: 'Reference', x: left + 64 },
      { label: 'Montant', x: left + 116 },
    ];

    doc.setFillColor(...BRAND.primarySoft);
    doc.rect(left + 2, y - 3.5, width - 4, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    columns.forEach((column) => doc.text(column.label, column.x, y + 1));
    y += 7;

    const paiementRows =
      (facture.paiements || []).length > 0
        ? facture.paiements.slice(0, 4).map((paiement) => [
            formatDate(paiement.date),
            paiement.mode || '-',
            paiement.reference || '-',
            formatCurrency(paiement.montant),
          ])
        : [['-', '-', 'Aucun paiement enregistre', '-']];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    paiementRows.forEach((row) => {
      doc.text(safeText(row[0]), left + 3, y);
      doc.text(safeText(row[1]), left + 33, y);
      doc.text(doc.splitTextToSize(safeText(row[2]), 44), left + 64, y);
      doc.text(safeText(row[3]), left + 116, y);
      y += 6;
      doc.setDrawColor(...BRAND.border);
      doc.line(left + 2, y - 2, left + width - 2, y - 2);
    });

    const factureNote = typeof facture.notes === 'string' &&
      !facture.notes.toLowerCase().includes('facture automatique générée')
      ? facture.notes
      : '';

    if (factureNote) {
      y += 2;
      doc.setFont('helvetica', 'bold');
      doc.text('Notes :', left + 3, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      const noteLines = doc.splitTextToSize(factureNote, width - 10);
      doc.text(noteLines, left + 3, y);
      y += noteLines.length * 4;
    }

    const signatureY = bottom - 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Signature / Cachet', left + 3, signatureY);
    doc.line(left + 3, signatureY + 10, left + 55, signatureY + 10);
    doc.text(formatCurrency(reste), left + width - 4, signatureY + 4, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text('Reste a payer', left + width - 4, signatureY - 1, { align: 'right' });

    const footerText = buildCompanyFooter(company);
    if (footerText) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...BRAND.muted);
      doc.text(footerText, left + width / 2, bottom - 3, { align: 'center' });
      doc.setTextColor(...BRAND.text);
    }
  };

  copies.forEach(drawFactureCopy);

  doc.setDrawColor(160, 160, 160);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(PAGE.marginX, 145, PAGE.width - PAGE.marginX, 145);
  doc.setLineDashPattern([], 0);

  return { doc, company };
}

export async function buildPaiementsReportPdf({ paiements, title = 'Journal des paiements' }) {
  const totalMontant = paiements.reduce((sum, paiement) => sum + Number(paiement.montant || 0), 0);
  const { doc, company } = await createBrandedPdf({
    title,
    subtitle: `Edition du ${formatDate(new Date())}`,
    documentLabel: `${paiements.length} transaction(s)`,
  });

  let y = 52;
  y = drawSummaryCards(
    doc,
    [
      { label: 'Transactions', value: String(paiements.length) },
      { label: 'Montant total', value: formatCurrency(totalMontant) },
      {
        label: 'Modes utilises',
        value: String(new Set(paiements.map((paiement) => paiement.mode)).size),
      },
    ],
    y
  );

  y = drawSectionTitle(doc, 'Liste detaillee', y);
  drawSimpleTable(
    doc,
    [
      { label: 'Date', width: 28 },
      { label: 'Candidat', width: 50 },
      { label: 'Mode', width: 26 },
      { label: 'Facture', width: 32 },
      { label: 'Reference', width: 28 },
      { label: 'Montant', width: 18 },
    ],
    paiements.map((paiement) => [
      formatDate(paiement.date),
      paiement.candidat
        ? `${paiement.candidat.prenom || ''} ${paiement.candidat.nom || ''}`.trim()
        : `Candidat #${paiement.candidatId}`,
      paiement.mode || '-',
      paiement.facture?.numero || '-',
      paiement.reference || '-',
      formatCurrency(paiement.montant),
    ]),
    y
  );

  drawFooter(doc, company);
  return { doc, company };
}
