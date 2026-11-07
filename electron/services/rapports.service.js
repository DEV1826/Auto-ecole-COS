/**
 * Service des rapports (agrégations en lecture seule).
 *
 * Chaque rapport accepte une période `{ dateDebut, dateFin }` (ISO). Par défaut :
 * les 12 derniers mois. Les montants sont en FCFA, les durées en heures.
 *
 * @module electron/services/rapports.service
 */

import { getPrismaClient, executePrismaOperation } from './prisma.client.js';

const DAY = 24 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────────────────────

/** Normalise une période ; dateFin incluse jusqu'à 23:59:59.999. */
export function resolvePeriode(params = {}) {
  const fin = params.dateFin ? new Date(params.dateFin) : new Date();
  if (Number.isNaN(fin.getTime())) throw new Error('Date de fin invalide.');
  fin.setHours(23, 59, 59, 999);

  let debut;
  if (params.dateDebut) {
    debut = new Date(params.dateDebut);
    if (Number.isNaN(debut.getTime())) throw new Error('Date de début invalide.');
  } else {
    debut = new Date(fin.getFullYear(), fin.getMonth() - 11, 1);
  }
  debut.setHours(0, 0, 0, 0);
  if (debut > fin) throw new Error('La date de début doit précéder la date de fin.');
  if (fin - debut > 5 * 366 * DAY) throw new Error('Période limitée à 5 ans.');

  // Période précédente de même durée (pour les comparaisons).
  const duree = fin.getTime() - debut.getTime();
  const precedente = {
    debut: new Date(debut.getTime() - duree - 1),
    fin: new Date(debut.getTime() - 1),
  };
  return { debut, fin, precedente };
}

const sum = (rows, key = 'montant') => rows.reduce((s, r) => s + Number(r[key] || 0), 0);
const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const pct = (part, total) => (total > 0 ? round((part / total) * 100) : 0);
const variation = (actuel, precedent) =>
  precedent > 0 ? round(((actuel - precedent) / precedent) * 100) : actuel > 0 ? 100 : 0;

