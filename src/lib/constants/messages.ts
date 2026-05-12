/**
 * @module lib/constants/messages
 * @description Messages statiques pour l'application  Auto-École COS
 * @author Stive Junior
 * @version 1.0.0
 *
 * Ce module contient TOUS les messages utilisés dans l'application :
 * - Messages d'erreur (API, validation, réseau, authentification, etc.)
 * - Messages de succès (opérations réussies)
 * - Messages d'information et de confirmation
 * - Placeholders de formulaires
 * - Labels d'interface utilisateur
 * - Notifications et toasts
 *
 * Chaque message est défini sous une clé descriptive pour faciliter les traductions futures.
 * Aucune chaîne de caractères en dur ne doit exister ailleurs dans l'application.
 */

// ============================================================
// ERREURS GÉNÉRIQUES
// ============================================================

/**
 * Messages d'erreurs génériques (non spécifiques à un domaine)
 * @constant GENERIC_ERRORS
 */
export const GENERIC_ERRORS = {
  /** Erreur inattendue par défaut */
  UNKNOWN: 'Une erreur inattendue est survenue. Veuillez réessayer plus tard.',
  /** Erreur réseau / connexion perdue */
  NETWORK: 'Impossible de contacter le serveur. Vérifiez votre connexion internet.',
  /** Timeout de la requête */
  TIMEOUT: 'Le serveur met trop de temps à répondre. Veuillez réessayer.',
  /** Ressource non trouvée (404) */
  NOT_FOUND: "La ressource demandée n'existe pas ou a été déplacée.",
  /** Méthode non autorisée (405) */
  METHOD_NOT_ALLOWED: 'Action non autorisée sur cette ressource.',
  /** Erreur interne du serveur (500) */
  SERVER_ERROR: 'Le serveur a rencontré une erreur interne. Nos équipes ont été averties.',
  /** Service indisponible (503) */
  SERVICE_UNAVAILABLE: 'Le service est temporairement indisponible. Revenez plus tard.',
  /** Requête non autorisée (403) */
  FORBIDDEN: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
  /** Non authentifié (401) */
  UNAUTHORIZED: 'Veuillez vous connecter pour accéder à cette ressource.',
} as const;

// ============================================================
// ERREURS D'AUTHENTIFICATION
// ============================================================

/**
 * Messages d'erreur liés à l'authentification (login, register, tokens)
 * @constant AUTH_ERRORS
 */
export const AUTH_ERRORS = {
  // Connexion
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect.',
  EMAIL_NOT_CONFIRMED: 'Veuillez vérifier votre adresse email avant de vous connecter.',
  ACCOUNT_DISABLED: 'Ce compte a été désactivé. Contactez le support client.',
  TOO_MANY_ATTEMPTS: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',

  // Inscription
  EMAIL_ALREADY_EXISTS: 'Un compte avec cette adresse email existe déjà.',
  MAJ_PASSWORD: 'Minimum une majuscule',
  MIN_PASSWORD: 'Minimum une miniscule',
  NUMBER_PASSWORD: 'Minimum un chiffre',
  SPECIAL_PASSWORD: 'Minimun un caractère spécial',
  WEAK_PASSWORD:
    'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.',
  PASSWORD_MISMATCH: 'Les mots de passe ne correspondent pas.',
  REGISTRATION_FAILED: "L'inscription a échoué. Veuillez vérifier les informations fournies.",
  OLD_PASSWORD_SAME_AS_NEW: 'Le nouveau mot de passe doit être différent de l’ancien.',

  // Tokens
  TOKEN_EXPIRED: 'Votre session a expiré. Veuillez vous reconnecter.',
  TOKEN_INVALID: "Le jeton d'authentification est invalide.",
  TOKEN_MISSING: "Jeton d'authentification manquant. Veuillez vous reconnecter.",
  REFRESH_TOKEN_FAILED: 'Impossible de renouveler votre session. Veuillez vous reconnecter.',

  // OTP / vérification email
  OTP_INVALID: 'Le code de vérification est incorrect.',
  OTP_EXPIRED: 'Le code de vérification a expiré. Demandez-en un nouveau.',
  OTP_SEND_FAILED: "Impossible d'envoyer le code de vérification. Réessayez.",
  EMAIL_VERIFICATION_FAILED:
    "La vérification de l'email a échoué. Le lien est peut-être invalide ou expiré.",

  // Réinitialisation mot de passe
  RESET_PASSWORD_FAILED: 'La réinitialisation du mot de passe a échoué. Vérifiez le lien.',
  FORGOT_PASSWORD_FAILED:
    'Aucun compte trouvé avec cet email ou le service est temporairement indisponible.',
} as const;

