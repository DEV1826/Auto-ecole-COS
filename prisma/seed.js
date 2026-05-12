// prisma/seed.js
/**
 * Script de seeding pour l'auto-école COS.
 * @module seed
 * @description Peuple la base de données avec des données de test réalistes.
 * Exécuter avec : `pnpm db:seed`
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Hash un mot de passe (similaire à la fonction du service auth)
 * @param {string} password - Mot de passe en clair
 * @returns {string} Hash SHA-256
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Supprime toutes les données existantes (ordre respectant les clés étrangères)
 */
async function clearDatabase() {
  console.log('🗑️  Nettoyage de la base de données...');

  // Ordre inverse des dépendances
  await prisma.paiement.deleteMany();
  await prisma.facture.deleteMany();
  await prisma.examen.deleteMany();
  await prisma.lecon.deleteMany();
  await prisma.depense.deleteMany();
  await prisma.caisse.deleteMany();
  await prisma.formationCandidat.deleteMany();
  await prisma.document.deleteMany();
  await prisma.entretien.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.session.deleteMany();
  await prisma.passwordResetCode.deleteMany();
  await prisma.utilisateur.deleteMany();
  await prisma.candidat.deleteMany();
  await prisma.formation.deleteMany();
  await prisma.moniteur.deleteMany();
  await prisma.vehicule.deleteMany();
  await prisma.companyConfig.deleteMany();
  await prisma.tarif.deleteMany();

  console.log('✅ Base de données nettoyée');
}

/**
 * Crée la configuration de l'entreprise
 */
async function seedCompanyConfig() {
  await prisma.companyConfig.create({
    data: {
      nom: 'COS Auto-École',
      adresse: '123 Avenue de la Conduite, Yaoundé, Cameroun',
      telephone: '+237 6 00 00 00 00',
      email: 'contact@cos-autoecole.com',
      siteWeb: 'https://www.cos-autoecole.com',
      numeroFiscal: 'CI-2025-001234',
      logoPath: '/images/logo-cos.png',
    },
  });
  console.log('🏢 Configuration entreprise créée');
}

/**
 * Crée les formations de base
 */
async function seedFormations() {
  const formations = await prisma.$transaction([
    prisma.formation.create({
      data: {
        nom: 'Permis B (Voiture)',
        description: 'Formation complète pour l’obtention du permis de conduire catégorie B.',
        prixTotal: 250000,
        heuresCode: 12,
        heuresConduite: 20,
        categorie: 'B',
        actif: true,
      },
    }),
    prisma.formation.create({
      data: {
        nom: 'Permis A (Moto)',
        description: 'Formation pour le permis moto, incluant plateau et circulation.',
        prixTotal: 220000,
        heuresCode: 10,
        heuresConduite: 18,
        categorie: 'A',
        actif: true,
      },
    }),
    prisma.formation.create({
      data: {
        nom: 'Permis C (Poids lourd)',
        description: 'Formation pour conduite de camions et poids lourds.',
        prixTotal: 350000,
        heuresCode: 15,
        heuresConduite: 25,
        categorie: 'C',
        actif: true,
      },
    }),
    prisma.formation.create({
      data: {
        nom: 'Conduite accompagnée',
        description: 'Préparation à la conduite accompagnée (AAC) pour les jeunes conducteurs.',
        prixTotal: 300000,
        heuresCode: 10,
        heuresConduite: 20,
        categorie: 'B',
        actif: true,
      },
    }),
  ]);

  console.log(`📚 ${formations.length} formations créées`);
  return formations;
}

/**
 * Crée les utilisateurs (ADMIN, SECRETAIRE, MONITEUR)
 */
