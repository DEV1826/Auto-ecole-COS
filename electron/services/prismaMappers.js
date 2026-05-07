function toNumber(value) {
  if (value == null) {
    return value
  }

  if (typeof value === 'object' && typeof value.toNumber === 'function') {
    return value.toNumber()
  }

  return value
}

export function mapCandidat(candidat) {
  const montantTotal = toNumber(candidat.formation?.montantTotal) || 0
  const totalPaye =
    candidat.paiements?.reduce((sum, paiement) => sum + (toNumber(paiement.montant) || 0), 0) || 0

  return {
    id: candidat.id,
    nom: candidat.nom,
    prenom: candidat.prenom,
    email: candidat.email,
    telephone: candidat.telephone,
    categorie: candidat.categorie,
    statut: candidat.statut,
    dateInscription: candidat.dateInscription,
    formationId: candidat.formation?.formationId || null,
    formationNom: candidat.formation?.formation?.nom || null,
    montantTotal,
    totalPaye,
    resteARegler: Math.max(montantTotal - totalPaye, 0),
  }
}

export function mapPaiement(paiement) {
  return {
    id: paiement.id,
    candidatId: paiement.candidatId,
    montant: toNumber(paiement.montant) || 0,
    date: paiement.date,
    mode: paiement.mode,
    reference: paiement.reference || '',
    note: paiement.note || '',
    factureId: paiement.factureId,
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
          statut: paiement.facture.statut,
        }
      : null,
  }
}

export function mapLecon(lecon) {
  return {
    id: lecon.id,
    date: lecon.date,
    duree: lecon.duree,
    type: lecon.type,
    statut: lecon.statut,
    notes: lecon.notes || '',
    candidatId: lecon.candidatId,
    moniteurId: lecon.moniteurId,
    vehiculeId: lecon.vehiculeId,
    candidat: lecon.candidat
      ? { id: lecon.candidat.id, nom: lecon.candidat.nom, prenom: lecon.candidat.prenom }
      : null,
    moniteur: lecon.moniteur
      ? { id: lecon.moniteur.id, nom: lecon.moniteur.nom, prenom: lecon.moniteur.prenom }
      : null,
    vehicule: lecon.vehicule
      ? { id: lecon.vehicule.id, modele: lecon.vehicule.modele, immatriculation: lecon.vehicule.immatriculation }
      : null,
  }
}

export function mapVehicule(vehicule) {
  return {
    id: vehicule.id,
    immatriculation: vehicule.immatriculation,
    marque: vehicule.marque,
    modele: vehicule.modele,
    annee: vehicule.annee,
    categorie: vehicule.categorie,
    kilometrage: vehicule.kilometrage,
    statut: vehicule.statut,
    dateDerniereRevision: vehicule.dateDerniereRevision,
    prochaineRevision: vehicule.prochaineRevision,
  }
}

export function mapMoniteur(moniteur) {
  return {
    id: moniteur.id,
    nom: moniteur.nom,
    prenom: moniteur.prenom,
    email: moniteur.email,
    telephone: moniteur.telephone,
    specialite: moniteur.specialite,
    dateEmbauche: moniteur.dateEmbauche,
    actif: moniteur.actif,
  }
}

export function mapDepense(depense) {
  return {
    id: depense.id,
    categorie: depense.categorie,
    montant: toNumber(depense.montant) || 0,
    description: depense.description || '',
    date: depense.date,
    fournisseur: depense.fournisseur || '',
    reference: depense.reference || '',
    vehiculeId: depense.vehiculeId,
  }
}

export function mapCaisse(mouvement) {
  return {
    id: mouvement.id,
    type: mouvement.type,
    montant: toNumber(mouvement.montant) || 0,
    solde: toNumber(mouvement.solde) || 0,
    description: mouvement.description || '',
    reference: mouvement.reference || '',
    date: mouvement.date,
  }
}

export function mapFacture(facture) {
  return {
    id: facture.id,
    numero: facture.numero,
    montantTotal: toNumber(facture.montantTotal) || 0,
    statut: facture.statut,
    dateEmission: facture.dateEmission,
    dateEcheance: facture.dateEcheance,
    notes: facture.notes || '',
    candidatId: facture.candidatId,
    candidat: facture.candidat
      ? {
          id: facture.candidat.id,
          nom: facture.candidat.nom,
          prenom: facture.candidat.prenom,
        }
      : null,
    paiementsCount: facture.paiements?.length || 0,
  }
}

export function mapExamen(examen) {
  return {
    id: examen.id,
    date: examen.date,
    type: examen.type,
    resultat: examen.resultat,
    note: toNumber(examen.note),
    centre: examen.centre || '',
    notes: examen.notes || '',
    candidatId: examen.candidatId,
    candidat: examen.candidat
      ? {
          id: examen.candidat.id,
          nom: examen.candidat.nom,
          prenom: examen.candidat.prenom,
        }
      : null,
  }
}