// ============================================================
// ERREURS DE VALIDATION (formulaires)
// ============================================================

/**
 * Messages d'erreur pour la validation des champs de formulaire.
 * @constant VALIDATION_ERRORS
 */
export const VALIDATION_ERRORS = {
  // Champs requis
  REQUIRED: 'Ce champ est requis.',
  REQUIRED_SELECT: 'Veuillez sélectionner une option.',
  REQUIRED_CHECKBOX: 'Vous devez cocher cette case pour continuer.',

  // Formats spécifiques
  INVALID_EMAIL: 'Veuillez entrer une adresse email valide (ex: nom@domaine.com).',
  INVALID_PHONE: 'Numéro de téléphone invalide (ex: +237 6XX XXX XXX).',
  INVALID_DATE: 'Date invalide. Utilisez le format JJ/MM/AAAA.',
  INVALID_TIME: 'Heure invalide. Utilisez le format HH:MM.',
  INVALID_URL: 'Veuillez entrer une URL valide (commençant par http:// ou https://).',
  INVALID_NUMBER: 'Veuillez entrer un nombre valide.',
  INVALID_INTEGER: 'Veuillez entrer un nombre entier.',
  INVALID_DECIMAL: 'Veuillez entrer un nombre décimal (utilisez le point).',

  // Longueurs
  TOO_SHORT: (min: number) => `Ce champ doit contenir au moins ${min} caractères.`,
  TOO_LONG: (max: number) => `Ce champ ne peut pas dépasser ${max} caractères.`,
  MIN_VALUE: (min: number) => `La valeur minimale autorisée est ${min}.`,
  MAX_VALUE: (max: number) => `La valeur maximale autorisée est ${max}.`,
  POSITIVE: 'Veuillez entrer une valeur positive.',
  NEGATIVE: 'Veuillez entrer une valeur négative.',
  AGE_LIMIT: 'L’âge doit être compris entre 0 et 120 ans.',

  // Correspondances
  PASSWORDS_DO_NOT_MATCH: 'Les mots de passe ne correspondent pas.',
  OLD_PASSWORD_SAME_AS_NEW: 'Le nouveau mot de passe doit être différent de l’ancien.',
  FIELD_MISMATCH: 'Les valeurs ne correspondent pas.',

  // Contraintes métier
  FUTURE_DATE_ONLY: 'La date doit être dans le futur.',
  PAST_DATE_ONLY: 'La date doit être dans le passé.',
  AGE_RESTRICTION: (age: number) => `Vous devez avoir au moins ${age} ans.`,
  UNIQUE_EMAIL: 'Cet email est déjà utilisé par un autre compte.',
  UNIQUE_USERNAME: "Ce nom d'utilisateur est déjà pris.",
} as const;

// ============================================================
// MESSAGES DE SUCCÈS
// ============================================================

/**
 * Messages de succès pour les opérations courantes.
 * @constant SUCCESS_MESSAGES
 */