async function seedUsers() {
  const adminPassword = hashPassword('Admin123!');
  const secretairePassword = hashPassword('Secret123!');
  const moniteurPassword = hashPassword('Moniteur123!');

  const admin = await prisma.utilisateur.create({
    data: {
      email: 'admin@cos.com',
      nom: 'Admin',
      prenom: 'Super',
      passwordHash: adminPassword,
      role: 'ADMIN',
      niveau: 'SUPER_ADMIN',
      actif: true,
    },
  });

  const secretaire = await prisma.utilisateur.create({
    data: {
      email: 'secretaire@cos-autoecole.com',
      nom: 'Secrétaire',
      prenom: 'Alpha',
      passwordHash: secretairePassword,
      role: 'SECRETAIRE',
      niveau: 'STANDARD',
      actif: true,
    },
  });

  const moniteur1 = await prisma.utilisateur.create({
    data: {
      email: 'moniteur.dubois@cos-autoecole.com',
      nom: 'Dubois',
      prenom: 'Marc',
      passwordHash: moniteurPassword,
      role: 'MONITEUR',
      niveau: 'STANDARD',
      actif: true,
    },
  });

  const moniteur2 = await prisma.utilisateur.create({
    data: {
      email: 'moniteur.martin@cos-autoecole.com',
      nom: 'Martin',
      prenom: 'Sophie',
      passwordHash: moniteurPassword,
      role: 'MONITEUR',
      niveau: 'STANDARD',
      actif: true,
    },
  });

  console.log(`👥 Utilisateurs créés (${[admin, secretaire, moniteur1, moniteur2].length})`);
  return { admin, secretaire, moniteurs: [moniteur1, moniteur2] };
}

/**
 * Crée les moniteurs liés aux utilisateurs (table Moniteur)
 */
async function seedMoniteurs(users) {
  const moniteurs = await prisma.$transaction([
    prisma.moniteur.create({
      data: {
        nom: 'Dubois',
        prenom: 'Marc',
        email: users.moniteurs[0].email,
        telephone: '+237 6 11 22 33 44',
        specialite: 'Permis B, Conduite accompagnée',
        dateEmbauche: new Date('2023-01-15'),
        actif: true,
      },
    }),
    prisma.moniteur.create({
      data: {
        nom: 'Martin',
        prenom: 'Sophie',
        email: users.moniteurs[1].email,
        telephone: '+237 6 55 66 77 88',
        specialite: 'Permis B, Moto',
        dateEmbauche: new Date('2023-03-20'),
        actif: true,
      },
    }),
  ]);
  console.log(`👨‍🏫 ${moniteurs.length} moniteurs créés`);
  return moniteurs;
}

/**
 * Crée les véhicules
 */
async function seedVehicules() {
  const vehicules = await prisma.$transaction([
    prisma.vehicule.create({
      data: {
        immatriculation: 'LT-123-AB',
        marque: 'Toyota',
        modele: 'Yaris',
        annee: 2022,
        categorie: 'B',
        kilometrage: 12500,
        dateAcquisition: new Date('2022-06-01'),
        dateDerniereRevision: new Date('2024-01-10'),
        prochaineRevisionKm: 25000,
        statut: 'DISPONIBLE',
      },
    }),
    prisma.vehicule.create({
      data: {
        immatriculation: 'LT-456-CD',
        marque: 'Renault',
        modele: 'Clio',
        annee: 2023,
        categorie: 'B',
        kilometrage: 8000,
        dateAcquisition: new Date('2023-02-15'),
        dateDerniereRevision: new Date('2024-02-20'),
        prochaineRevisionKm: 20000,
        statut: 'DISPONIBLE',
      },
    }),
    prisma.vehicule.create({
      data: {
        immatriculation: 'LT-789-EF',
        marque: 'Peugeot',
        modele: '208',
        annee: 2021,
        categorie: 'B',
        kilometrage: 32000,
        dateAcquisition: new Date('2021-09-10'),
        dateDerniereRevision: new Date('2024-03-05'),
        prochaineRevisionKm: 40000,
        statut: 'DISPONIBLE',
      },
    }),
    prisma.vehicule.create({
      data: {
        immatriculation: 'MT-001-AA',
        marque: 'Yamaha',
        modele: 'MT-07',
        annee: 2022,
        categorie: 'A',
        kilometrage: 5500,
        dateAcquisition: new Date('2022-11-01'),
        dateDerniereRevision: new Date('2024-02-10'),
        prochaineRevisionKm: 10000,
        statut: 'DISPONIBLE',
      },
    }),
  ]);
  console.log(`🚗 ${vehicules.length} véhicules créés`);
  return vehicules;
}

