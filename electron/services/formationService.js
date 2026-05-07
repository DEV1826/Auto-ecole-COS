import { prisma } from './prismaClient.js'

function mapFormation(formation) {
  return {
    id: formation.id,
    nom: formation.nom,
    description: formation.description || '',
    prixTotal: Number(formation.prixTotal || 0),
    heuresCode: formation.heuresCode,
    heuresConduite: formation.heuresConduite,
    categorie: formation.categorie,
    actif: formation.actif,
    createdAt: formation.createdAt,
    candidatsCount: formation._count?.candidats || 0,
  }
}

export async function getAll() {
  const formations = await prisma.formation.findMany({
    include: {
      _count: {
        select: {
          candidats: true,
        },
      },
    },
    orderBy: [{ actif: 'desc' }, { nom: 'asc' }],
  })

  return formations.map(mapFormation)
}

export async function create(data) {
  const formation = await prisma.formation.create({
    data: {
      nom: data.nom || 'Nouvelle formation',
      description: data.description || null,
      prixTotal: Number(data.prixTotal || 0),
      heuresCode: Number(data.heuresCode || 0),
      heuresConduite: Number(data.heuresConduite || 20),
      categorie: data.categorie || 'B',
      actif: data.actif ?? true,
    },
    include: {
      _count: {
        select: {
          candidats: true,
        },
      },
    },
  })

  return mapFormation(formation)
}

export async function update(id, data) {
  const formation = await prisma.formation.update({
    where: { id: Number(id) },
    data: {
      nom: data.nom,
      description: data.description,
      prixTotal: data.prixTotal != null ? Number(data.prixTotal) : undefined,
      heuresCode: data.heuresCode != null ? Number(data.heuresCode) : undefined,
      heuresConduite: data.heuresConduite != null ? Number(data.heuresConduite) : undefined,
      categorie: data.categorie,
      actif: data.actif,
    },
    include: {
      _count: {
        select: {
          candidats: true,
        },
      },
    },
  })

  return mapFormation(formation)
}

export async function remove(id) {
  const formationId = Number(id)

  const linked = await prisma.formationCandidat.count({
    where: { formationId },
  })

  if (linked > 0) {
    await prisma.formation.update({
      where: { id: formationId },
      data: { actif: false },
    })
    return { success: true, archived: true }
  }

  await prisma.formation.delete({
    where: { id: formationId },
  })

  return { success: true, archived: false }
}
