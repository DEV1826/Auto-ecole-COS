// src/types/caisse.types.ts

/**
 * @module types/caisse.types
 * @description
 * Types complets pour la gestion des mouvements de caisse dans l’auto‑école COS.
 *
 * Ce module exporte :
 * - `MouvementCaisse` : le modèle principal
 * - `CaisseStats` : métriques agrégées (solde, entrées/sorties)
 * - `CaisseTrends` : évolutions temporelles
 * - `CaisseColumnConfig` : contrôle de visibilité des colonnes dans les tableaux
 * - `CaisseTableActions` : callbacks d’actions sur les lignes
 * - `CaisseColumnsOptions` : options complètes pour la génération des colonnes
 *
 * Ces types sont utilisés dans les composants `StatsCard`, `DataTable`,
 * `AdminStatsCards`, `CaissePage`, etc.
 *
 * @author Stive Junior
 * @version 1.0.0
 *
 * @see {@link TypeMouvement} – Énumération ENTREE / SORTIE
 */

import type { TypeMouvement } from '@/types/enums';

// ============================================================
// MODÈLE PRINCIPAL
// ============================================================

/**
 * MouvementCaisse – correspond au modèle Prisma `Caisse`.
 *
 * @interface MouvementCaisse
 * @description
 * Un mouvement de caisse représente une entrée ou une sortie d’argent.
 * Le champ `solde` est le solde immédiatement après le mouvement,
 * ce qui permet de reconstituer l’historique des soldes.
 *
 * @property {number} id - Identifiant unique (auto-incrémenté)
 * @property {TypeMouvement} type - `ENTREE` (encaissement) ou `SORTIE` (décaissement)
 * @property {number} montant - Montant du mouvement (toujours positif)
 * @property {number} solde - Solde de la caisse après ce mouvement
 * @property {string | null} [description] - Raison / motif du mouvement
 * @property {string | null} [reference] - Référence externe (paiement, facture, etc.)
 * @property {Date | string} date - Date du mouvement (peut être différente de `createdAt`)
 * @property {Date | string} createdAt - Horodatage d’enregistrement dans le système
 *
 * @example
 * ```ts
 * const mouvement: MouvementCaisse = {
 *   id: 1,
 *   type: 'ENTREE',
 *   montant: 50000,
 *   solde: 150000,
 *   description: 'Paiement candidat Dupont',
 *   reference: 'PAY-100',
 *   date: '2024-03-25T09:30:00Z',
 *   createdAt: '2024-03-25T09:30:00Z',
 * };
 * ```
 */
export interface MouvementCaisse {
  id: number;
  type: TypeMouvement;
  montant: number;
  solde: number; // solde après le mouvement
  description?: string | null;
  reference?: string | null;
  date: Date | string;
  createdAt: Date | string;
}

// ============================================================
// STATISTIQUES POUR LE DASHBOARD
// ============================================================

/**
 * Métriques statistiques agrégées pour la caisse.
 *
 * @interface CaisseStats
 * @description Indicateurs clés de la trésorerie.
 *
 * @property {number} soldeActuel - Solde actuel (dernier mouvement)
 * @property {number} totalEntrees - Cumul des entrées (tous mouvements)
 * @property {number} totalSorties - Cumul des sorties
 * @property {number} nombreMouvements - Nombre total de mouvements enregistrés
 * @property {number} entreesMois - Total des entrées du mois en cours
 * @property {number} sortiesMois - Total des sorties du mois en cours
 *
 * @example
 * ```ts
 * const stats: CaisseStats = {
 *   soldeActuel: 285000,
 *   totalEntrees: 1250000,
 *   totalSorties: 965000,
 *   nombreMouvements: 56,
 *   entreesMois: 320000,
 *   sortiesMois: 210000,
 * };
 * ```
 */
export interface CaisseStats {
  soldeActuel: number;
  totalEntrees: number;
  totalSorties: number;
  nombreMouvements: number;
  entreesMois: number;
  sortiesMois: number;
}

