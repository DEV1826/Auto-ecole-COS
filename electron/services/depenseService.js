import { prisma } from './prismaClient.js'
import { mapDepense } from './prismaMappers.js'
import { annulerSortieTransaction, sortieTransaction } from './caisseService.js'

export async function getAll() {
  const depenses = await prisma.depense.findMany({
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
  })

  return depenses.map(mapDepense)
}

export async function create(data) {
  const result = await prisma.$transaction(async (tx) => {
    const depense = await tx.depense.create({
      data: {
        categorie: data.categorie || 'AUTRE',
        montant: Number(data.montant || 0),
        description: data.description || null,
        fournisseur: data.fournisseur || null,
        reference: data.reference || null,
        vehiculeId: data.vehiculeId ? Number(data.vehiculeId) : null,
        date: data.date ? new Date(data.date) : new Date(),
      },
    })

    await sortieTransaction(tx, {
      montant: depense.montant,
      description: depense.description || `Depense ${depense.categorie}`,
      reference: depense.reference || `DEP-${depense.id}`,
      date: depense.date,
    })

    return depense
  })

  return mapDepense(result)
}

export async function remove(id) {
  const depense = await prisma.$transaction(async (tx) => {
    const deleted = await tx.depense.delete({
      where: { id: Number(id) },
    })

    await annulerSortieTransaction(tx, {
      montant: deleted.montant,
      description: `Annulation depense - ${deleted.description || deleted.categorie}`,
      reference: `ANN-DEP-${deleted.id}`,
      date: new Date(),
    })

    return deleted
  })

  return { success: true, depense: mapDepense(depense) }
}
