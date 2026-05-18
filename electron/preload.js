/**
 * @fileoverview Preload Electron – pont IPC entre le renderer et le main process.
 *
 * @module electron/preload
 * @description
 * Expose l'API de l'application Auto-École COS au renderer via `contextBridge`.
 * Chaque namespace correspond à un domaine métier ; les méthodes délèguent
 * au main process via `ipcRenderer.invoke(channel, payload)`.
 *
 * ## Namespaces disponibles
 * - `api.auth`      — Authentification, sessions, permissions, OTP
 * - `api.candidats` — Candidats (CRUD, documents, relations paiements/leçons/examens)
 * - `api.documents` — Documents (upload, téléchargement, stats, sparklines)
 * - `api.paiements` — Paiements (CRUD, statistiques, sparklines, soldes candidats)
 *
 * @author Stive Junior
 * @version 3.0.0
 */

import { contextBridge, ipcRenderer } from 'electron';

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaire interne
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Invoque un canal IPC vers le main process.
 * @param {string} channel - Identifiant du canal (ex: 'auth:login')
 * @param {*} [payload] - Données à transmettre
 * @returns {Promise<*>} Réponse du main process
 */
const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload);

// ─────────────────────────────────────────────────────────────────────────────
// API complète
// ─────────────────────────────────────────────────────────────────────────────