const monthKey = (d) => {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

/** Liste des mois (AAAA-MM) couverts par la période, pour des séries sans trou. */
function moisDeLaPeriode(debut, fin) {
  const mois = [];
  const cursor = new Date(debut.getFullYear(), debut.getMonth(), 1);
  while (cursor <= fin && mois.length < 72) {
    mois.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return mois;
}

function groupCount(rows, key) {
  return rows.reduce((acc, r) => {
    const k = r[key] ?? 'INCONNU';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

function groupSum(rows, key, valueKey = 'montant') {
  return rows.reduce((acc, r) => {
    const k = r[key] ?? 'INCONNU';
    acc[k] = (acc[k] || 0) + Number(r[valueKey] || 0);
    return acc;
  }, {});
}

const dans = (debut, fin) => ({ gte: debut, lte: fin });

// ─────────────────────────────────────────────────────────────────────────────
// Rapport financier
// ─────────────────────────────────────────────────────────────────────────────

export async function getRapportFinancier(params = {}) {
  return executePrismaOperation(async () => {
    const prisma = getPrismaClient();
    const { debut, fin, precedente } = resolvePeriode(params);

    const [paiements, depenses, paiementsPrec, depensesPrec, inscriptions, paiementsParCandidat, factures] =
      await Promise.all([
        prisma.paiement.findMany({ where: { date: dans(debut, fin) }, select: { montant: true, date: true, mode: true } }),
        prisma.depense.findMany({ where: { date: dans(debut, fin) }, select: { montant: true, date: true, categorie: true } }),
        prisma.paiement.aggregate({ where: { date: dans(precedente.debut, precedente.fin) }, _sum: { montant: true } }),
        prisma.depense.aggregate({ where: { date: dans(precedente.debut, precedente.fin) }, _sum: { montant: true } }),
        prisma.formationCandidat.findMany({
          where: { candidat: { deletedAt: null, statut: { not: 'ABANDONNE' } } },
          select: {
            montantTotal: true,
            candidat: { select: { id: true, nom: true, prenom: true, telephone: true, statut: true } },
            formation: { select: { nom: true } },
          },
        }),
        prisma.paiement.groupBy({ by: ['candidatId'], _sum: { montant: true } }),
        prisma.facture.findMany({
          where: { dateEmission: dans(debut, fin), statut: { not: 'ANNULEE' } },
          select: { montantTotal: true, statut: true },
        }),
      ]);

    const totalPaiements = sum(paiements);
    const totalDepenses = sum(depenses);

    const recettesParMois = groupSum(paiements.map((p) => ({ ...p, mois: monthKey(p.date) })), 'mois');
    const depensesParMois = groupSum(depenses.map((d) => ({ ...d, mois: monthKey(d.date) })), 'mois');
    const serie = moisDeLaPeriode(debut, fin).map((mois) => ({
      mois,
      recettes: round(recettesParMois[mois] || 0, 0),
      depenses: round(depensesParMois[mois] || 0, 0),
      benefice: round((recettesParMois[mois] || 0) - (depensesParMois[mois] || 0), 0),
    }));

    // Soldes restant dus (toutes périodes) par candidat
    const payeParCandidat = new Map(paiementsParCandidat.map((p) => [p.candidatId, Number(p._sum.montant || 0)]));
    const impayes = inscriptions
      .map((i) => {
        const paye = payeParCandidat.get(i.candidat.id) || 0;
        return {
          candidatId: i.candidat.id,
          nom: `${i.candidat.prenom} ${i.candidat.nom}`,
          telephone: i.candidat.telephone,
          formation: i.formation?.nom ?? null,
          montantFormation: Number(i.montantTotal || 0),
          paye,
          reste: Math.max(0, Number(i.montantTotal || 0) - paye),
        };
      })
      .filter((x) => x.reste > 0)
      .sort((a, b) => b.reste - a.reste);

    const totalFacture = sum(factures, 'montantTotal');

    return {
      periode: { debut: debut.toISOString(), fin: fin.toISOString() },
      totalPaiements: round(totalPaiements, 0),
      totalDepenses: round(totalDepenses, 0),
      benefice: round(totalPaiements - totalDepenses, 0),
      margePct: pct(totalPaiements - totalDepenses, totalPaiements),
      nbPaiements: paiements.length,
      nbDepenses: depenses.length,
      panierMoyen: paiements.length ? round(totalPaiements / paiements.length, 0) : 0,
      variations: {
        recettes: variation(totalPaiements, Number(paiementsPrec._sum.montant || 0)),
        depenses: variation(totalDepenses, Number(depensesPrec._sum.montant || 0)),
      },
      parMode: Object.entries(groupSum(paiements, 'mode'))
        .map(([mode, montant]) => ({ mode, montant: round(montant, 0), part: pct(montant, totalPaiements) }))
        .sort((a, b) => b.montant - a.montant),
      parCategorie: Object.entries(groupSum(depenses, 'categorie'))
        .map(([categorie, montant]) => ({ categorie, montant: round(montant, 0), part: pct(montant, totalDepenses) }))
        .sort((a, b) => b.montant - a.montant),
      serie,
      facturation: {
        totalFacture: round(totalFacture, 0),
        nbFactures: factures.length,
        tauxRecouvrement: pct(totalPaiements, totalFacture),
        parStatut: groupCount(factures, 'statut'),
      },
      impayes: {
        total: round(sum(impayes, 'reste'), 0),
        nbCandidats: impayes.length,
        liste: impayes.slice(0, 50),
      },
    };
  }, 'Erreur lors du calcul du rapport financier');
}

// ─────────────────────────────────────────────────────────────────────────────
// Rapport candidats
// ─────────────────────────────────────────────────────────────────────────────

export async function getRapportCandidats(params = {}) {
  return executePrismaOperation(async () => {
    const prisma = getPrismaClient();
    const { debut, fin, precedente } = resolvePeriode(params);

    const [inscrits, inscritsPrec, tous, examens, formations] = await Promise.all([
      prisma.candidat.findMany({
        where: { deletedAt: null, dateInscription: dans(debut, fin) },
        select: { id: true, dateInscription: true, categorie: true, statut: true },
      }),
      prisma.candidat.count({ where: { deletedAt: null, dateInscription: dans(precedente.debut, precedente.fin) } }),
      prisma.candidat.findMany({ where: { deletedAt: null }, select: { statut: true, categorie: true } }),
      prisma.examen.findMany({
        where: { date: dans(debut, fin) },
        select: { type: true, resultat: true, candidatId: true, date: true },
      }),
      prisma.formationCandidat.findMany({
        where: { candidat: { deletedAt: null, dateInscription: dans(debut, fin) } },
        select: { formation: { select: { nom: true } } },
      }),
    ]);

    const parMois = groupCount(inscrits.map((c) => ({ mois: monthKey(c.dateInscription) })), 'mois');
    const examensStats = (type) => {
      const list = examens.filter((e) => e.type === type && e.resultat !== 'EN_ATTENTE');
      const recus = list.filter((e) => e.resultat === 'RECU').length;
      return { passes: list.length, recus, ajournes: list.length - recus, tauxReussite: pct(recus, list.length) };
    };
    const passes = examens.filter((e) => e.resultat !== 'EN_ATTENTE');
    const recus = passes.filter((e) => e.resultat === 'RECU').length;

    // Nombre de tentatives avant réussite (conduite)
    const tentatives = new Map();
    for (const e of [...examens].sort((a, b) => new Date(a.date) - new Date(b.date))) {
      if (e.type !== 'CONDUITE' || e.resultat === 'EN_ATTENTE') continue;
      const t = tentatives.get(e.candidatId) ?? { n: 0, reussi: false };
      if (!t.reussi) {
        t.n += 1;
        t.reussi = e.resultat === 'RECU';
      }
      tentatives.set(e.candidatId, t);
    }
    const reussites = [...tentatives.values()].filter((t) => t.reussi);

    return {
      periode: { debut: debut.toISOString(), fin: fin.toISOString() },
      totalInscrits: inscrits.length,
      variationInscrits: variation(inscrits.length, inscritsPrec),
      totalCandidats: tous.length,
      enCours: tous.filter((c) => c.statut === 'EN_COURS' || c.statut === 'EN_ATTENTE').length,
      parStatut: groupCount(tous, 'statut'),
      parCategorie: groupCount(inscrits, 'categorie'),
      parFormation: Object.entries(groupCount(formations.map((f) => ({ nom: f.formation?.nom ?? 'Sans formation' })), 'nom'))
        .map(([nom, nombre]) => ({ nom, nombre }))
        .sort((a, b) => b.nombre - a.nombre),
      serieInscriptions: moisDeLaPeriode(debut, fin).map((mois) => ({ mois, inscriptions: parMois[mois] || 0 })),
      examens: {
        total: examens.length,
        enAttente: examens.length - passes.length,
        code: examensStats('CODE'),
        conduite: examensStats('CONDUITE'),
      },
      tauxReussite: pct(recus, passes.length),
      tentativesMoyennesConduite: reussites.length ? round(sum(reussites, 'n') / reussites.length) : 0,
      tauxAbandon: pct(tous.filter((c) => c.statut === 'ABANDONNE').length, tous.length),
    };
  }, 'Erreur lors du calcul du rapport candidats');
}

// ─────────────────────────────────────────────────────────────────────────────
// Rapport leçons
// ─────────────────────────────────────────────────────────────────────────────

export async function getRapportLecons(params = {}) {
  return executePrismaOperation(async () => {
    const prisma = getPrismaClient();
    const { debut, fin, precedente } = resolvePeriode(params);

    const [lecons, effectueesPrec] = await Promise.all([
      prisma.lecon.findMany({
        where: { date: dans(debut, fin) },
        select: {
          date: true,
          duree: true,
          type: true,
          statut: true,
          moniteur: { select: { id: true, nom: true, prenom: true } },
        },
      }),
      prisma.lecon.aggregate({
        where: { date: dans(precedente.debut, precedente.fin), statut: 'EFFECTUEE' },
        _sum: { duree: true },
      }),
    ]);

    const effectuees = lecons.filter((l) => l.statut === 'EFFECTUEE');
    const heuresEffectuees = sum(effectuees, 'duree') / 60;
    const terminees = lecons.filter((l) => l.statut !== 'PLANIFIEE');

    const parMoniteurMap = new Map();
    for (const l of lecons) {
      const m = l.moniteur;
      const entry =
        parMoniteurMap.get(m.id) ??
        { moniteurId: m.id, moniteurNom: `${m.prenom} ${m.nom}`, lecons: 0, heures: 0, annulees: 0, absences: 0, planifiees: 0 };
      entry.lecons += 1;
      if (l.statut === 'EFFECTUEE') entry.heures += l.duree / 60;
      if (l.statut === 'ANNULEE') entry.annulees += 1;
      if (l.statut === 'ABSENCE') entry.absences += 1;
      if (l.statut === 'PLANIFIEE') entry.planifiees += 1;
      parMoniteurMap.set(m.id, entry);
    }

    const heuresParMois = groupSum(effectuees.map((l) => ({ mois: monthKey(l.date), h: l.duree / 60 })), 'mois', 'h');
    const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const parJour = groupCount(lecons.filter((l) => l.statut !== 'ANNULEE').map((l) => ({ j: new Date(l.date).getDay() })), 'j');
    const parHeure = groupCount(lecons.filter((l) => l.statut !== 'ANNULEE').map((l) => ({ h: new Date(l.date).getHours() })), 'h');

    return {
      periode: { debut: debut.toISOString(), fin: fin.toISOString() },
      totalLecons: lecons.length,
      totalHeures: round(heuresEffectuees),
      variationHeures: variation(heuresEffectuees, Number(effectueesPrec._sum.duree || 0) / 60),
      dureeMoyenne: lecons.length ? Math.round(sum(lecons, 'duree') / lecons.length) : 0,
      parStatut: groupCount(lecons, 'statut'),
      parType: Object.fromEntries(
        Object.entries(groupSum(effectuees.map((l) => ({ type: l.type, h: l.duree / 60 })), 'type', 'h')).map(([k, v]) => [k, round(v)])
      ),
      tauxRealisation: pct(effectuees.length, terminees.length),
      tauxAbsence: pct(lecons.filter((l) => l.statut === 'ABSENCE').length, terminees.length),
      tauxAnnulation: pct(lecons.filter((l) => l.statut === 'ANNULEE').length, lecons.length),
      parMoniteur: [...parMoniteurMap.values()]
        .map((m) => ({ ...m, heures: round(m.heures) }))
        .sort((a, b) => b.heures - a.heures),
      serie: moisDeLaPeriode(debut, fin).map((mois) => ({ mois, heures: round(heuresParMois[mois] || 0) })),
      parJourSemaine: [1, 2, 3, 4, 5, 6, 0].map((j) => ({ jour: jours[j], lecons: parJour[j] || 0 })),
      parHeure: Array.from({ length: 14 }, (_, i) => i + 7).map((h) => ({ heure: `${h}h`, lecons: parHeure[h] || 0 })),
    };
  }, 'Erreur lors du calcul du rapport leçons');
}

// ─────────────────────────────────────────────────────────────────────────────
// Rapport véhicules
// ─────────────────────────────────────────────────────────────────────────────

export async function getRapportVehicules(params = {}) {
  return executePrismaOperation(async () => {
    const prisma = getPrismaClient();
    const { debut, fin } = resolvePeriode(params);

    const [vehicules, entretiens, depenses, lecons] = await Promise.all([
      prisma.vehicule.findMany({
        select: {
          id: true,
          immatriculation: true,
          marque: true,
          modele: true,
          categorie: true,
          statut: true,
          kilometrage: true,
          prochaineRevisionKm: true,
          dateDerniereRevision: true,
        },
        orderBy: { immatriculation: 'asc' },
      }),
      prisma.entretien.findMany({ where: { date: dans(debut, fin) }, select: { vehiculeId: true, cout: true, type: true } }),
      prisma.depense.findMany({
        where: { date: dans(debut, fin), vehiculeId: { not: null } },
        select: { vehiculeId: true, montant: true, categorie: true },
      }),
      prisma.lecon.findMany({
        where: { date: dans(debut, fin), statut: 'EFFECTUEE', vehiculeId: { not: null } },
        select: { vehiculeId: true, duree: true },
      }),
    ]);

    const parVehicule = vehicules.map((v) => {
      const ent = entretiens.filter((e) => e.vehiculeId === v.id);
      const dep = depenses.filter((d) => d.vehiculeId === v.id);
      const heures = sum(lecons.filter((l) => l.vehiculeId === v.id), 'duree') / 60;
      const coutEntretiens = sum(ent, 'cout');
      const carburant = sum(dep.filter((d) => d.categorie === 'CARBURANT'));
      const autresDepenses = sum(dep.filter((d) => d.categorie !== 'CARBURANT'));
      const coutTotal = coutEntretiens + carburant + autresDepenses;
      const kmRestants = v.prochaineRevisionKm != null ? v.prochaineRevisionKm - v.kilometrage : null;
      return {
        id: v.id,
        immatriculation: v.immatriculation,
        libelle: `${v.marque} ${v.modele}`,
        categorie: v.categorie,
        statut: v.statut,
        kilometrage: v.kilometrage,
        heuresLecons: round(heures),
        nbEntretiens: ent.length,
        coutEntretiens: round(coutEntretiens, 0),
        carburant: round(carburant, 0),
        autresDepenses: round(autresDepenses, 0),
        coutTotal: round(coutTotal, 0),
        coutParHeure: heures > 0 ? round(coutTotal / heures, 0) : null,
        kmAvantRevision: kmRestants,
        alerteRevision: kmRestants != null && kmRestants <= 1000,
      };
    });

    const total = vehicules.length;
    return {
      periode: { debut: debut.toISOString(), fin: fin.toISOString() },
      totalVehicules: total,
      disponibles: vehicules.filter((v) => v.statut === 'DISPONIBLE').length,
      enLecon: vehicules.filter((v) => v.statut === 'EN_LECON').length,
      enEntretien: vehicules.filter((v) => v.statut === 'EN_ENTRETIEN').length,
      horsService: vehicules.filter((v) => v.statut === 'HORS_SERVICE').length,
      kilometrageMoyen: total ? Math.round(sum(vehicules, 'kilometrage') / total) : 0,
      entretiensPeriode: entretiens.length,
      coutEntretiens: round(sum(entretiens, 'cout'), 0),
      coutCarburant: round(sum(depenses.filter((d) => d.categorie === 'CARBURANT')), 0),
      heuresLecons: round(sum(lecons, 'duree') / 60),
      tauxDisponibilite: pct(vehicules.filter((v) => v.statut === 'DISPONIBLE' || v.statut === 'EN_LECON').length, total),
      entretiensParType: Object.entries(groupCount(entretiens, 'type'))
        .map(([type, nombre]) => ({ type, nombre }))
        .sort((a, b) => b.nombre - a.nombre),
      alertes: parVehicule.filter((v) => v.alerteRevision),
      parVehicule,
    };
  }, 'Erreur lors du calcul du rapport véhicules');
}

// ─────────────────────────────────────────────────────────────────────────────
// Indicateurs clés (KPI)
// ─────────────────────────────────────────────────────────────────────────────

export async function getRapportKPI(params = {}) {
  return executePrismaOperation(async () => {
    const [financier, candidats, lecons, vehicules] = await Promise.all([
      getRapportFinancier(params),
      getRapportCandidats(params),
      getRapportLecons(params),
      getRapportVehicules(params),
    ]);
    const prisma = getPrismaClient();
    const moniteursActifs = await prisma.moniteur.count({ where: { actif: true } });
    const heuresConduite = (lecons.parType.CONDUITE || 0) + (lecons.parType.CONDUITE_ACCOMPAGNEE || 0);

    return {
      periode: financier.periode,
      chiffreAffaires: financier.totalPaiements,
      variationCA: financier.variations.recettes,
      depenses: financier.totalDepenses,
      benefice: financier.benefice,
      margePct: financier.margePct,
      tauxRecouvrement: financier.facturation.tauxRecouvrement,
      impayes: financier.impayes.total,
      nouveauxInscrits: candidats.totalInscrits,
      variationInscrits: candidats.variationInscrits,
      candidatsEnCours: candidats.enCours,
      caParInscrit: candidats.totalInscrits ? Math.round(financier.totalPaiements / candidats.totalInscrits) : 0,
      tauxReussite: candidats.tauxReussite,
      tauxReussiteCode: candidats.examens.code.tauxReussite,
      tauxReussiteConduite: candidats.examens.conduite.tauxReussite,
      tentativesMoyennesConduite: candidats.tentativesMoyennesConduite,
      tauxAbandon: candidats.tauxAbandon,
      heuresDispensees: lecons.totalHeures,
      variationHeures: lecons.variationHeures,
      heuresParMoniteur: moniteursActifs ? round(lecons.totalHeures / moniteursActifs) : 0,
      tauxAbsence: lecons.tauxAbsence,
      tauxAnnulation: lecons.tauxAnnulation,
      coutParHeureConduite: heuresConduite > 0 ? Math.round((vehicules.coutEntretiens + vehicules.coutCarburant) / heuresConduite) : null,
      tauxDisponibiliteFlotte: vehicules.tauxDisponibilite,
      alertesRevision: vehicules.alertes.length,
      serieFinanciere: financier.serie,
      serieHeures: lecons.serie,
      serieInscriptions: candidats.serieInscriptions,
    };
  }, 'Erreur lors du calcul des indicateurs');
}
