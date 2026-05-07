import { prisma } from './prismaClient.js'
import { mapFacture } from './prismaMappers.js'

const factureInclude = {
  candidat: {
    select: {
      id: true,
      nom: true,
      prenom: true,
    },
  },
  paiements: {
    select: {
      id: true,
    },
  },
}

function generateNumero() {
  const year = new Date().getFullYear()
  const random = String(Date.now()).slice(-4)
  return `FAC-${year}-${random}`
}

export async function syncFactureStatus(client, factureId) {
  const facture = await client.facture.findUnique({
    where: { id: Number(factureId) },
    include: {
      paiements: {
        select: { montant: true },
      },
    },
  })

  if (!facture) {
    return null
  }

  const totalPaye = facture.paiements.reduce((sum, paiement) => sum + Number(paiement.montant || 0), 0)
  const montantTotal = Number(facture.montantTotal || 0)

  const statut =
    totalPaye <= 0
      ? 'EN_ATTENTE'
      : totalPaye >= montantTotal
        ? 'PAYEE'
        : 'PARTIELLEMENT_PAYEE'

  return client.facture.update({
    where: { id: facture.id },
    data: { statut },
    include: factureInclude,
  })
}

export async function getAll() {
  const factures = await prisma.facture.findMany({
    include: factureInclude,
    orderBy: [{ dateEmission: 'desc' }, { id: 'desc' }],
  })

  return factures.map(mapFacture)
}

export async function create(data) {
  const facture = await prisma.facture.create({
    data: {
      numero: data.numero || generateNumero(),
      montantTotal: Number(data.montantTotal || 0),
      statut: data.statut || 'EN_ATTENTE',
      dateEmission: data.dateEmission ? new Date(data.dateEmission) : new Date(),
      dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
      notes: data.notes || null,
      candidatId: Number(data.candidatId),
    },
    include: factureInclude,
  })

  return mapFacture(facture)
}

export async function update(id, data) {
  const facture = await prisma.facture.update({
    where: { id: Number(id) },
    data: {
      numero: data.numero,
      montantTotal: data.montantTotal != null ? Number(data.montantTotal) : undefined,
      statut: data.statut,
      dateEmission: data.dateEmission ? new Date(data.dateEmission) : undefined,
      dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : undefined,
      notes: data.notes,
      candidatId: data.candidatId ? Number(data.candidatId) : undefined,
    },
    include: factureInclude,
  })

  return mapFacture(facture)
}

export async function remove(id) {
  const factureId = Number(id)

  await prisma.paiement.updateMany({
    where: { factureId },
    data: { factureId: null },
  })

  await prisma.facture.delete({
    where: { id: factureId },
  })

  return { success: true }
}
