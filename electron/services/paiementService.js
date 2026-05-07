import { prisma } from './prismaClient.js'
import { mapPaiement } from './prismaMappers.js'
import { annulerEntreeTransaction, entreeTransaction } from './caisseService.js'
import { syncFactureStatus } from './factureService.js'

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
      statut: true,
      montantTotal: true,
    },
  },
}

async function computeSolde(client, candidatId) {
  const candidat = await client.candidat.findUnique({
    where: { id: candidatId },
    include: {
      formation: true,
      factures: true,
    },
  })

  if (!candidat) {
    throw new Error('Candidat introuvable.')
  }

  const aggregate = await client.paiement.aggregate({
    where: { candidatId },
    _sum: { montant: true },
  })

  const montantFormation = Number(candidat.formation?.montantTotal || 0)
  const montantFactures = candidat.factures.reduce((sum, facture) => sum + Number(facture.montantTotal || 0), 0)
  const montantTotal = montantFormation || montantFactures || 0
  const totalPaye = Number(aggregate._sum.montant || 0)
  const resteAPayer = Math.max(montantTotal - totalPaye, 0)

  return {
    montantTotal,
    totalPaye,
    resteAPayer,
    pourcentage: montantTotal > 0 ? Math.min(Math.round((totalPaye / montantTotal) * 100), 100) : 0,
    estSolde: resteAPayer <= 0,
    candidat: {
      id: candidat.id,
      nom: candidat.nom,
      prenom: candidat.prenom,
    },
  }
}

export async function getAll() {
  const paiements = await prisma.paiement.findMany({
    include: paiementInclude,
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
  })

  return paiements.map(mapPaiement)
}

export async function getByCandidat(candidatId) {
  const id = Number(candidatId)

  const [paiements, solde] = await Promise.all([
    prisma.paiement.findMany({
      where: { candidatId: id },
      include: paiementInclude,
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
    }),
    computeSolde(prisma, id),
  ])

  return {
    paiements: paiements.map(mapPaiement),
    ...solde,
  }
}

export async function getSolde(candidatId) {
  return computeSolde(prisma, Number(candidatId))
}

export async function create(data) {
  const candidatId = Number(data.candidatId)
  const montant = Number(data.montant)

  if (!candidatId || !montant || montant <= 0) {
    throw new Error('Candidat et montant requis.')
  }

  const result = await prisma.$transaction(async (tx) => {
    const paiement = await tx.paiement.create({
      data: {
        candidatId,
        montant,
        mode: data.mode || 'ESPECES',
        reference: data.reference || null,
        note: data.note || null,
        factureId: data.factureId ? Number(data.factureId) : null,
        date: data.date ? new Date(data.date) : new Date(),
      },
      include: paiementInclude,
    })

    await entreeTransaction(tx, {
      montant,
      description: `Paiement - ${paiement.candidat.prenom} ${paiement.candidat.nom}`,
      reference: `PAI-${paiement.id}`,
      date: paiement.date,
    })

    if (paiement.factureId) {
      await syncFactureStatus(tx, paiement.factureId)
    }

    const solde = await computeSolde(tx, candidatId)

    return { paiement, solde }
  })

  return {
    success: true,
    paiement: mapPaiement(result.paiement),
    solde: result.solde,
  }
}

export async function deletePaiement(id) {
  const paiementId = Number(id)

  const deleted = await prisma.$transaction(async (tx) => {
    const paiement = await tx.paiement.delete({
      where: { id: paiementId },
      include: paiementInclude,
    })

    await annulerEntreeTransaction(tx, {
      montant: paiement.montant,
      description: `Annulation paiement - ${paiement.candidat.prenom} ${paiement.candidat.nom}`,
      reference: `ANN-PAI-${paiement.id}`,
      date: new Date(),
    })

    if (paiement.factureId) {
      await syncFactureStatus(tx, paiement.factureId)
    }

    return paiement
  })

  return {
    success: true,
    paiement: mapPaiement(deleted),
  }
}

export async function getResumeMensuel(annee, mois) {
  const start = new Date(annee, mois - 1, 1)
  const end = new Date(annee, mois, 0, 23, 59, 59)

  const paiements = await prisma.paiement.findMany({
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
    include: paiementInclude,
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
  })

  const mapped = paiements.map(mapPaiement)
  const total = mapped.reduce((sum, paiement) => sum + paiement.montant, 0)
  const parMode = mapped.reduce((acc, paiement) => {
    acc[paiement.mode] = (acc[paiement.mode] || 0) + paiement.montant
    return acc
  }, {})

  return {
    paiements: mapped,
    total,
    parMode,
    count: mapped.length,
  }
}

export async function getPaiements() {
  return getAll()
}

export async function registerPaiement(payload) {
  return create(payload)
}
