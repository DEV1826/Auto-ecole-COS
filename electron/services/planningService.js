import { prisma } from './prisma.client.js';
import { mapLecon } from './prismaMappers.js';

const planningInclude = {
  candidat: {
    select: { id: true, nom: true, prenom: true },
  },
  moniteur: {
    select: { id: true, nom: true, prenom: true },
  },
  vehicule: {
    select: { id: true, modele: true, immatriculation: true },
  },
};

export async function getPlanning() {
  const lessons = await prisma.lecon.findMany({
    include: planningInclude,
    orderBy: [{ date: 'asc' }, { id: 'asc' }],
  });

  return lessons.map(mapLecon);
}

export async function saveLesson(payload) {
  const lesson = await prisma.lecon.create({
    data: {
      date: payload.date ? new Date(payload.date) : new Date(),
      duree: Number(payload.duree || 60),
      type: payload.type || 'CONDUITE',
      statut: payload.statut || 'PLANIFIEE',
      notes: payload.notes || null,
      candidatId: Number(payload.candidatId),
      moniteurId: Number(payload.moniteurId),
      vehiculeId: payload.vehiculeId ? Number(payload.vehiculeId) : null,
    },
    include: planningInclude,
  });

  return mapLecon(lesson);
}

export async function updateLesson(id, payload) {
  const lesson = await prisma.lecon.update({
    where: { id: Number(id) },
    data: {
      date: payload.date ? new Date(payload.date) : undefined,
      duree: payload.duree != null ? Number(payload.duree) : undefined,
      type: payload.type || undefined,
      statut: payload.statut || undefined,
      notes: payload.notes === '' ? null : payload.notes,
      candidatId: payload.candidatId ? Number(payload.candidatId) : undefined,
      moniteurId: payload.moniteurId ? Number(payload.moniteurId) : undefined,
      vehiculeId: payload.vehiculeId ? Number(payload.vehiculeId) : null,
    },
    include: planningInclude,
  });

  return mapLecon(lesson);
}

export async function deleteLesson(id) {
  await prisma.lecon.delete({
    where: { id: Number(id) },
  });

  return { success: true };
}
