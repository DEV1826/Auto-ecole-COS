/**
 * Export des rapports en Excel (un onglet par rapport) ou en PDF (synthèse).
 *
 * @module electron/services/rapports.export.service
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';

import {
  getRapportCandidats,
  getRapportFinancier,
  getRapportLecons,
  getRapportVehicules,
} from './rapports.service.js';

const TYPES = ['financier', 'candidats', 'lecons', 'vehicules'];

const LABELS = {
  ESPECES: 'Espèces',
  CHEQUE: 'Chèque',
  VIREMENT: 'Virement',
  CARTE: 'Carte',
  MOBILE_MONEY: 'Mobile money',
  EN_COURS: 'En cours',
  RECU: 'Reçu',
  ECHOUE: 'Échoué',
  ABANDONNE: 'Abandonné',
  EN_ATTENTE: 'En attente',
  PLANIFIEE: 'Planifiée',
  EFFECTUEE: 'Effectuée',
  ANNULEE: 'Annulée',
  ABSENCE: 'Absence',
  CODE: 'Code',
  CONDUITE: 'Conduite',
  CONDUITE_ACCOMPAGNEE: 'Conduite accompagnée',
  DISPONIBLE: 'Disponible',
  EN_LECON: 'En leçon',
  EN_ENTRETIEN: 'En entretien',
  HORS_SERVICE: 'Hors service',
};
const label = (k) => LABELS[k] ?? String(k).replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());

const fmtDate = (iso) => new Intl.DateTimeFormat('fr-FR').format(new Date(iso));
const fcfa = (n) => `${Math.round(Number(n || 0)).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ')} FCFA`;

async function exportDir() {
  const { app } = globalThis.__ELECTRON_MAIN__ ?? {};
  const base = app ? app.getPath('documents') : process.cwd();
  const dir = path.join(base, 'Auto-Ecole COS', 'exports', 'rapports');
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function collect(types, params) {
  const out = {};
  if (types.includes('financier')) out.financier = await getRapportFinancier(params);
  if (types.includes('candidats')) out.candidats = await getRapportCandidats(params);
  if (types.includes('lecons')) out.lecons = await getRapportLecons(params);
  if (types.includes('vehicules')) out.vehicules = await getRapportVehicules(params);
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Excel
// ─────────────────────────────────────────────────────────────────────────────

function addTable(ws, title, columns, rows) {
  if (ws.rowCount > 0) ws.addRow([]);
  const t = ws.addRow([title]);
  t.font = { bold: true, size: 12, color: { argb: 'FF1E3A8A' } };
  const head = ws.addRow(columns.map((c) => c.header));
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  head.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };
  });
  for (const r of rows) {
    const row = ws.addRow(columns.map((c) => (typeof c.value === 'function' ? c.value(r) : r[c.value])));
    columns.forEach((c, i) => {
      if (c.numFmt) row.getCell(i + 1).numFmt = c.numFmt;
    });
  }
}

function addKeyValues(ws, title, pairs) {
  addTable(ws, title, [{ header: 'Indicateur', value: 0 }, { header: 'Valeur', value: 1 }], pairs);
}

const MONEY = '#,##0" FCFA"';

function sheetFinancier(wb, r) {
  const ws = wb.addWorksheet('Financier');
  addKeyValues(ws, 'Synthèse', [
    ['Recettes', fcfa(r.totalPaiements)],
    ['Dépenses', fcfa(r.totalDepenses)],
    ['Résultat', fcfa(r.benefice)],
    ['Marge', `${r.margePct} %`],
    ['Paiements', r.nbPaiements],
    ['Panier moyen', fcfa(r.panierMoyen)],
    ['Taux de recouvrement', `${r.facturation.tauxRecouvrement} %`],
    ['Restes dus (total)', fcfa(r.impayes.total)],
  ]);
  addTable(ws, 'Évolution mensuelle', [
    { header: 'Mois', value: 'mois' },
    { header: 'Recettes', value: 'recettes', numFmt: MONEY },
    { header: 'Dépenses', value: 'depenses', numFmt: MONEY },
    { header: 'Résultat', value: 'benefice', numFmt: MONEY },
  ], r.serie);
  addTable(ws, 'Recettes par mode de paiement', [
    { header: 'Mode', value: (x) => label(x.mode) },
    { header: 'Montant', value: 'montant', numFmt: MONEY },
    { header: 'Part (%)', value: 'part' },
  ], r.parMode);
  addTable(ws, 'Dépenses par catégorie', [
    { header: 'Catégorie', value: (x) => label(x.categorie) },
    { header: 'Montant', value: 'montant', numFmt: MONEY },
    { header: 'Part (%)', value: 'part' },
  ], r.parCategorie);
  addTable(ws, 'Restes dus par candidat', [
    { header: 'Candidat', value: 'nom' },
    { header: 'Téléphone', value: (x) => x.telephone ?? '' },
    { header: 'Formation', value: (x) => x.formation ?? '' },
    { header: 'Montant formation', value: 'montantFormation', numFmt: MONEY },
    { header: 'Payé', value: 'paye', numFmt: MONEY },
    { header: 'Reste dû', value: 'reste', numFmt: MONEY },
  ], r.impayes.liste);
}

function sheetCandidats(wb, r) {
  const ws = wb.addWorksheet('Candidats');
  addKeyValues(ws, 'Synthèse', [
    ['Nouveaux inscrits', r.totalInscrits],
    ['Variation vs période précédente', `${r.variationInscrits} %`],
    ['Candidats en formation', r.enCours],
    ['Taux de réussite aux examens', `${r.tauxReussite} %`],
    ['Réussite code', `${r.examens.code.tauxReussite} % (${r.examens.code.recus}/${r.examens.code.passes})`],
    ['Réussite conduite', `${r.examens.conduite.tauxReussite} % (${r.examens.conduite.recus}/${r.examens.conduite.passes})`],
    ['Tentatives moyennes (conduite)', r.tentativesMoyennesConduite],
    ["Taux d'abandon", `${r.tauxAbandon} %`],
  ]);
  addTable(ws, 'Inscriptions par mois', [{ header: 'Mois', value: 'mois' }, { header: 'Inscriptions', value: 'inscriptions' }], r.serieInscriptions);
  addTable(ws, 'Candidats par statut', [{ header: 'Statut', value: (x) => label(x[0]) }, { header: 'Nombre', value: 1 }], Object.entries(r.parStatut));
  addTable(ws, 'Inscriptions par formation', [{ header: 'Formation', value: 'nom' }, { header: 'Inscrits', value: 'nombre' }], r.parFormation);
}

function sheetLecons(wb, r) {
  const ws = wb.addWorksheet('Leçons');
  addKeyValues(ws, 'Synthèse', [
    ['Leçons', r.totalLecons],
    ['Heures dispensées', r.totalHeures],
    ['Durée moyenne (min)', r.dureeMoyenne],
    ['Taux de réalisation', `${r.tauxRealisation} %`],
    ["Taux d'absence", `${r.tauxAbsence} %`],
    ["Taux d'annulation", `${r.tauxAnnulation} %`],
  ]);
  addTable(ws, 'Activité par moniteur', [
    { header: 'Moniteur', value: 'moniteurNom' },
    { header: 'Leçons', value: 'lecons' },
    { header: 'Heures effectuées', value: 'heures' },
    { header: 'Planifiées', value: 'planifiees' },
    { header: 'Annulées', value: 'annulees' },
    { header: 'Absences', value: 'absences' },
  ], r.parMoniteur);
  addTable(ws, 'Heures par mois', [{ header: 'Mois', value: 'mois' }, { header: 'Heures', value: 'heures' }], r.serie);
  addTable(ws, 'Heures par type', [{ header: 'Type', value: (x) => label(x[0]) }, { header: 'Heures', value: 1 }], Object.entries(r.parType));
}

function sheetVehicules(wb, r) {
  const ws = wb.addWorksheet('Véhicules');
  addKeyValues(ws, 'Synthèse', [
    ['Véhicules', r.totalVehicules],
    ['Taux de disponibilité', `${r.tauxDisponibilite} %`],
    ['Kilométrage moyen', `${r.kilometrageMoyen.toLocaleString('fr-FR')} km`],
    ['Entretiens sur la période', r.entretiensPeriode],
    ['Coût des entretiens', fcfa(r.coutEntretiens)],
    ['Carburant', fcfa(r.coutCarburant)],
    ['Heures de leçon', r.heuresLecons],
  ]);
  addTable(ws, 'Détail par véhicule', [
    { header: 'Immatriculation', value: 'immatriculation' },
    { header: 'Véhicule', value: 'libelle' },
    { header: 'Statut', value: (x) => label(x.statut) },
    { header: 'Kilométrage', value: 'kilometrage' },
    { header: 'Heures de leçon', value: 'heuresLecons' },
    { header: 'Entretiens', value: 'coutEntretiens', numFmt: MONEY },
    { header: 'Carburant', value: 'carburant', numFmt: MONEY },
    { header: 'Autres dépenses', value: 'autresDepenses', numFmt: MONEY },
    { header: 'Coût total', value: 'coutTotal', numFmt: MONEY },
    { header: 'Coût / heure', value: (x) => x.coutParHeure ?? '', numFmt: MONEY },
    { header: 'Km avant révision', value: (x) => x.kmAvantRevision ?? '' },
  ], r.parVehicule);
}

async function toExcel(data, filePath, periode) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Auto-Ecole COS';
  wb.created = new Date();
  if (data.financier) sheetFinancier(wb, data.financier);
  if (data.candidats) sheetCandidats(wb, data.candidats);
  if (data.lecons) sheetLecons(wb, data.lecons);
  if (data.vehicules) sheetVehicules(wb, data.vehicules);
  for (const ws of wb.worksheets) {
    ws.columns.forEach((col) => {
      let max = 10;
      col.eachCell({ includeEmpty: false }, (cell) => {
        max = Math.max(max, String(cell.value ?? '').length + 2);
      });
      col.width = Math.min(max, 45);
    });
    ws.headerFooter.oddFooter = `Période du ${fmtDate(periode.debut)} au ${fmtDate(periode.fin)}`;
  }
  await wb.xlsx.writeFile(filePath);
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF (synthèse)
// ─────────────────────────────────────────────────────────────────────────────

async function toPdf(data, filePath, periode) {
  const doc = new jsPDF();
  let y = 0;
  const header = () => {
    doc.setFillColor(67, 56, 202);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text("Rapport d'activité", 14, 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Période du ${fmtDate(periode.debut)} au ${fmtDate(periode.fin)}`, 14, 22);
    doc.setTextColor(30, 30, 30);
    y = 38;
  };
  const ensure = (h) => {
    if (y + h > 285) {
      doc.addPage();
      header();
    }
  };
  const section = (title) => {
    ensure(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(title, 14, y);
    doc.setDrawColor(67, 56, 202);
    doc.line(14, y + 2, 196, y + 2);
    y += 9;
  };
  const kv = (pairs) => {
    doc.setFontSize(10);
    for (const [k, v] of pairs) {
      ensure(7);
      doc.setFont('helvetica', 'normal');
      doc.text(String(k), 16, y);
      doc.setFont('helvetica', 'bold');
      doc.text(String(v), 196, y, { align: 'right' });
      y += 6;
    }
    y += 4;
  };

  header();
  if (data.financier) {
    const r = data.financier;
    section('Finances');
    kv([
      ['Recettes', fcfa(r.totalPaiements)],
      ['Dépenses', fcfa(r.totalDepenses)],
      ['Résultat', fcfa(r.benefice)],
      ['Marge', `${r.margePct} %`],
      ['Taux de recouvrement', `${r.facturation.tauxRecouvrement} %`],
      ['Restes dus', `${fcfa(r.impayes.total)} (${r.impayes.nbCandidats} candidats)`],
      ...r.parCategorie.slice(0, 5).map((c) => [`Dépenses · ${label(c.categorie)}`, fcfa(c.montant)]),
    ]);
  }
  if (data.candidats) {
    const r = data.candidats;
    section('Candidats et examens');
    kv([
      ['Nouveaux inscrits', `${r.totalInscrits} (${r.variationInscrits >= 0 ? '+' : ''}${r.variationInscrits} %)`],
      ['Candidats en formation', r.enCours],
      ['Réussite globale', `${r.tauxReussite} %`],
      ['Réussite code', `${r.examens.code.tauxReussite} %`],
      ['Réussite conduite', `${r.examens.conduite.tauxReussite} %`],
      ["Taux d'abandon", `${r.tauxAbandon} %`],
    ]);
  }
  if (data.lecons) {
    const r = data.lecons;
    section('Leçons');
    kv([
      ['Leçons', r.totalLecons],
      ['Heures dispensées', `${r.totalHeures} h`],
      ['Taux de réalisation', `${r.tauxRealisation} %`],
      ["Taux d'absence", `${r.tauxAbsence} %`],
      ...r.parMoniteur.slice(0, 8).map((m) => [`Moniteur · ${m.moniteurNom}`, `${m.heures} h`]),
    ]);
  }
  if (data.vehicules) {
    const r = data.vehicules;
    section('Flotte');
    kv([
      ['Véhicules', r.totalVehicules],
      ['Taux de disponibilité', `${r.tauxDisponibilite} %`],
      ['Coût des entretiens', fcfa(r.coutEntretiens)],
      ['Carburant', fcfa(r.coutCarburant)],
      ['Révisions à prévoir', r.alertes.length],
    ]);
  }
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Édité le ${new Date().toLocaleString('fr-FR')} — Auto-Ecole COS`, 14, 292);
  await fs.writeFile(filePath, Buffer.from(doc.output('arraybuffer')));
}

/**
 * @param {{ types?: string[], format?: 'xlsx'|'pdf', dateDebut?: string, dateFin?: string }} payload
 * @returns {Promise<{ success: true, path: string }>}
 */
export async function exportRapports(payload = {}) {
  const types = (Array.isArray(payload.types) && payload.types.length ? payload.types : TYPES).filter((t) =>
    TYPES.includes(t)
  );
  if (types.length === 0) throw new Error('Aucun rapport sélectionné.');
  const format = payload.format === 'pdf' ? 'pdf' : 'xlsx';
  const params = { dateDebut: payload.dateDebut, dateFin: payload.dateFin };

  const data = await collect(types, params);
  const periode = Object.values(data)[0].periode;
  const name = types.length === TYPES.length ? 'complet' : types.join('-');
  const filePath = path.join(await exportDir(), `rapport-${name}-${new Date().toISOString().slice(0, 10)}.${format}`);

  if (format === 'pdf') await toPdf(data, filePath, periode);
  else await toExcel(data, filePath, periode);

  return { success: true, path: filePath };
}