/**
 * Crée des candidats et les associe à des formations
 */
async function seedCandidats(formations, moniteurs) {
  // Candidat 1 : en cours, permis B
  const candidat1 = await prisma.candidat.create({
    data: {
      nom: 'Ndong',
      prenom: 'Charles',
      email: 'charles.ndong@example.com',
      telephone: '+237 6 11 22 33 44',
      dateNaissance: new Date('1995-04-12'),
      adresse: 'Rue 123, Quartier Omnisport, Yaoundé',
      numeroPermis: null,
      categorie: 'B',
      statut: 'EN_COURS',
      dateInscription: new Date('2024-01-10'),
    },
  });

  await prisma.formationCandidat.create({
    data: {
      candidatId: candidat1.id,
      formationId: formations[0].id, // Permis B
      heuresCodeEffectuees: 8,
      heuresConduiteEffectuees: 12,
      montantTotal: formations[0].prixTotal,
      dateDebut: new Date('2024-01-15'),
    },
  });

  // Candidat 2 : reçu (permis obtenu)
  const candidat2 = await prisma.candidat.create({
    data: {
      nom: 'Mbarga',
      prenom: 'Catherine',
      email: 'catherine.mbarga@example.com',
      telephone: '+237 6 55 66 77 88',
      dateNaissance: new Date('1992-08-25'),
      adresse: 'Avenue Mvog-Mbi, Yaoundé',
      numeroPermis: 'BP-2024-001234',
      categorie: 'B',
      statut: 'RECU',
      dateInscription: new Date('2023-09-05'),
    },
  });

  await prisma.formationCandidat.create({
    data: {
      candidatId: candidat2.id,
      formationId: formations[0].id,
      heuresCodeEffectuees: 12,
      heuresConduiteEffectuees: 20,
      montantTotal: formations[0].prixTotal,
      dateDebut: new Date('2023-09-10'),
      dateFin: new Date('2024-02-20'),
    },
  });

  // Candidat 3 : en conduite accompagnée
  const candidat3 = await prisma.candidat.create({
    data: {
      nom: 'Ewolo',
      prenom: 'Jean',
      email: 'jean.ewolo@example.com',
      telephone: '+237 6 77 88 99 00',
      dateNaissance: new Date('2006-05-15'),
      adresse: 'Bastos, Yaoundé',
      numeroPermis: null,
      categorie: 'B',
      statut: 'EN_COURS',
      dateInscription: new Date('2024-02-01'),
    },
  });

  await prisma.formationCandidat.create({
    data: {
      candidatId: candidat3.id,
      formationId: formations[3].id, // Conduite accompagnée
      heuresCodeEffectuees: 5,
      heuresConduiteEffectuees: 6,
      montantTotal: formations[3].prixTotal,
      dateDebut: new Date('2024-02-10'),
    },
  });

  // Candidat 4 : échoué à l’examen
  const candidat4 = await prisma.candidat.create({
    data: {
      nom: 'Tchoffo',
      prenom: 'Anne',
      email: 'anne.tchoffo@example.com',
      telephone: '+237 6 88 99 00 11',
      dateNaissance: new Date('1998-11-30'),
      adresse: 'Messa, Yaoundé',
      numeroPermis: null,
      categorie: 'B',
      statut: 'ECHOUE',
      dateInscription: new Date('2023-11-20'),
    },
  });

  await prisma.formationCandidat.create({
    data: {
      candidatId: candidat4.id,
      formationId: formations[0].id,
      heuresCodeEffectuees: 12,
      heuresConduiteEffectuees: 20,
      montantTotal: formations[0].prixTotal,
      dateDebut: new Date('2023-11-25'),
      dateFin: new Date('2024-03-10'),
    },
  });

  console.log(`👨‍🎓 ${4} candidats créés`);
  return [candidat1, candidat2, candidat3, candidat4];
}

