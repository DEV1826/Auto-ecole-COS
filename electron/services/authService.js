import { prisma } from './prismaClient.js'

export async function login({ email, password }) {
  if (!email || !password) {
    throw new Error('Email et mot de passe obligatoires.')
  }

  const user = await prisma.utilisateur.findUnique({
    where: { email },
  })

  if (!user || !user.actif) {
    throw new Error('Utilisateur introuvable ou inactif.')
  }

  if (user.passwordHash !== password) {
    throw new Error('Identifiants invalides.')
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: `${user.prenom} ${user.nom}`,
    token: `session-${user.id}`,
  }
}
