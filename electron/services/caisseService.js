import { prisma } from './prisma.client.js';
import { mapCaisse } from './prismaMappers.js';

async function getLastSolde(client = prisma) {
  const last = await client.caisse.findFirst({
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
  });

  return Number(last?.solde || 0);
}

async function createMovement(client, type, data) {
  const montant = Number(data.montant || 0);
  const previous = await getLastSolde(client);
  const solde = type === 'ENTREE' ? previous + montant : previous - montant;

  const mouvement = await client.caisse.create({
    data: {
      type,
      montant,
      solde,
      description: data.description || '',
      reference: data.reference || '',
      date: data.date ? new Date(data.date) : new Date(),
    },
  });

  return mapCaisse(mouvement);
}

export async function getSolde() {
  const [solde, mouvements] = await Promise.all([getLastSolde(), prisma.caisse.count()]);

  return { solde, mouvements };
}

export async function getMouvements() {
  const mouvements = await prisma.caisse.findMany({
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
  });

  return mouvements.map(mapCaisse);
}

export async function entree(data) {
  return createMovement(prisma, 'ENTREE', data);
}

export async function sortie(data) {
  return createMovement(prisma, 'SORTIE', data);
}

export async function entreeTransaction(tx, data) {
  return createMovement(tx, 'ENTREE', data);
}

export async function sortieTransaction(tx, data) {
  return createMovement(tx, 'SORTIE', data);
}

export async function annulerEntreeTransaction(tx, data) {
  return createMovement(tx, 'SORTIE', data);
}

export async function annulerSortieTransaction(tx, data) {
  return createMovement(tx, 'ENTREE', data);
}
