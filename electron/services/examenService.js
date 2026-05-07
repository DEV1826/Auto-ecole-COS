import { prisma } from './prismaClient.js'
import { mapExamen } from './prismaMappers.js'

const examenInclude = {
  candidat: {
    select: {
      id: true,
      nom: true,
      prenom: true,
    },
  },
}

export async function getAll() {
  const examens = await prisma.examen.findMany({
    include: examenInclude,
    orderBy: [{ date: 'asc' }, { id: 'asc' }],
  })

  return examens.map(mapExamen)
}

export async function create(data) {
  const examen = await prisma.examen.create({
    data: {
      date: data.date ? new Date(data.date) : new Date(),
      type: data.type || 'CONDUITE',
      resultat: data.resultat || 'EN_ATTENTE',
      note: data.note === '' || data.note == null ? null : Number(data.note),
      centre: data.centre || null,
      notes: data.notes || null,
      candidatId: Number(data.candidatId),
    },
    include: examenInclude,
  })

  return mapExamen(examen)
}

export async function update(id, data) {
  const examen = await prisma.examen.update({
    where: { id: Number(id) },
    data: {
      date: data.date ? new Date(data.date) : undefined,
      type: data.type || undefined,
      resultat: data.resultat || undefined,
      note: data.note === '' ? null : data.note != null ? Number(data.note) : undefined,
      centre: data.centre === '' ? null : data.centre,
      notes: data.notes === '' ? null : data.notes,
      candidatId: data.candidatId ? Number(data.candidatId) : undefined,
    },
    include: examenInclude,
  })

  return mapExamen(examen)
}

export async function remove(id) {
  await prisma.examen.delete({
    where: { id: Number(id) },
  })

  return { success: true }
}