/**
 * Crée des leçons (planning)
 */
async function seedLecons(candidats, moniteurs, vehicules) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0); // demain 9h

  const lecons = [
    {
      date: new Date(startDate),
      duree: 60,
      type: 'CONDUITE',
      statut: 'PLANIFIEE',
      notes: 'Première leçon de conduite, prise en main du véhicule.',
      candidatId: candidats[0].id, // Charles
      moniteurId: moniteurs[0].id,
      vehiculeId: vehicules[0].id,
    },
    {
      date: new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000), // +2 jours
      duree: 90,
      type: 'CODE',
      statut: 'PLANIFIEE',
      notes: 'Révision du code de la route, séance de questions.',
      candidatId: candidats[2].id, // Jean
      moniteurId: moniteurs[1].id,
      vehiculeId: null,
    },
    {
      date: new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000),
      duree: 60,
      type: 'CONDUITE',
      statut: 'PLANIFIEE',
      notes: 'Manœuvre de stationnement.',
      candidatId: candidats[0].id,
      moniteurId: moniteurs[1].id,
      vehiculeId: vehicules[1].id,
    },
    {
      date: new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000),
      duree: 120,
      type: 'CONDUITE_ACCOMPAGNEE',
      statut: 'PLANIFIEE',
      notes: 'Conduite accompagnée – parcours en ville.',
      candidatId: candidats[2].id,
      moniteurId: moniteurs[0].id,
      vehiculeId: vehicules[0].id,
    },
    {
      date: new Date(startDate.getTime() - 5 * 24 * 60 * 60 * 1000), // passé
      duree: 60,
      type: 'CONDUITE',
      statut: 'EFFECTUEE',
      notes: 'Très bonne progression.',
      candidatId: candidats[1].id,
      moniteurId: moniteurs[0].id,
      vehiculeId: vehicules[2].id,
    },
  ];

  for (const lecon of lecons) {
    await prisma.lecon.create({ data: lecon });
  }
  console.log(`📅 ${lecons.length} leçons créées`);
}

/**
 * Crée des examens
 */
async function seedExamens(candidats) {
  const examens = [
    {
      date: new Date(2024, 4, 15, 9, 0), // 15 mai 2024
      type: 'CODE',
      resultat: 'RECU',
      note: 35,
      centre: 'Délégation de la Sécurité Routière, Yaoundé',
      notes: 'Très bon résultat.',
      candidatId: candidats[1].id, // Catherine (reçue)
    },
    {
      date: new Date(2024, 4, 20, 13, 0),
      type: 'CONDUITE',
      resultat: 'RECU',
      note: 18.5,
      centre: 'Piste d’examen de Mvog-Mbi',
      notes: 'Parcours maîtrisé.',
      candidatId: candidats[1].id,
    },
    {
      date: new Date(2024, 2, 10, 10, 0),
      type: 'CONDUITE',
      resultat: 'AJOURNE',
      note: 12,
      centre: 'Piste d’examen de Mvog-Mbi',
      notes: 'Erreurs éliminatoires (stationnement).',
      candidatId: candidats[3].id, // Anne (échouée)
    },
    {
      date: new Date(2024, 5, 5, 9, 30),
      type: 'CODE',
      resultat: 'EN_ATTENTE',
      centre: 'Centre d’examen de Ngoa-Ekelle',
      candidatId: candidats[0].id,
    },
  ];

  for (const examen of examens) {
    await prisma.examen.create({ data: examen });
  }
  console.log(`📝 ${examens.length} examens créés`);
}

