// src/types/globalSearch.types.ts

/**
 * @module types/globalSearch.types
 * @description Types pour la recherche globale.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Entity Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CandidatSearchResult {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  categorie?: string;
  statut: string;
  dateInscription?: string;
}

export interface MoniteurSearchResult {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  specialite?: string;
  actif: boolean;
}

export interface VehiculeSearchResult {
  id: string;
  immatriculation: string;
  marque: string;
  modele: string;
  categorie?: string;
  statut: string;
  kilometrage: number;
}

export interface FormationSearchResult {
  id: string;
  nom: string;
  description?: string;
  prixTotal: number;
  heuresCode: number;
  heuresConduite: number;
  categorie?: string;
}

export interface ExamenSearchResult {
  id: string;
  date: string | Date;
  type: 'CODE' | 'CONDUITE';
  resultat?: string;
  centre?: string;
  candidatId: string;
  candidat?: {
    nom: string;
    prenom: string;
  };
}

export interface LeconSearchResult {
  id: string;
  date: string | Date;
  duree: number;
  type?: string;
  statut: string;
  candidatId: string;
  candidat?: {
    nom: string;
    prenom: string;
  };
  moniteur?: {
    nom: string;
    prenom: string;
  };
  vehicule?: {
    immatriculation: string;
  };
}

export interface PaiementSearchResult {
  id: string;
  montant: number;
  date: string | Date;
  mode: string;
  reference?: string;
  candidatId: string;
  candidat?: {
    nom: string;
    prenom: string;
  };
}

export interface FactureSearchResult {
  id: string;
  numero: string;
  montantTotal: number;
  statut: string;
  dateEmission?: string | Date;
  candidatId: string;
  candidat?: {
    nom: string;
    prenom: string;
  };
}

export interface DepenseSearchResult {
  id: string;
  categorie: string;
  montant: number;
  date: string | Date;
  fournisseur?: string;
  description?: string;
  vehiculeId?: string;
  vehicule?: {
    immatriculation: string;
    marque: string;
    modele: string;
  };
}

export interface UtilisateurSearchResult {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  actif: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic Union Type
// ─────────────────────────────────────────────────────────────────────────────

export type SearchResultItem =
  | CandidatSearchResult
  | MoniteurSearchResult
  | VehiculeSearchResult
  | FormationSearchResult
  | ExamenSearchResult
  | LeconSearchResult
  | PaiementSearchResult
  | FactureSearchResult
  | DepenseSearchResult
  | UtilisateurSearchResult;

// ─────────────────────────────────────────────────────────────────────────────
// Recent Search Type
// ─────────────────────────────────────────────────────────────────────────────

export interface RecentSearch {
  id: string;
  query: string;
  category:
    | 'candidats'
    | 'moniteurs'
    | 'vehicules'
    | 'formations'
    | 'examens'
    | 'lecons'
    | 'paiements'
    | 'factures'
    | 'depenses'
    | 'utilisateurs';
  title: string;
  icon: string;
  timestamp: Date;
  itemId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Global Search Result Type
// ─────────────────────────────────────────────────────────────────────────────

export interface GlobalSearchResult<T = SearchResultItem> {
  candidats: T extends CandidatSearchResult ? CandidatSearchResult[] : CandidatSearchResult[];
  moniteurs: T extends MoniteurSearchResult ? MoniteurSearchResult[] : MoniteurSearchResult[];
  vehicules: T extends VehiculeSearchResult ? VehiculeSearchResult[] : VehiculeSearchResult[];
  formations: T extends FormationSearchResult ? FormationSearchResult[] : FormationSearchResult[];
  examens: T extends ExamenSearchResult ? ExamenSearchResult[] : ExamenSearchResult[];
  lecons: T extends LeconSearchResult ? LeconSearchResult[] : LeconSearchResult[];
  paiements: T extends PaiementSearchResult ? PaiementSearchResult[] : PaiementSearchResult[];
  factures: T extends FactureSearchResult ? FactureSearchResult[] : FactureSearchResult[];
  depenses: T extends DepenseSearchResult ? DepenseSearchResult[] : DepenseSearchResult[];
  utilisateurs: T extends UtilisateurSearchResult
    ? UtilisateurSearchResult[]
    : UtilisateurSearchResult[];
}
