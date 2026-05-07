import { prisma } from './prismaClient.js'
import { mapVehicule } from './prismaMappers.js'

export async function getAll() {
  const vehicules = await prisma.vehicule.findMany({
    orderBy: [{ immatriculation: 'asc' }],
  })

  return vehicules.map(mapVehicule)
}

export async function create(data) {
  const vehicule = await prisma.vehicule.create({
    data: {
      immatriculation: data.immatriculation || '',
      marque: data.marque || '',
      modele: data.modele || '',
      annee: Number(data.annee || new Date().getFullYear()),
      categorie: data.categorie || 'B',
      kilometrage: Number(data.kilometrage || 0),
      dateAcquisition: data.dateAcquisition ? new Date(data.dateAcquisition) : null,
      dateDerniereRevision: data.dateDerniereRevision ? new Date(data.dateDerniereRevision) : null,
      prochaineRevision: data.prochaineRevision ? Number(data.prochaineRevision) : null,
      statut: data.statut || 'DISPONIBLE',
    },
  })

  return mapVehicule(vehicule)
}

export async function update(id, data) {
  const vehicule = await prisma.vehicule.update({
    where: { id: Number(id) },
    data: {
      immatriculation: data.immatriculation,
      marque: data.marque,
      modele: data.modele,
      annee: data.annee != null ? Number(data.annee) : undefined,
      categorie: data.categorie,
      kilometrage: data.kilometrage != null ? Number(data.kilometrage) : undefined,
      dateAcquisition: data.dateAcquisition ? new Date(data.dateAcquisition) : undefined,
      dateDerniereRevision: data.dateDerniereRevision ? new Date(data.dateDerniereRevision) : undefined,
      prochaineRevision: data.prochaineRevision != null ? Number(data.prochaineRevision) : undefined,
      statut: data.statut,
    },
  })

  return mapVehicule(vehicule)
}

export async function getVehicules() {
  return getAll()
}

export async function updateVehiculeStatus({ id, statut }) {
  return update(id, { statut })
}

export async function remove(id) {
  const vehiculeId = Number(id)

  await prisma.lecon.updateMany({
    where: { vehiculeId },
    data: { vehiculeId: null },
  })

  await prisma.depense.updateMany({
    where: { vehiculeId },
    data: { vehiculeId: null },
  })

  await prisma.entretien.deleteMany({
    where: { vehiculeId },
  })

  await prisma.vehicule.delete({
    where: { id: vehiculeId },
  })

  return { success: true }
}