/**
 * Crée des paiements, factures et dépenses
 */
async function seedFinances(candidats, formations) {
  // Facture pour candidat1
  const facture1 = await prisma.facture.create({
    data: {
      numero: 'FAC-2024-0001',
      montantTotal: formations[0].prixTotal,
      statut: 'PARTIELLEMENT_PAYEE',
      dateEmission: new Date('2024-01-15'),
      dateEcheance: new Date('2024-03-15'),
      notes: 'Premier versement effectué.',
      candidatId: candidats[0].id,
    },
  });
  await prisma.paiement.create({
    data: {
      montant: 100000,
      date: new Date('2024-01-20'),
      mode: 'VIREMENT',
      reference: 'PAY-001',
      note: 'Acompte',
      candidatId: candidats[0].id,
      factureId: facture1.id,
    },
  });

  // Facture pour candidat2 (payée)
  const facture2 = await prisma.facture.create({
    data: {
      numero: 'FAC-2024-0002',
      montantTotal: formations[0].prixTotal,
      statut: 'PAYEE',
      dateEmission: new Date('2023-09-10'),
      dateEcheance: new Date('2023-12-10'),
      candidatId: candidats[1].id,
    },
  });
  await prisma.paiement.create({
    data: {
      montant: formations[0].prixTotal,
      date: new Date('2023-09-25'),
      mode: 'ESPECES',
      candidatId: candidats[1].id,
      factureId: facture2.id,
    },
  });

  // Facture pour candidat3 (en attente)
  await prisma.facture.create({
    data: {
      numero: 'FAC-2024-0003',
      montantTotal: formations[3].prixTotal,
      statut: 'EN_ATTENTE',
      dateEmission: new Date('2024-02-10'),
      dateEcheance: new Date('2024-05-10'),
      candidatId: candidats[2].id,
    },
  });

  // Dépenses
  await prisma.depense.create({
    data: {
      categorie: 'CARBURANT',
      montant: 75000,
      description: 'Achat de carburant pour le mois de mars',
      date: new Date('2024-03-05'),
      fournisseur: 'TotalEnergies',
      reference: 'CARB-0324',
    },
  });
  await prisma.depense.create({
    data: {
      categorie: 'ENTRETIEN_VEHICULE',
      montant: 125000,
      description: 'Révision annuelle des véhicules LT-123-AB et LT-456-CD',
      date: new Date('2024-02-20'),
      fournisseur: 'Garage du Centre',
      vehiculeId: (await prisma.vehicule.findFirst()).id,
    },
  });

  // Mouvements de caisse
  await prisma.caisse.create({
    data: {
      type: 'ENTREE',
      montant: 100000,
      solde: 100000,
      description: 'Paiement candidat Charles',
      reference: 'PAY-001',
      date: new Date('2024-01-20'),
    },
  });
  await prisma.caisse.create({
    data: {
      type: 'SORTIE',
      montant: 75000,
      solde: 25000,
      description: 'Carburant mars',
      reference: 'CARB-0324',
      date: new Date('2024-03-05'),
    },
  });

  console.log('💰 Données financières créées (factures, paiements, dépenses, caisse)');
}

/**
 * Fonction principale de seeding
 */
async function main() {
  console.log('🌱 Démarrage du seeding...');

  await clearDatabase();
  await seedCompanyConfig();
  const formations = await seedFormations();
  const users = await seedUsers();
  const moniteurs = await seedMoniteurs(users);
  const vehicules = await seedVehicules();
  const candidats = await seedCandidats(formations, moniteurs);
  await seedLecons(candidats, moniteurs, vehicules);
  await seedExamens(candidats);
  await seedFinances(candidats, formations);

  console.log('✅ Seeding terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur pendant le seeding :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
