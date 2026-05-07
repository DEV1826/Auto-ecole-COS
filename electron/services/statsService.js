import { prisma } from './prismaClient.js'

export async function getDashboard() {
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const [
    candidatsActifs,
    paiementsCount,
    paiementsSum,
    soldeCaisse,
    vehiculesDisponibles,
    examensPlanifies,
  ] = await Promise.all([
    prisma.candidat.count({ where: { statut: { in: ['EN_COURS', 'EN_ATTENTE'] } } }),
    prisma.paiement.count(),
    prisma.paiement.aggregate({ _sum: { montant: true } }),
    prisma.caisse.findFirst({ orderBy: [{ date: 'desc' }, { id: 'desc' }] }),
    prisma.vehicule.count({ where: { statut: 'DISPONIBLE' } }),
    prisma.examen.count({ where: { date: { gte: monthStart } } }),
  ])

  return {
    candidatsActifs,
    paiementsCount,
    totalPaiements: Number(paiementsSum._sum.montant || 0),
    soldeCaisse: Number(soldeCaisse?.solde || 0),
    vehiculesDisponibles,
    examensPlanifies,
  }
}

export async function getMensuels(mois = new Date().getMonth() + 1) {
  const year = new Date().getFullYear()
  const start = new Date(year, mois - 1, 1)
  const end = new Date(year, mois, 0, 23, 59, 59)

  const [encaissements, depenses, nouveauxCandidats] = await Promise.all([
    prisma.paiement.aggregate({
      where: { date: { gte: start, lte: end } },
      _sum: { montant: true },
    }),
    prisma.depense.aggregate({
      where: { date: { gte: start, lte: end } },
      _sum: { montant: true },
    }),
    prisma.candidat.count({
      where: { dateInscription: { gte: start, lte: end } },
    }),
  ])

  return {
    mois,
    encaissements: Number(encaissements._sum.montant || 0),
    depenses: Number(depenses._sum.montant || 0),
    nouveauxCandidats,
  }
}