export const SUCCESS_MESSAGES = {
  // Authentification
  LOGIN_SUCCESS: 'Connexion réussie. Bienvenue !',
  LOGOUT_SUCCESS: 'Vous avez été déconnecté avec succès.',
  REGISTER_SUCCESS: 'Inscription réussie ! Un email de vérification vous a été envoyé.',
  EMAIL_VERIFIED: 'Votre email a été vérifié. Vous pouvez maintenant vous connecter.',
  PASSWORD_RESET_SUCCESS:
    'Votre mot de passe a été réinitialisé. Connectez-vous avec votre nouveau mot de passe.',
  FORGOT_PASSWORD_EMAIL_SENT:
    'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.',

  // Opérations CRUD
  CREATE_SUCCESS: (entity: string) => `${entity} créé(e) avec succès.`,
  UPDATE_SUCCESS: (entity: string) => `${entity} mis(e) à jour avec succès.`,
  DELETE_SUCCESS: (entity: string) => `${entity} supprimé(e) avec succès.`,
  SAVE_SUCCESS: (entity: string) => `${entity} enregistré(e) avec succès.`,
  COPY_SUCCESS: (text: string) => `${text} copié dans le presse-papiers.`,

  // Rendez-vous & prescriptions
  APPOINTMENT_BOOKED: 'Votre rendez-vous a été confirmé.',
  APPOINTMENT_CANCELLED: 'Rendez-vous annulé avec succès.',
  APPOINTMENT_RESCHEDULED: 'Le rendez-vous a été reprogrammé.',
  PRESCRIPTION_CREATED: 'Ordonnance créée et envoyée au patient.',
  PRESCRIPTION_UPDATED: 'Ordonnance mise à jour.',
  PRESCRIPTION_VALIDATED: 'Ordonnance validée avec succès.',

  // Profil utilisateur
  PROFILE_UPDATED: 'Votre profil a été mis à jour.',
  AVATAR_UPDATED: 'Photo de profil modifiée avec succès.',
  PASSWORD_CHANGED: 'Votre mot de passe a été modifié.',

  // Actions diverses
  FORM_SUBMITTED: 'Formulaire envoyé avec succès.',
  FILE_UPLOADED: 'Fichier téléversé avec succès.',
  EXPORT_SUCCESS: 'Export terminé. Le fichier va être téléchargé.',
} as const;

// ============================================================
// MESSAGES D'INFORMATION ET DE CONFIRMATION
// ============================================================

/**
 * Messages d'information et de confirmation pour les dialogues utilisateur.
 * @constant INFO_MESSAGES
 */
export const INFO_MESSAGES = {
  // Confirmations
  CONFIRM_DELETE: (entity: string) =>
    `Êtes-vous sûr de vouloir supprimer ce(tte) ${entity} ? Cette action est irréversible.`,
  CONFIRM_LOGOUT: 'Voulez-vous vraiment vous déconnecter ?',
  CONFIRM_CANCEL_APPOINTMENT: 'Êtes-vous sûr de vouloir annuler ce rendez-vous ?',
  CONFIRM_LEAVE_PAGE: 'Vous avez des modifications non enregistrées. Quitter la page ?',

  // Chargements
  LOADING: 'Chargement en cours...',
  LOADING_DATA: (entity: string) => `Chargement des ${entity}...`,
  SAVING: 'Enregistrement en cours...',
  DELETING: 'Suppression en cours...',

  // États vides
  NO_DATA: 'Aucune donnée disponible.',
  NO_RESULTS: 'Aucun résultat trouvé.',
  NO_APPOINTMENTS: "Vous n'avez aucun rendez-vous pour le moment.",
  NO_MESSAGES: 'Aucun message à afficher.',
  NO_NOTIFICATIONS: 'Aucune notification.',

  // Indicateurs
  REQUIRED_FIELDS: "Les champs marqués d'un * sont obligatoires.",
  UNSAVED_CHANGES: 'Vous avez des modifications non sauvegardées.',
  SESSION_EXPIRING: 'Votre session va expirer dans quelques minutes.',
} as const;

// ============================================================
// PLACEHOLDERS POUR FORMULAIRES
// ============================================================

/**
 * Textes d'exemple (placeholders) pour les champs de formulaire.
 * @constant PLACEHOLDERS
 */
export const PLACEHOLDERS = {
  // Génériques
  SEARCH: 'Rechercher...',
  SELECT_OPTION: 'Sélectionnez une option',
  TYPE_HERE: 'Saisissez votre texte ici...',
  ENTER_VALUE: 'Entrez une valeur',

  // Champs spécifiques
  EMAIL: 'ex: jean.dupont@email.com',
  PASSWORD: '••••••••',
  CONFIRM_PASSWORD: 'Confirmez votre mot de passe',
  FIRST_NAME: 'Prénom',
  LAST_NAME: 'Nom',
  PHONE: '+237 6XX XXX XXX',
  ADDRESS: 'Adresse complète',
  CITY: 'Ville',
  ZIP_CODE: 'Code postal',
  DATE: 'JJ/MM/AAAA',
  TIME: 'HH:MM',
  MESSAGE: 'Écrivez votre message ici...',
  AMOUNT: 'Montant (ex: 15000)',
  SEARCH_DOCTOR: 'Rechercher un médecin par nom ou spécialité',
  SEARCH_PATIENT: 'Rechercher un patient',
} as const;

