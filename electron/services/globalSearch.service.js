// electron/services/globalSearch.service.js

/**
 * @fileoverview Service de recherche globale sur toutes les entités du système.
 * @module globalSearchService
 * @version 1.0.0
 */

import { prisma, executePrismaOperation } from './prisma.client.js';

const SEARCH_LIMIT = 8;
const SEARCH_CACHE_TTL_MS = 15_000;
const searchCache = new Map();

/**
 * Recherche globale sur toutes les tables pertinentes.
 * @param {string} query - Terme de recherche (min 2 caractères)
 * @returns {Promise<Object>} Résultats groupés par entité
 */
export async function globalSearch(query) {
  if (!query || query.trim().length < 2) {
    throw new Error('La recherche doit contenir au moins 2 caractères.');
  }
  const term = query.trim();
  const cacheKey = term.toLocaleLowerCase('fr-FR');
  const cached = searchCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL_MS) {
    return cached.results;
  }

  return executePrismaOperation(async () => {
    const [
      candidats,
      moniteurs,
      vehicules,
      formations,
      examens,
      lecons,
      paiements,
      factures,
      depenses,
      utilisateurs,
    ] = await Promise.all([
      // Candidats
      prisma.candidat.findMany({
        where: {
          OR: [
            { nom: { contains: term } },
            { prenom: { contains: term } },
            { email: { contains: term } },
            { telephone: { contains: term } },
            { numeroPermis: { contains: term } },
          ],
          deletedAt: null,
        },
        take: SEARCH_LIMIT,
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          categorie: true,
          statut: true,
          dateInscription: true,
        },
      }),
      // Moniteurs
      prisma.moniteur.findMany({
        where: {
          OR: [
            { nom: { contains: term } },
            { prenom: { contains: term } },
            { email: { contains: term } },
            { telephone: { contains: term } },
            { specialite: { contains: term } },
          ],
        },
        take: SEARCH_LIMIT,
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          specialite: true,
          actif: true,
        },
      }),
      // Véhicules
      prisma.vehicule.findMany({
        where: {
          OR: [
            { immatriculation: { contains: term } },
            { marque: { contains: term } },
            { modele: { contains: term } },
          ],
        },
        take: SEARCH_LIMIT,
        select: {
          id: true,
          immatriculation: true,
          marque: true,
          modele: true,
          categorie: true,
          statut: true,
          kilometrage: true,
        },
      }),
      // Formations
      prisma.formation.findMany({
        where: {
          OR: [{ nom: { contains: term } }, { description: { contains: term } }],
          actif: true,
        },
        take: SEARCH_LIMIT,
        select: {
          id: true,
          nom: true,
          description: true,
          prixTotal: true,
          heuresCode: true,
          heuresConduite: true,
          categorie: true,
        },
      }),
      // Examens
      prisma.examen.findMany({
        where: {
          OR: [{ centre: { contains: term } }, { notes: { contains: term } }],
        },
        take: SEARCH_LIMIT,
        select: {
          id: true,
          date: true,
          type: true,
          resultat: true,
          centre: true,
          candidatId: true,
          candidat: { select: { nom: true, prenom: true } },
        },
      }),
      // Leçons
      prisma.lecon.findMany({
        where: {
          OR: [{ notes: { contains: term } }],
        },
        take: SEARCH_LIMIT,
        select: {
          id: true,
          date: true,
          duree: true,
          type: true,
          statut: true,
          candidatId: true,
          candidat: { select: { nom: true, prenom: true } },
          moniteur: { select: { nom: true, prenom: true } },
          vehicule: { select: { immatriculation: true } },
        },
      }),
      // Paiements
      prisma.paiement.findMany({
        where: {
          OR: [{ reference: { contains: term } }, { note: { contains: term } }],
        },
        take: SEARCH_LIMIT,
        select: {
          id: true,
          montant: true,
          date: true,
          mode: true,
          reference: true,
          candidatId: true,
          candidat: { select: { nom: true, prenom: true } },
        },
      }),
      // Factures
      prisma.facture.findMany({
        where: {
          OR: [{ numero: { contains: term } }, { notes: { contains: term } }],
        },
        take: SEARCH_LIMIT,
        select: {
          id: true,
          numero: true,
          montantTotal: true,
          statut: true,
          dateEmission: true,
          candidatId: true,
          candidat: { select: { nom: true, prenom: true } },
        },
      }),
      // Dépenses
      prisma.depense.findMany({
        where: {
          OR: [
            { description: { contains: term } },
            { fournisseur: { contains: term } },
            { reference: { contains: term } },
          ],
        },
        take: SEARCH_LIMIT,
        select: {
          id: true,
          categorie: true,
          montant: true,
          date: true,
          fournisseur: true,
          description: true,
          vehiculeId: true,
          vehicule: { select: { immatriculation: true, marque: true, modele: true } },
        },
      }),
      // Utilisateurs
      prisma.utilisateur.findMany({
        where: {
          OR: [
            { nom: { contains: term } },
            { prenom: { contains: term } },
            { email: { contains: term } },
          ],
          actif: true,
        },
        take: SEARCH_LIMIT,
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          role: true,
          actif: true,
        },
      }),
    ]);

    const results = {
      candidats,
      moniteurs,
      vehicules,
      formations,
      examens,
      lecons,
      paiements,
      factures,
      depenses,
      utilisateurs,
    };

    searchCache.set(cacheKey, { timestamp: Date.now(), results });
    return results;
  }, 'Erreur lors de la recherche globale');
}
