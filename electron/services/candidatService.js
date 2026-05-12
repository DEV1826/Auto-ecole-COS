import { prisma } from './prisma.client.js'
import { mapCandidat } from './prismaMappers.js'

const candidatInclude = {
  formation: {
    include: {
      formation: true,
    },
  },
  paiements: true,
}

export async function getAll() {
  const candidats = await prisma.candidat.findMany({
    include: candidatInclude,
    orderBy: [{ dateInscription: 'desc' }, { id: 'desc' }],
  })

  return candidats.map(mapCandidat)
}

export async function getById(id) {
  const candidat = await prisma.candidat.findUnique({
    where: { id: Number(id) },
    include: {
      formation: {
        include: {
          formation: true,
        },
      },
      paiements: true,
      factures: true,
      examens: true,
      lecons: true,
    },
  })

  if (!candidat) {
    throw new Error('Candidat introuvable.')
  }

  return {
    ...mapCandidat(candidat),
    formation: candidat.formation,
    factures: candidat.factures,
    examens: candidat.examens,
    lecons: candidat.lecons,
  }
}

export async function create(data) {
  let formationId = data.formationId ? Number(data.formationId) : null

  const candidat = await prisma.candidat.create({
    data: {
      nom: data.nom || 'Nom',
      prenom: data.prenom || 'Prenom',
      email: data.email || null,
      telephone: data.telephone || null,
      dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : null,
      adresse: data.adresse || null,
      numeroPermis: data.numeroPermis || null,
      categorie: data.categorie || 'B',
      statut: data.statut || 'EN_COURS',
    },
    include: candidatInclude,
  })

  if (!formationId && data.montantTotal != null) {
    const defaultFormation = await prisma.formation.findFirst({
      orderBy: { id: 'asc' },
    })
    formationId = defaultFormation?.id || null
  }

  if (formationId) {
    await prisma.formationCandidat.create({
      data: {
        candidatId: candidat.id,
        formationId,
        montantTotal: Number(data.montantTotal || 0),
      },
    })
  }

  const created = await prisma.candidat.findUnique({
    where: { id: candidat.id },
    include: {
      formation: {
        include: {
          formation: true,
        },
      },
      paiements: true,
    },
  })

  return mapCandidat(created)
}

export async function update(id, data) {
  const candidatId = Number(id)
  let formationId = data.formationId ? Number(data.formationId) : null

  await prisma.candidat.update({
    where: { id: candidatId },
    data: {
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone,
      dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : undefined,
      adresse: data.adresse,
      numeroPermis: data.numeroPermis,
      categorie: data.categorie,
      statut: data.statut,
    },
  })

  if (!formationId && data.montantTotal != null) {
    const defaultFormation = await prisma.formation.findFirst({
      orderBy: { id: 'asc' },
    })
    formationId = defaultFormation?.id || null
  }

  if (formationId || data.montantTotal != null) {
    const existing = await prisma.formationCandidat.findUnique({
      where: { candidatId: candidatId },
    })

    if (existing) {
      await prisma.formationCandidat.update({
        where: { candidatId: candidatId },
        data: {
          formationId: formationId || undefined,
          montantTotal: data.montantTotal != null ? Number(data.montantTotal) : undefined,
        },
      })
    } else if (formationId) {
      await prisma.formationCandidat.create({
        data: {
          candidatId: candidatId,
          formationId,
          montantTotal: Number(data.montantTotal || 0),
        },
      })
    }
  }

  const candidat = await prisma.candidat.findUnique({
    where: { id: candidatId },
    include: {
      formation: {
        include: {
          formation: true,
        },
      },
      paiements: true,
    },
  })

  return mapCandidat(candidat)
}

export async function remove(id) {
  const candidatId = Number(id)

  await prisma.$transaction(async (tx) => {
    await tx.paiement.deleteMany({ where: { candidatId } })
    await tx.facture.deleteMany({ where: { candidatId } })
    await tx.examen.deleteMany({ where: { candidatId } })
    await tx.lecon.deleteMany({ where: { candidatId } })
    await tx.formationCandidat.deleteMany({ where: { candidatId } })
    await tx.candidat.delete({ where: { id: candidatId } })
  })

  return { success: true }
}

export async function search(query) {
  const term = String(query || '').trim()

  const candidats = await prisma.candidat.findMany({
    where: term
      ? {
          OR: [
            { nom: { contains: term } },
            { prenom: { contains: term } },
            { email: { contains: term } },
            { telephone: { contains: term } },
          ],
        }
      : undefined,
    include: candidatInclude,
    orderBy: [{ dateInscription: 'desc' }, { id: 'desc' }],
  })

  return candidats.map(mapCandidat)
}

export async function getCandidats() {
  return getAll()
}

export async function createCandidat(payload) {
  return create(payload)
}

export async function updateCandidatStatus({ id, statut }) {
  return update(id, { statut })
}