// ============================================================
// LABELS POUR L'INTERFACE UTILISATEUR
// ============================================================

/**
 * Labels textuels pour les boutons, onglets, menus, etc.
 * @constant UI_LABELS
 */
export const UI_LABELS = {
  // Actions
  SUBMIT: 'Envoyer',
  SAVE: 'Enregistrer',
  UPDATE: 'Mettre à jour',
  DELETE: 'Supprimer',
  CANCEL: 'Annuler',
  CONFIRM: 'Confirmer',
  CLOSE: 'Fermer',
  EDIT: 'Modifier',
  ADD: 'Ajouter',
  CREATE: 'Créer',
  SEARCH: 'Rechercher',
  FILTER: 'Filtrer',
  RESET: 'Réinitialiser',
  EXPORT: 'Exporter',
  IMPORT: 'Importer',
  DOWNLOAD: 'Télécharger',
  UPLOAD: 'Téléverser',
  REFRESH: 'Rafraîchir',
  VIEW: 'Voir',
  SHOW: 'Afficher',
  HIDE: 'Masquer',
  MORE: 'Plus',
  LESS: 'Moins',
  BACK: 'Retour',
  NEXT: 'Suivant',
  PREVIOUS: 'Précédent',
  FINISH: 'Terminer',
  SKIP: 'Passer',
  RETRY: 'Réessayer',
  COPY: 'Copier',
  PASTE: 'Coller',
  PRINT: 'Imprimer',

  // Navigation
  HOME: 'Accueil',
  DASHBOARD: 'Tableau de bord',
  PROFILE: 'Mon profil',
  SETTINGS: 'Paramètres',
  APPOINTMENTS: 'Rendez-vous',
  DOCTORS: 'Médecins',
  PATIENTS: 'Patients',
  PHARMACIES: 'Pharmacies',
  PRESCRIPTIONS: 'Ordonnances',
  MESSAGES: 'Messages',
  NOTIFICATIONS: 'Notifications',
  LOGIN: 'Connexion',
  REGISTER: 'Inscription',
  LOGOUT: 'Déconnexion',

  // États
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  ENABLED: 'Activé',
  DISABLED: 'Désactivé',
  OPEN: 'Ouvert',
  CLOSED: 'Fermé',
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  CANCELLED: 'Annulé',
  COMPLETED: 'Terminé',
  EXPIRED: 'Expiré',
  SUCCESS: 'Succès',
  ERROR: 'Erreur',
  WARNING: 'Attention',
  INFO: 'Information',
} as const;

// ============================================================
// MESSAGES D'ERREUR TECHNIQUES POUR LE LOGGING (non affichés à l'utilisateur)
// ============================================================

/**
 * Messages utilisés uniquement pour les logs techniques (développement / monitoring).
 * @constant TECHNICAL_ERRORS
 */
export const TECHNICAL_ERRORS = {
  API_REQUEST_FAILED: 'La requête API a échoué sans réponse du serveur.',
  PARSING_ERROR: 'Erreur lors du parsing de la réponse JSON.',
  INTERCEPTOR_ERROR: "Erreur dans l'intercepteur Axios.",
  STORAGE_ERROR: 'Erreur d’accès au localStorage / sessionStorage.',
  REDIRECT_FAILED: 'Échec de la redirection après authentification.',
  TOKEN_REFRESH_FAILED: 'Le rafraîchissement du token JWT a échoué.',
  UNHANDLED_REJECTION: 'Promesse non gérée (unhandled rejection).',
} as const;

// ============================================================
// EXPORT PAR DÉFAUT (regroupement pour commodité)
// ============================================================

/**
 * Regroupement de tous les messages pour un import unique.
 * @constant MESSAGES
 */
export const MESSAGES = {
  errors: {
    generic: GENERIC_ERRORS,
    auth: AUTH_ERRORS,
    validation: VALIDATION_ERRORS,
    technical: TECHNICAL_ERRORS,
  },
  success: SUCCESS_MESSAGES,
  info: INFO_MESSAGES,
  placeholders: PLACEHOLDERS,
  ui: UI_LABELS,
} as const;

export default MESSAGES;
