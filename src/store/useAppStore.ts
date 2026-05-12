import { create } from 'zustand';

// ============================================
// STORE APPLICATIF (données métier)
// ============================================

const sampleCandidats = [
  {
    id: 'cand-001',
    nom: 'Benali',
    prenom: 'Sara',
    formule: 'Permis B accelere',
    statut: 'Code en cours',
    resteARegler: '420 000 FCFA',
  },
  {
    id: 'cand-002',
    nom: 'Martin',
    prenom: 'Leo',
    formule: 'Conduite accompagnee',
    statut: 'Examen blanc',
    resteARegler: '180 000 FCFA',
  },
  {
    id: 'cand-003',
    nom: 'Dupont',
    prenom: 'Nina',
    formule: 'Permis B classique',
    statut: 'Pret pour l examen',
    resteARegler: '0 FCFA',
  },
];

const samplePaiements = [
  {
    id: 'pay-001',
    candidat: 'Sara Benali',
    mode: 'CB',
    montant: '350 000 FCFA',
    statut: 'Encaisse',
  },
  {
    id: 'pay-002',
    candidat: 'Leo Martin',
    mode: 'Especes',
    montant: '120 000 FCFA',
    statut: 'En attente',
  },
  {
    id: 'pay-003',
    candidat: 'Nina Dupont',
    mode: 'Virement',
    montant: '220 000 FCFA',
    statut: 'Encaisse',
  },
];

export const useAppStore = create((set) => ({
  candidats: sampleCandidats,
  paiements: samplePaiements,
  depenses: [
    { id: 'dep-001', label: 'Carburant', montant: '95 000 FCFA', statut: 'Paye' },
    { id: 'dep-002', label: 'Assurance vehicule', montant: '210 000 FCFA', statut: 'Planifie' },
  ],
  formations: [
    { id: 'for-001', nom: 'Permis B', heures: '20h', tauxReussite: '82%' },
    { id: 'for-002', nom: 'Permis A', heures: '14h', tauxReussite: '91%' },
  ],
  lecons: [
    {
      id: 'lec-001',
      candidat: 'Sara Benali',
      moniteur: 'Jean Dupuis',
      vehicule: 'Toyota Corolla',
      date: '2025-05-15',
      duree: 60,
      type: 'Conduite',
    },
  ],
  examens: [
    {
      id: 'exam-001',
      candidat: 'Sara Benali',
      type: 'Conduite',
      date: '2025-06-20',
      resultat: 'En attente',
    },
  ],
  moniteurs: [
    { id: 'mon-001', nom: 'Dupuis', prenom: 'Jean', specialite: 'Permis B' },
    { id: 'mon-002', nom: 'Bernard', prenom: 'Marie', specialite: 'Permis A' },
  ],
  vehicules: [
    {
      id: 'veh-001',
      immatriculation: 'AB-123-CD',
      marque: 'Toyota',
      modele: 'Corolla',
      statut: 'Disponible',
    },
    {
      id: 'veh-002',
      immatriculation: 'XY-789-ZW',
      marque: 'Peugeot',
      modele: '307',
      statut: 'En lecon',
    },
  ],

  // Actions données métier
  addCandidat: (candidat) => set((state) => ({ candidats: [...state.candidats, candidat] })),
  updateCandidat: (id, data) =>
    set((state) => ({
      candidats: state.candidats.map((c) => (c.id === id ? { ...c, ...data } : c)),
    })),
  deleteCandidat: (id) =>
    set((state) => ({
      candidats: state.candidats.filter((c) => c.id !== id),
    })),

  addPaiement: (paiement) => set((state) => ({ paiements: [...state.paiements, paiement] })),
  updatePaiement: (id, data) =>
    set((state) => ({
      paiements: state.paiements.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),
}));
