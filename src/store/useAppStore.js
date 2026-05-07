import { create } from 'zustand'

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
]

const samplePaiements = [
  { id: 'pay-001', candidat: 'Sara Benali', mode: 'CB', montant: '350 000 FCFA', statut: 'Encaisse' },
  { id: 'pay-002', candidat: 'Leo Martin', mode: 'Especes', montant: '120 000 FCFA', statut: 'En attente' },
  { id: 'pay-003', candidat: 'Nina Dupont', mode: 'Virement', montant: '220 000 FCFA', statut: 'Encaisse' },
]

export const useAppStore = create((set) => ({
  isAuthenticated: true,
  currentUser: {
    id: 'user-001',
    name: 'Admin AutoEcole',
    role: 'Directrice',
  },
  candidats: sampleCandidats,
  paiements: samplePaiements,
  depenses: [
    { id: 'dep-001', label: 'Carburant', montant: '95 000 FCFA', statut: 'Paye' },
    { id: 'dep-002', label: 'Assurance vehicule', montant: '210 000 FCFA', statut: 'Planifie' },
  ],
  formations: [
    { id: 'for-001', nom: 'Permis B', heures: '20h', tauxReussite: '82%' },
    { id: 'for-002', nom: 'Conduite accompagnee', heures: '22h', tauxReussite: '88%' },
  ],
  moniteurs: [
    { id: 'mon-001', nom: 'M. Henry', disponibilite: 'Plein temps', vehicule: 'Peugeot 208' },
    { id: 'mon-002', nom: 'Mme Da Silva', disponibilite: 'Apres-midi', vehicule: 'Clio V' },
  ],
  vehicules: [
    { id: 'veh-001', modele: 'Peugeot 208', immatriculation: 'AB-123-CD', statut: 'Disponible' },
    { id: 'veh-002', modele: 'Clio V', immatriculation: 'EF-456-GH', statut: 'Entretien' },
  ],
  factures: [
    { id: 'fac-001', numero: 'F2026-001', client: 'Sara Benali', montant: '350 000 FCFA', statut: 'Envoyee' },
    { id: 'fac-002', numero: 'F2026-002', client: 'Leo Martin', montant: '120 000 FCFA', statut: 'Brouillon' },
  ],
  dashboard: {
    candidatsActifs: 48,
    examensPlanifies: 9,
    caisseJour: '1 420 000 FCFA',
    impayes: '600 000 FCFA',
  },
  login(email) {
    set({
      isAuthenticated: true,
      currentUser: {
        id: 'user-001',
        name: email || 'Admin AutoEcole',
        role: 'Directrice',
      },
    })
  },
  logout() {
    set({ isAuthenticated: false })
  },
}))