/**
 * Tendances évolutives des indicateurs de caisse.
 *
 * @interface CaisseTrends
 * @property {number} soldeActuel - Variation du solde (en pourcentage)
 * @property {number} totalEntrees - Variation
 * @property {number} totalSorties - Variation
 * @property {number} entreesMois - Variation
 * @property {number} sortiesMois - Variation
 *
 * @example
 * ```ts
 * const trends: CaisseTrends = {
 *   soldeActuel: 8.5,
 *   totalEntrees: 12,
 *   totalSorties: -3,
 *   entreesMois: 5.2,
 *   sortiesMois: 7.4,
 * };
 * ```
 */
export interface CaisseTrends {
  soldeActuel: number;
  totalEntrees: number;
  totalSorties: number;
  entreesMois: number;
  sortiesMois: number;
}

// ============================================================
// CONFIGURATION DES COLONNES DU TABLEAU DE CAISSE
// ============================================================

/**
 * Configuration de visibilité des colonnes dans le tableau des mouvements de caisse.
 *
 * @interface CaisseColumnConfig
 * @property {boolean} [showDate] - Afficher la date du mouvement (défaut : true)
 * @property {boolean} [showType] - Afficher le type (entrée/sortie) avec badge (défaut : true)
 * @property {boolean} [showMontant] - Afficher le montant (défaut : true)
 * @property {boolean} [showSoldeApres] - Afficher le solde après le mouvement (défaut : true)
 * @property {boolean} [showDescription] - Afficher la description (défaut : true)
 * @property {boolean} [showReference] - Afficher la référence (défaut : false)
 * @property {boolean} [showActions] - Afficher le menu d’actions (défaut : false – la caisse est souvent non modifiable)
 *
 * @example
 * ```ts
 * const config: CaisseColumnConfig = {
 *   showDate: true,
 *   showType: true,
 *   showMontant: true,
 *   showSoldeApres: true,
 *   showDescription: true,
 *   showReference: true,
 *   showActions: false,
 * };
 * ```
 */
export interface CaisseColumnConfig {
  showDate?: boolean;
  showType?: boolean;
  showMontant?: boolean;
  showSoldeApres?: boolean;
  showDescription?: boolean;
  showReference?: boolean;
  showActions?: boolean;
}

/**
 * Callbacks d’actions sur une ligne du tableau de caisse.
 *
 * @interface CaisseTableActions
 * @property {(mouvement: MouvementCaisse) => void} [onView] - Voir le détail (lecture seule, pas d’édition)
 * @property {(mouvement: MouvementCaisse) => void} [onPrint] - Imprimer le reçu / justificatif
 *
 * @example
 * ```ts
 * const actions: CaisseTableActions = {
 *   onView: (m) => navigate(`/caisse/${m.id}`),
 *   onPrint: (m) => window.print(),
 * };
 * ```
 */
export interface CaisseTableActions {
  onView?: (mouvement: MouvementCaisse) => void;
  onPrint?: (mouvement: MouvementCaisse) => void;
}

/**
 * Options complètes pour la génération des colonnes du tableau de caisse.
 *
 * @interface CaisseColumnsOptions
 * @property {CaisseColumnConfig} [columnConfig] - Surcharge de la visibilité des colonnes
 * @property {CaisseTableActions} [actions] - Callbacks d’actions sur les lignes (généralement limités)
 * @property {'admin' | 'secretaire'} [variant] - Profil utilisateur
 *   - `admin` : affiche toutes les colonnes (y compris références et actions)
 *   - `secretaire` : colonnes standard (date, type, montant, solde, description)
 *
 * @example
 * ```ts
 * const options: CaisseColumnsOptions = {
 *   variant: 'secretaire',
 *   columnConfig: { showReference: true },
 *   actions: { onView: (m) => console.log(m) },
 * };
 * const columns = getCaisseColumns(options);
 * ```
 */
export interface CaisseColumnsOptions {
  columnConfig?: CaisseColumnConfig;
  actions?: CaisseTableActions;
  variant?: 'admin' | 'secretaire';
}