const api = {
  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH — Authentification, utilisateurs, sessions, permissions, OTP
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * API d'authentification.
   * @see AuthApi (src/types/auth.types.ts)
   */
  auth: {
    /** Connecte un utilisateur et crée une session JWT. */
    login: (payload) => invoke('auth:login', payload),

    /** Déconnecte un utilisateur en invalidant sa session. */
    logout: (sessionId, userId) => invoke('auth:logout', { sessionId, userId }),

    /** Valide un token d'accès JWT et retourne les infos utilisateur. */
    validate: (token) => invoke('auth:validate', { token }),

    /** Rafraîchit un token d'accès à partir du refresh token. */
    refresh: (refreshToken) => invoke('auth:refresh', { refreshToken }),

    /** Crée un nouvel utilisateur (droits admin requis). */
    createUser: (payload) => invoke('auth:createUser', payload),

    /** Valide le code développeur pour accéder à l'initialisation. */
    verifyDeveloperSetupCode: (code) => invoke('auth:verifyDeveloperSetupCode', { code }),

    /** Crée l'entreprise et le premier administrateur du système. */
    createInitialSetup: (payload) => invoke('auth:createInitialSetup', payload),

    /** Met à jour les informations d'un utilisateur. */
    updateUser: (payload) => invoke('auth:updateUser', payload),

    /** Désactive (soft-delete) un compte utilisateur. */
    deleteUser: (userId, deletedByUserId) => invoke('auth:deleteUser', { userId, deletedByUserId }),

    /** Récupère la liste paginée des utilisateurs. */
    getAllUsers: (userId, page, limit) => invoke('auth:getAllUsers', { userId, page, limit }),

    /** Récupère les détails d'un utilisateur (permissions + sessions). */
    getUserById: (userId, requesterId) => invoke('auth:getUserById', { userId, requesterId }),

    /** Change le mot de passe d'un utilisateur (vérifie l'ancien). */
    changePassword: (userId, oldPassword, newPassword) =>
      invoke('auth:changePassword', { userId, oldPassword, newPassword }),

    /** Assigne une permission spécifique à un utilisateur. */
    assignPermission: (payload) => invoke('auth:assignPermission', payload),

    /** Révoque (désactive) une permission. */
    revokePermission: (permissionId, revokedByUserId) =>
      invoke('auth:revokePermission', { permissionId, revokedByUserId }),

    /** Récupère toutes les permissions actives d'un utilisateur. */
    getUserPermissions: (userId) => invoke('auth:getUserPermissions', { userId }),

    /** Vérifie si un utilisateur possède une permission donnée. */
    checkPermission: (userId, ressource, action) =>
      invoke('auth:checkPermission', { userId, ressource, action }),

    /** Liste toutes les sessions d'un utilisateur. */
    getUserSessions: (userId) => invoke('auth:getUserSessions', { userId }),

    /** Révoque une session spécifique (déconnexion forcée). */
    revokeSession: (sessionId, revokedByUserId) =>
      invoke('auth:revokeSession', { sessionId, revokedByUserId }),

    /** Révoque toutes les sessions actives d'un utilisateur. */
    revokeAllUserSessions: (userId, revokedByUserId) =>
      invoke('auth:revokeAllUserSessions', { userId, revokedByUserId }),

    /** Génère un code OTP de réinitialisation pour un email. */
    requestPasswordResetByEmail: (email, isAdmin) =>
      invoke('auth:requestPasswordResetByEmail', { email, isAdmin }),

    /** Valide un code OTP de réinitialisation. */
    validateResetCode: (code) => invoke('auth:validateResetCode', { code }),

    /** Réinitialise le mot de passe via un code OTP valide. */
    resetPassword: ({ code, newPassword }) => invoke('auth:resetPassword', { code, newPassword }),

    /** Récupère tous les codes de réinitialisation (admin). */
    getAllResetCodes: (userId, page, limit, onlyActive) =>
      invoke('auth:getAllResetCodes', { userId, page, limit, onlyActive }),

    /** Récupère les statistiques agrégées des utilisateurs. */
    getStats: () => invoke('auth:getStats'),

    /** Récupère les tendances évolutives des utilisateurs. */
    getTrends: () => invoke('auth:getTrends'),

    /** Récupère les données des sparklines pour les 12 derniers mois. */
    getSparklines: () => invoke('auth:getSparklines'),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CANDIDATS — CRUD, documents, relations (paiements, leçons, examens)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * API de gestion des candidats (élèves).
   * @see CandidatsApi (src/types/candidats.types.ts)
   */
  candidats: {
    /** Récupère la liste paginée avec filtres (statut, catégorie, search). */
    getAll: (params) => invoke('candidats:getAll', params),

    /** Récupère un candidat complet avec toutes ses relations. */
    getById: (id) => invoke('candidats:getById', id),

    /** Crée un nouveau candidat. */
    create: (data) => invoke('candidats:create', data),

    /** Met à jour les informations d'un candidat (patch partiel). */
    update: (id, data) => invoke('candidats:update', { id, data }),

    /** Supprime logiquement un candidat (soft-delete). */
    delete: (id) => invoke('candidats:delete', id),

    /** Recherche de candidats par nom, prénom, email ou numéro de permis. */
    search: (query) => invoke('candidats:search', query),

    /** Met à jour uniquement le statut d'un candidat. */
    updateStatus: (params) => invoke('candidats:updateStatus', params),

    /** Récupère les statistiques agrégées des candidats (dashboard). */
    getStats: () => invoke('candidats:getStats'),

    /**  */
    getTrends: () => ipcRenderer.invoke('candidats:getTrends'),

    /** Récupère tous les paiements d'un candidat. */
    getPaiements: (candidatId) => invoke('candidats:getPaiements', candidatId),

    /** Récupère toutes les leçons d'un candidat (avec moniteur et véhicule). */
    getLecons: (candidatId) => invoke('candidats:getLecons', candidatId),

    /** Récupère tous les examens d'un candidat. */
    getExamens: (candidatId) => invoke('candidats:getExamens', candidatId),

    /** Récupère toutes les factures d'un candidat. */
    getFactures: (candidatId) => invoke('candidats:getFactures', candidatId),

    /** Récupère tous les documents scannés d'un candidat. */
    getDocuments: (candidatId) => invoke('candidats:getDocuments', candidatId),

    /** Ajoute un document à un candidat. */
    addDocument: (data) => invoke('candidats:addDocument', data),

    /** Supprime définitivement un document. */
    deleteDocument: (docId) => invoke('candidats:deleteDocument', docId),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCUMENTS — Upload, téléchargement, statistiques, sparklines
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * API de gestion documentaire.
   * @see DocumentsApi (src/types/documents.types.ts)
   */
  documents: {
    /** Récupère la liste paginée des documents avec filtres. */
    getAll: (params) => invoke('documents:getAll', params),

    /** Récupère un document par son identifiant. */
    getById: (id) => invoke('documents:getById', id),

    /** Récupère les statistiques agrégées (total, taille, par type). */
    getStats: () => invoke('documents:getStats'),

    /** Récupère les tendances évolutives (mois courant vs précédent). */
    getTrends: () => invoke('documents:getTrends'),

    /** Récupère les données des sparklines (12 mois). */
    getSparklines: () => invoke('documents:getSparklines'),

    /** Supprime définitivement un document. */
    delete: (id) => invoke('documents:delete', id),

    /** Déclenche le téléchargement d'un document. */
    download: (id) => invoke('documents:download', id),

    /** Ouvre un document avec l'application par défaut du système. */
    open: (chemin) => invoke('documents:open', { chemin }),

    /** Téléverse un nouveau document (buffer + métadonnées). */
    upload: (data) => invoke('documents:upload', data),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PAIEMENTS — Encaissements, statistiques, soldes candidats
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * API de gestion des paiements (encaissements).
   * @see PaiementsApi (src/types/paiements.types.ts)
   */
  paiements: {
    /**
     * Récupère la liste paginée des paiements avec filtres optionnels.
     * @param {PaiementsListParams} [params] - Pagination, filtres mode/period/candidatId, tri
     * @returns {Promise<PaiementsPaginatedResponse>}
     */
    getAll: (params) => invoke('paiements:getAll', params),

    /**
     * Récupère un paiement par son identifiant avec candidat + facture chargés.
     * @param {number} id
     * @returns {Promise<Paiement>}
     */
    getById: (id) => invoke('paiements:getById', id),

    /**
     * Crée un nouveau paiement et met à jour la caisse automatiquement.
     * @param {CreatePaiementInput} data
     * @returns {Promise<Paiement>}
     */
    create: (data) => invoke('paiements:create', data),

    /**
     * Met à jour un paiement existant (patch partiel).
     * @param {number} id
     * @param {UpdatePaiementInput} data
     * @returns {Promise<Paiement>}
     */
    update: (id, data) => invoke('paiements:update', { id, data }),

    /**
     * Supprime définitivement un paiement.
     * @param {number} id
     * @returns {Promise<{ success: boolean; message: string }>}
     */
    delete: (id) => invoke('paiements:delete', id),

    /**
     * Récupère les statistiques agrégées complètes (dashboard).
     * @returns {Promise<PaiementsStatsExtended>}
     */
    getStats: () => invoke('paiements:getStats'),

    /**
     * Récupère les tendances (mois courant vs mois précédent).
     * @returns {Promise<PaiementsTrends>}
     */
    getTrends: () => invoke('paiements:getTrends'),

    /**
     * Récupère les données des sparklines pour les 12 derniers mois.
     * @returns {Promise<PaiementsSparklineData>}
     */
    getSparklines: () => invoke('paiements:getSparklines'),

    /**
     * Récupère tous les paiements d'un candidat.
     * @param {number} candidatId
     * @returns {Promise<Paiement[]>}
     */
    getByCandidat: (candidatId) => invoke('paiements:getByCandidat', candidatId),

    /**
     * Calcule le solde d'un candidat (totalFacturé - totalPayé).
     * @param {number} candidatId
     * @returns {Promise<SoldeCandidat>}
     */
    getSoldeCandidat: (candidatId) => invoke('paiements:getSoldeCandidat', candidatId),

    /**
     * Récupère le résumé mensuel des paiements pour un mois/année donnés.
     * @param {number} annee - Ex: 2025
     * @param {number} mois  - Ex: 5 (= mai)
     * @returns {Promise<ResumeMensuel>}
     */
    getResumeMensuel: (annee, mois) => invoke('paiements:getResumeMensuel', { annee, mois }),

    /**
     * Exporte le reçu d'un paiement en PDF et retourne le chemin du fichier.
     * @param {number} id
     * @returns {Promise<{ success: boolean; path?: string; message?: string }>}
     */
    printReceipt: (id) => invoke('paiements:printReceipt', id),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DEPENSES — Gestion des dépenses (sorties d’argent)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * API de gestion des dépenses.
   * @see DepensesApi (src/types/depenses.types.ts)
   */
  depenses: {
    /**
     * Récupère la liste paginée des dépenses avec filtres.
     * @param {DepensesListParams} [params] - Pagination, filtres, tri
     * @returns {Promise<DepensesPaginatedResponse>}
     */
    getAll: (params) => invoke('depenses:getAll', params),

    /**
     * Récupère une dépense par son identifiant.
     * @param {number} id
     * @returns {Promise<Depense>}
     */
    getById: (id) => invoke('depenses:getById', id),

    /**
     * Crée une nouvelle dépense.
     * @param {CreateDepenseInput} data
     * @returns {Promise<Depense>}
     */
    create: (data) => invoke('depenses:create', data),

    /**
     * Met à jour une dépense existante.
     * @param {number} id
     * @param {UpdateDepenseInput} data
     * @returns {Promise<Depense>}
     */
    update: (id, data) => invoke('depenses:update', { id, data }),

    /**
     * Supprime définitivement une dépense.
     * @param {number} id
     * @returns {Promise<{ success: boolean; message: string }>}
     */
    delete: (id) => invoke('depenses:delete', id),

    /**
     * Récupère les statistiques agrégées des dépenses.
     * @returns {Promise<DepensesStatsExtended>}
     */
    getStats: () => invoke('depenses:getStats'),

    /**
     * Récupère les tendances évolutives.
     * @returns {Promise<DepensesTrends>}
     */
    getTrends: () => invoke('depenses:getTrends'),

    /**
     * Récupère les données des sparklines (12 mois).
     * @returns {Promise<DepensesSparklineData>}
     */
    getSparklines: () => invoke('depenses:getSparklines'),

    /**
     * Récupère les données pour le graphique de tendance des dépenses par catégorie.
     * @returns {Promise<DepensesTrendChartData>}
     */
    getTrendChartData: () => invoke('depenses:getTrendChartData'),

    /**
     * Récupère toutes les dépenses d’un véhicule.
     * @param {number} vehiculeId
     * @returns {Promise<Depense[]>}
     */
    getByVehicule: (vehiculeId) => invoke('depenses:getByVehicule', vehiculeId),

    /**
     * Joint un reçu (PDF) à une dépense.
     * @param {number} id
     * @param {string} filePath
     * @returns {Promise<{ success: boolean; message: string }>}
     */
    attachReceipt: (id, filePath) => invoke('depenses:attachReceipt', { id, filePath }),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CAISSE — Consultation des mouvements de trésorerie (lecture seule)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * API de consultation de la caisse (mouvements, statistiques, tendances, sparklines).
   * @see CaisseApi (src/types/caisse.types.ts)
   */
  caisse: {
    /**
     * Récupère la liste paginée des mouvements de caisse avec filtres.
     * @param {CaisseListParams} [params] - Pagination, filtres (type, période)
     * @returns {Promise<CaissePaginatedResponse>}
     */
    getAll: (params) => invoke('caisse:getAll', params),

    /**
     * Récupère les statistiques agrégées de la caisse.
     * @returns {Promise<CaisseStatsExtended>}
     */
    getStats: () => invoke('caisse:getStats'),

    /**
     * Récupère les tendances évolutives (mois vs précédent).
     * @returns {Promise<CaisseTrends>}
     */
    getTrends: () => invoke('caisse:getTrends'),

    /**
     * Récupère les données des sparklines pour les 12 derniers mois.
     * @returns {Promise<CaisseSparklineData>}
     */
    getSparklines: () => invoke('caisse:getSparklines'),

    /**
     * Exporte l’historique des mouvements (CSV, Excel, PDF).
     * @param {CaisseListParams} [params] - Filtres pour l’export
     * @returns {Promise<{ success: boolean; path: string; message?: string }>}
     */
    exportMouvements: (params) => invoke('caisse:exportMouvements', params),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FACTURES — Gestion des factures, PDF, envoi par email
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * API de gestion des factures.
   * @see FacturesApi (src/types/factures.types.ts)
   */
  factures: {
    /**
     * Récupère la liste paginée des factures avec filtres.
     * @param {FacturesListParams} [params] - Pagination, filtres (statut, candidat, période)
     * @returns {Promise<FacturesPaginatedResponse>}
     */
    getAll: (params) => invoke('factures:getAll', params),

    /**
     * Récupère une facture par son identifiant (avec candidat et paiements).
     * @param {number} id
     * @returns {Promise<Facture & { paiements?: Paiement[]; candidat?: Candidat }>}
     */
    getById: (id) => invoke('factures:getById', id),

    /**
     * Crée une nouvelle facture (génère le numéro et le PDF).
     * @param {CreateFactureInput} data
     * @returns {Promise<Facture>}
     */
    create: (data) => invoke('factures:create', data),

    /**
     * Met à jour partiellement une facture (statut, échéance, notes).
     * @param {number} id
     * @param {UpdateFactureInput} data
     * @returns {Promise<Facture>}
     */
    update: (id, data) => invoke('factures:update', { id, data }),

    /**
     * Supprime définitivement une facture (uniquement si aucun paiement associé).
     * @param {number} id
     * @returns {Promise<{ success: boolean; message: string }>}
     */
    delete: (id) => invoke('factures:delete', id),

    /**
     * Récupère les statistiques agrégées des factures.
     * @returns {Promise<FacturesStatsExtended>}
     */
    getStats: () => invoke('factures:getStats'),

    /**
     * Récupère les tendances évolutives (mois vs précédent).
     * @returns {Promise<FacturesTrends>}
     */
    getTrends: () => invoke('factures:getTrends'),

    /**
     * Récupère les données des sparklines (12 mois) pour les factures.
     * @returns {Promise<FacturesSparklineData>}
     */
    getSparklines: () => invoke('factures:getSparklines'),

    /**
     * Récupère la liste des paiements associés à une facture.
     * @param {number} factureId
     * @returns {Promise<Paiement[]>}
     */
    getPaiements: (factureId) => invoke('factures:getPaiements', factureId),

    /**
     * Récupère toutes les factures d’un candidat.
     * @param {number} candidatId
     * @returns {Promise<Facture[]>}
     */
    getByCandidat: (candidatId) => invoke('factures:getByCandidat', candidatId),

    /**
     * Génère (ou régénère) le PDF d’une facture.
     * @param {number} id
     * @returns {Promise<{ success: boolean; path: string; message?: string }>}
     */
    generatePDF: (id) => invoke('factures:generatePDF', id),

    /**
     * Envoie la facture par email au candidat.
     * @param {number} id
     * @returns {Promise<{ success: boolean; message: string }>}
     */
    sendByEmail: (id) => invoke('factures:sendByEmail', id),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FORMATIONS — CRUD, statistiques, tendances, popularité
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * API de gestion des formations.
   * @see FormationsApi (src/types/formations.types.ts)
   */
  formations: {
    /**
     * Récupère la liste paginée des formations avec filtres optionnels (search, catégorie, durée).
     * @param {FormationsListParams} [params] - Pagination, filtres, tri
     * @returns {Promise<FormationsPaginatedResponse>}
     */
    getAll: (params) => invoke('formations:getAll', params),

    /**
     * Récupère une formation par son identifiant avec tous les candidats inscrits.
     * @param {number} id
     * @returns {Promise<Formation>}
     */
    getById: (id) => invoke('formations:getById', id),

    /**
     * Crée une nouvelle formation.
     * @param {CreateFormationInput} data
     * @returns {Promise<Formation>}
     */
    create: (data) => invoke('formations:create', data),

    /**
     * Met à jour une formation existante (patch partiel).
     * @param {number} id
     * @param {UpdateFormationInput} data
     * @returns {Promise<Formation>}
     */
    update: (id, data) => invoke('formations:update', { id, data }),

    /**
     * Supprime définitivement une formation.
     * @param {number} id
     * @returns {Promise<{ success: boolean; message: string }>}
     */
    delete: (id) => invoke('formations:delete', id),

    /**
     * Récupère les statistiques agrégées des formations (nombre d'inscriptions, popularité, etc.).
     * @returns {Promise<FormationsStats>}
     */
    getStats: () => invoke('formations:getStats'),

    /**
     * Récupère les tendances des formations (évolution du nombre d'inscriptions, etc.).
     * @returns {Promise<FormationsTrends>}
     */
    getTrends: () => invoke('formations:getTrends'),

    /**
     * Récupère les données des sparklines pour les formations (ex: nombre d'inscriptions par mois sur 12 mois).
     * @returns {Promise<FormationsSparklines>}
     */
    getSparklines: () => invoke('formations:getSparklines'),

    /**
     * Récupère le nombre d'inscriptions mensuelles pour une formation donnée.
     * @param {number} formationId
     * @returns {Promise<MonthlyInscriptions>}
     */
    getMonthlyInscriptions: (formationId) =>
      invoke('formations:getMonthlyInscriptions', formationId),

    /**
     * Récupère la liste de tous les candidats inscrits à une formation spécifique.
     * @param {number} formationId
     *
     */
    getCandidatsByFormation: (formationId) =>
      invoke('formations:getCandidatsByFormation', formationId),

    /**
     * Récupère les statistiques de popularité pour toutes les formations.
     * @returns {Promise<FormationsPopularityStats>}
     */
    getPopularityStats: () => invoke('formations:getPopularityStats'),

    /**
     * Récupère le nombre total d'inscriptions pour une formation donnée.
     * @param {number} formationId
     * @returns {Promise<number>}
     */
    getNbInscriptions: (formationId) => invoke('formations:getNbInscriptions', formationId),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VEHICULES — Gestion du parc automobile, entretiens, kilométrage
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * API de gestion des véhicules et de leurs entretiens.
   * @see VehiculesApi (src/types/vehicules.types.ts)
   */
  vehicules: {
    /**
     * Récupère la liste paginée des véhicules avec filtres.
     * @param {VehiculesListParams} [params] - Pagination, filtres (categorie, statut, search)
     * @returns {Promise<VehiculesPaginatedResponse>}
     */
    getAll: (params) => invoke('vehicules:getAll', params),

    /**
     * Récupère un véhicule par son identifiant avec toutes ses relations (entretiens, leçons, dépenses).
     * @param {number} id
     * @returns {Promise<Vehicule>}
     */
    getById: (id) => invoke('vehicules:getById', id),

    /**
     * Crée un nouveau véhicule.
     * @param {CreateVehiculeInput} data
     * @returns {Promise<Vehicule>}
     */
    create: (data) => invoke('vehicules:create', data),

    /**
     * Met à jour un véhicule existant (patch partiel).
     * @param {number} id
     * @param {UpdateVehiculeInput} data
     * @returns {Promise<Vehicule>}
     */
    update: (id, data) => invoke('vehicules:update', { id, data }),

    /**
     * Supprime (désactive) un véhicule.
     * @param {number} id
     * @returns {Promise<{ success: boolean; message: string }>}
     */
    delete: (id) => invoke('vehicules:delete', id),

    /**
     * Récupère les statistiques agrégées complètes des véhicules.
     * @returns {Promise<VehiculesStatsExtended>}
     */
    getStats: () => invoke('vehicules:getStats'),

    /**
     * Récupère les tendances évolutives (mois vs précédent).
     * @returns {Promise<VehiculesTrends>}
     */
    getTrends: () => invoke('vehicules:getTrends'),

    /**
     * Récupère les données des sparklines pour les 12 derniers mois.
     * @returns {Promise<VehiculesSparklineData>}
     */
    getSparklines: () => invoke('vehicules:getSparklines'),

    /**
     * Récupère tous les entretiens d’un véhicule.
     * @param {number} vehiculeId
     * @returns {Promise<Entretien[]>}
     */
    getEntretiensByVehicule: (vehiculeId) =>
      invoke('vehicules:getEntretiensByVehicule', vehiculeId),

    /**
     * Enregistre un nouvel entretien pour un véhicule.
     * @param {CreateEntretienInput} data
     * @returns {Promise<Entretien>}
     */
    createEntretien: (data) => invoke('vehicules:createEntretien', data),

    /**
     * Met à jour un entretien existant.
     * @param {number} id
     * @param {UpdateEntretienInput} data
     * @returns {Promise<Entretien>}
     */
    updateEntretien: (id, data) => invoke('vehicules:updateEntretien', { id, data }),

    /**
     * Supprime un entretien.
     * @param {number} id
     * @returns {Promise<{ success: boolean; message: string }>}
     */
    deleteEntretien: (id) => invoke('vehicules:deleteEntretien', id),

    /**
     * Met à jour le kilométrage d’un véhicule.
     * @param {UpdateKilometrageInput} data
     * @returns {Promise<Vehicule>}
     */
    updateKilometrage: (data) => invoke('vehicules:updateKilometrage', data),

    /**
     * Vérifie si une immatriculation est unique (pour validation formulaire).
     * @param {string} immatriculation - Plaque à vérifier
     * @param {number} [excludeId] - Identifiant du véhicule à exclure (pour modification)
     * @returns {Promise<boolean>}
     */
    isImmatriculationUnique: (immatriculation, excludeId) =>
      invoke('vehicules:isImmatriculationUnique', { immatriculation, excludeId }),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PLANNING (LEÇONS) — Gestion des leçons de conduite et de code
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * API de gestion des leçons (planning).
   * @see LeconsApi (src/types/planning.types.ts)
   */
  planning: {
    /**
     * Récupère la liste paginée des leçons avec filtres optionnels.
     * @param {LeconsListParams} [params] - Pagination, filtres (date, moniteur, candidat, type, statut) et tri
     * @returns {Promise<LeconsPaginatedResponse>}
     */
    getAll: (params) => invoke('planning:getAll', params),

    /**
     * Récupère une leçon par son identifiant avec toutes ses relations.
     * @param {number} id - Identifiant de la leçon
     * @returns {Promise<Lecon>}
     */
    getById: (id) => invoke('planning:getById', id),

    /**
     * Crée une nouvelle leçon (réserve un créneau).
     * @param {CreateLeconInput} data - Données de la leçon (candidatId, moniteurId, date, duree, type, vehiculeId optionnel)
     * @returns {Promise<Lecon>}
     */
    create: (data) => invoke('planning:create', data),

    /**
     * Met à jour une leçon existante (date, duree, type, statut, notes, véhicule).
     * @param {number} id - Identifiant de la leçon
     * @param {UpdateLeconInput} data - Champs à modifier
     * @returns {Promise<Lecon>}
     */
    update: (id, data) => invoke('planning:update', { id, data }),

    /**
     * Supprime définitivement une leçon.
     * @param {number} id - Identifiant de la leçon
     * @returns {Promise<{ success: boolean; message: string }>}
     */
    delete: (id) => invoke('planning:delete', id),

    /**
     * Récupère les statistiques agrégées des leçons (dashboard).
     * @returns {Promise<LeconsStatsExtended>}
     */
    getStats: () => invoke('planning:getStats'),

    /**
     * Récupère les tendances évolutives (mois vs précédent).
     * @returns {Promise<LeconsTrends>}
     */
    getTrends: () => invoke('planning:getTrends'),

    /**
     * Récupère les données des sparklines pour les 12 derniers mois.
     * @returns {Promise<LeconsSparklineData>}
     */
    getSparklines: () => invoke('planning:getSparklines'),

    /**
     * Récupère toutes les leçons d’un candidat spécifique.
     * @param {number} candidatId
     * @returns {Promise<Lecon[]>}
     */
    getByCandidat: (candidatId) => invoke('planning:getByCandidat', candidatId),

    /**
     * Récupère toutes les leçons d’un moniteur spécifique.
     * @param {number} moniteurId
     * @returns {Promise<Lecon[]>}
     */
    getByMoniteur: (moniteurId) => invoke('planning:getByMoniteur', moniteurId),

    /**
     * Récupère toutes les leçons d’un véhicule spécifique.
     * @param {number} vehiculeId
     * @returns {Promise<Lecon[]>}
     */
    getByVehicule: (vehiculeId) => invoke('planning:getByVehicule', vehiculeId),

    /**
     * Récupère les leçons pour une période donnée (calendrier).
     * @param {Date|string} startDate - Date de début (inclus)
     * @param {Date|string} endDate - Date de fin (inclus)
     * @param {number} [moniteurId] - Optionnel : filtrer par moniteur
     * @returns {Promise<Lecon[]>}
     */
    getBetweenDates: (startDate, endDate, moniteurId) =>
      invoke('planning:getBetweenDates', { startDate, endDate, moniteurId }),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MONITEURS — Gestion des instructeurs
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * API de gestion des moniteurs (instructeurs).
   * @see MoniteursApi (src/types/moniteurs.types.ts)
   */
  moniteurs: {
    /**
     * Récupère la liste paginée des moniteurs avec filtres optionnels.
     * @param {MoniteursListParams} [params] - Pagination, filtres (search, actif)
     * @returns {Promise<MoniteursPaginatedResponse>}
     */
    getAll: (params) => invoke('moniteurs:getAll', params),

    /**
     * Récupère un moniteur par son identifiant (avec ses leçons).
     * @param {number} id
     * @returns {Promise<Moniteur>}
     */
    getById: (id) => invoke('moniteurs:getById', id),

    /**
     * Crée un nouveau moniteur.
     * @param {CreateMoniteurInput} data - Données du moniteur (nom, prenom, email, telephone, specialite, dateEmbauche)
     * @returns {Promise<Moniteur>}
     */
    create: (data) => invoke('moniteurs:create', data),

    /**
     * Met à jour un moniteur existant (patch partiel).
     * @param {number} id
     * @param {UpdateMoniteurInput} data
     * @returns {Promise<Moniteur>}
     */
    update: (id, data) => invoke('moniteurs:update', { id, data }),

    /**
     * Désactive (soft delete) un moniteur.
     * @param {number} id
     * @returns {Promise<{ success: boolean; message: string }>}
     */
    delete: (id) => invoke('moniteurs:delete', id),

    /**
     * Récupère les statistiques agrégées des moniteurs.
     * @returns {Promise<MoniteursStatsExtended>}
     */
    getStats: () => invoke('moniteurs:getStats'),

    /**
     * Récupère les tendances évolutives (mois vs précédent).
     * @returns {Promise<MoniteursTrends>}
     */
    getTrends: () => invoke('moniteurs:getTrends'),

    /**
     * Récupère les données des sparklines pour les 12 derniers mois.
     * @returns {Promise<MoniteursSparklineData>}
     */
    getSparklines: () => invoke('moniteurs:getSparklines'),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXAMENS — Gestion des examens (code et conduite)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * API de gestion des examens.
   * @see ExamensApi (src/types/examens.types.ts)
   */
  examens: {
    /**
     * Récupère la liste paginée des examens avec filtres.
     * @param {ExamensListParams} [params] - Pagination, filtres (type, resultat, candidatId, période) et tri
     * @returns {Promise<ExamensPaginatedResponse>}
     */
    getAll: (params) => invoke('examens:getAll', params),

    /**
     * Récupère un examen par son identifiant (avec candidat).
     * @param {number} id
     * @returns {Promise<Examen>}
     */
    getById: (id) => invoke('examens:getById', id),

    /**
     * Crée un nouvel examen.
     * @param {CreateExamenInput} data - Date, type, candidatId, centre (optionnel), notes (optionnel)
     * @returns {Promise<Examen>}
     */
    create: (data) => invoke('examens:create', data),

    /**
     * Met à jour un examen existant (résultat, note, date, centre, notes).
     * @param {number} id
     * @param {UpdateExamenInput} data
     * @returns {Promise<Examen>}
     */
    update: (id, data) => invoke('examens:update', { id, data }),

    /**
     * Supprime définitivement un examen.
     * @param {number} id
     * @returns {Promise<{ success: boolean; message: string }>}
     */
    delete: (id) => invoke('examens:delete', id),

    /**
     * Récupère les statistiques agrégées des examens.
     * @returns {Promise<ExamensStatsExtended>}
     */
    getStats: () => invoke('examens:getStats'),

    /**
     * Récupère les tendances évolutives (mois vs précédent).
     * @returns {Promise<ExamensTrends>}
     */
    getTrends: () => invoke('examens:getTrends'),

    /**
     * Récupère les données des sparklines pour les 12 derniers mois.
     * @returns {Promise<ExamensSparklineData>}
     */
    getSparklines: () => invoke('examens:getSparklines'),

    /**
     * Récupère tous les examens d’un candidat.
     * @param {number} candidatId
     * @returns {Promise<Examen[]>}
     */
    getByCandidat: (candidatId) => invoke('examens:getByCandidat', candidatId),

    /**
     * Génère / imprime l’attestation (certificat) pour un examen réussi.
     * @param {number} id
     * @returns {Promise<{ success: boolean; path?: string; message?: string }>}
     */
    printCertificate: (id) => invoke('examens:printCertificate', id),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN — Logs d'audit et configuration entreprise
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * API d'administration.
   * @see AdminApi {@link src/types/admin.types.ts}
   */
  admin: {
    /**
     * Récupère la liste paginée des logs d'audit avec filtres.
     * @param {AuditLogsListParams} [params] - Pagination et filtres
     * @returns {Promise<AuditLogsPaginatedResponse>}
     */
    getAuditLogs: (params) => invoke('admin:getAuditLogs', params),

    /**
     * Récupère les statistiques agrégées des logs d'audit.
     * @returns {Promise<AdminStats>}
     */
    getAdminStats: () => invoke('admin:getAdminStats'),

    /**
     * Récupère les tendances évolutives des logs d'audit.
     * @returns {Promise<AdminTrends>}
     */
    getAdminTrends: () => invoke('admin:getAdminTrends'),

    /**
     * Récupère la configuration actuelle de l'entreprise.
     * @returns {Promise<CompanyConfig>}
     */
    getCompanyConfig: () => invoke('admin:getCompanyConfig'),

    /**
     * Met à jour la configuration de l'entreprise.
     * @param {UpdateCompanyConfigInput} data - Champs à modifier
     * @returns {Promise<CompanyConfig>}
     */
    updateCompanyConfig: (data) => invoke('admin:updateCompanyConfig', data),
  },

  globalSearch: {
    search: (query) => invoke('globalSearch:search', query),
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Exposition via contextBridge
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Expose l'API complète au renderer sous `window.api`.
 * @see https://www.electronjs.org/docs/latest/api/context-bridge
 */
contextBridge.exposeInMainWorld('api', api);
