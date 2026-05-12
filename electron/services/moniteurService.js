import { prisma } from './prisma.client.js';
import { mapMoniteur } from './prismaMappers.js';

export async function getAll() {
  const moniteurs = await prisma.moniteur.findMany({
    orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
  });

  return moniteurs.map(mapMoniteur);
}

export async function create(data) {
  const moniteur = await prisma.moniteur.create({
    data: {
      nom: data.nom || 'Nom',
      prenom: data.prenom || 'Prenom',
      email: data.email || null,
      telephone: data.telephone || null,
      specialite: data.specialite || null,
      dateEmbauche: data.dateEmbauche ? new Date(data.dateEmbauche) : null,
      actif: data.actif ?? true,
    },
  });

  return mapMoniteur(moniteur);
}

export async function update(id, data) {
  const moniteur = await prisma.moniteur.update({
    where: { id: Number(id) },
    data: {
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone,
      specialite: data.specialite,
      dateEmbauche: data.dateEmbauche ? new Date(data.dateEmbauche) : undefined,
      actif: data.actif,
    },
  });

  return mapMoniteur(moniteur);
}

export async function remove(id) {
  const moniteurId = Number(id);

  await prisma.lecon.deleteMany({
    where: { moniteurId },
  });

  await prisma.moniteur.delete({
    where: { id: moniteurId },
  });

  return { success: true };
}
