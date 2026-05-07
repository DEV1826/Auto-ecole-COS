import prismaPkg from '@prisma/client'

const { PrismaClient } = prismaPkg

const prisma = new PrismaClient()

async function main() {
  await prisma.caisse.deleteMany()
  await prisma.paiement.deleteMany()
  await prisma.depense.deleteMany()
  await prisma.facture.deleteMany()
  await prisma.lecon.deleteMany()
  await prisma.examen.deleteMany()
  await prisma.formationCandidat.deleteMany()
  await prisma.moniteur.deleteMany()
  await prisma.vehicule.deleteMany()
  await prisma.formation.deleteMany()
  await prisma.candidat.deleteMany()
  await prisma.utilisateur.deleteMany()

  const admin = await prisma.utilisateur.create({
    data: {
      nom: 'Admin',
      prenom: 'AutoEcole',
      email: 'admin@autoecolepro.fr',
      passwordHash: 'demo1234',
      role: 'ADMIN',
    },
  })

  const formationB = await prisma.formation.create({
    data: {
      nom: 'Permis B accelere',
      description: 'Formule code + conduite',
      prixTotal: 1400000,
      heuresCode: 20,
      heuresConduite: 22,
      categorie: 'B',
    },
  })

  const formationAAC = await prisma.formation.create({
    data: {
      nom: 'Conduite accompagnee',
      description: 'Parcours AAC',
      prixTotal: 1200000,
      heuresCode: 18,
      heuresConduite: 20,
      categorie: 'B',
    },
  })

  const sara = await prisma.candidat.create({
    data: {
      nom: 'Benali',
      prenom: 'Sara',
      email: 'sara.benali@example.com',
      telephone: '0611223344',
      categorie: 'B',
      statut: 'EN_COURS',
    },
  })

  const leo = await prisma.candidat.create({
    data: {
      nom: 'Martin',
      prenom: 'Leo',
      email: 'leo.martin@example.com',
      telephone: '0655443322',
      categorie: 'B',
      statut: 'EN_ATTENTE',
    },
  })

  await prisma.formationCandidat.createMany({
    data: [
      {
        candidatId: sara.id,
        formationId: formationB.id,
        montantTotal: 1400000,
        heuresCodeEffectuees: 12,
        heuresConduiteEffectuees: 8,
      },
      {
        candidatId: leo.id,
        formationId: formationAAC.id,
        montantTotal: 1200000,
        heuresCodeEffectuees: 4,
        heuresConduiteEffectuees: 2,
      },
    ],
  })

  const moniteur = await prisma.moniteur.create({
    data: {
      nom: 'Henry',
      prenom: 'Marc',
      email: 'marc.henry@example.com',
      telephone: '0610101010',
      specialite: 'Conduite',
    },
  })

  const vehicule = await prisma.vehicule.create({
    data: {
      immatriculation: 'AB-123-CD',
      marque: 'Peugeot',
      modele: '208',
      annee: 2023,
      categorie: 'B',
      kilometrage: 24250,
      statut: 'DISPONIBLE',
    },
  })

  await prisma.lecon.create({
    data: {
      date: new Date(),
      duree: 90,
      type: 'CONDUITE',
      statut: 'PLANIFIEE',
      candidatId: sara.id,
      moniteurId: moniteur.id,
      vehiculeId: vehicule.id,
      notes: 'Lecon de circulation',
    },
  })

  const factureSara = await prisma.facture.create({
    data: {
      numero: 'FAC-2026-001',
      montantTotal: 1400000,
      statut: 'PARTIELLEMENT_PAYEE',
      candidatId: sara.id,
    },
  })

  const paiement1 = await prisma.paiement.create({
    data: {
      candidatId: sara.id,
      montant: 350000,
      mode: 'CARTE',
      reference: 'CB-4421',
      note: 'Acompte inscription',
      factureId: factureSara.id,
    },
  })

  const paiement2 = await prisma.paiement.create({
    data: {
      candidatId: sara.id,
      montant: 280000,
      mode: 'VIREMENT',
      reference: 'VIR-7751',
      factureId: factureSara.id,
    },
  })

  await prisma.caisse.createMany({
    data: [
      {
        type: 'ENTREE',
        montant: 350000,
        solde: 350000,
        description: 'Paiement - Sara Benali',
        reference: `PAI-${paiement1.id}`,
      },
      {
        type: 'ENTREE',
        montant: 280000,
        solde: 630000,
        description: 'Paiement - Sara Benali',
        reference: `PAI-${paiement2.id}`,
      },
      {
        type: 'SORTIE',
        montant: 95000,
        solde: 535000,
        description: 'Plein Peugeot 208',
        reference: 'DEP-1',
      },
    ],
  })

  await prisma.depense.create({
    data: {
      categorie: 'CARBURANT',
      montant: 95000,
      description: 'Plein Peugeot 208',
      fournisseur: 'Station service',
      reference: 'DEP-1',
      vehiculeId: vehicule.id,
    },
  })

  await prisma.examen.create({
    data: {
      candidatId: sara.id,
      date: new Date(new Date().setDate(new Date().getDate() + 15)),
      type: 'CONDUITE',
      resultat: 'EN_ATTENTE',
      centre: 'Centre de Villeurbanne',
    },
  })

  console.log(`Seed termine pour ${admin.email}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
