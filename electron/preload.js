import { contextBridge, ipcRenderer } from 'electron';

const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload);

const api = {
  auth: {
    login: (payload) => invoke('auth:login', payload),
    logout: (sessionId, userId) => invoke('auth:logout', { sessionId, userId }),
    validate: (token) => invoke('auth:validate', { token }),
    refresh: (refreshToken) => invoke('auth:refresh', { refreshToken }),
    createUser: (payload) => invoke('auth:createUser', payload),
    updateUser: (payload) => invoke('auth:updateUser', payload),
    deleteUser: (userId, deletedByUserId) => invoke('auth:deleteUser', { userId, deletedByUserId }),
    getAllUsers: (userId, page, limit) => invoke('auth:getAllUsers', { userId, page, limit }),
    getUserById: (userId, requesterId) => invoke('auth:getUserById', { userId, requesterId }),
    changePassword: (userId, oldPassword, newPassword) =>
      invoke('auth:changePassword', { userId, oldPassword, newPassword }),
    assignPermission: (payload) => invoke('auth:assignPermission', payload),
    revokePermission: (permissionId, revokedByUserId) =>
      invoke('auth:revokePermission', { permissionId, revokedByUserId }),
    getUserPermissions: (userId) => invoke('auth:getUserPermissions', { userId }),
    checkPermission: (userId, ressource, action) =>
      invoke('auth:checkPermission', { userId, ressource, action }),
    getUserSessions: (userId) => invoke('auth:getUserSessions', { userId }),
    revokeSession: (sessionId, revokedByUserId) =>
      invoke('auth:revokeSession', { sessionId, revokedByUserId }),
    revokeAllUserSessions: (userId, revokedByUserId) =>
      invoke('auth:revokeAllUserSessions', { userId, revokedByUserId }),
    getAuditLogs: (userId, page, limit, filters) =>
      invoke('auth:getAuditLogs', { userId, page, limit, filters }),
    requestPasswordResetByEmail: (email, isAdmin) =>
      invoke('auth:requestPasswordResetByEmail', email, isAdmin),
    validateResetCode: (code) => invoke('auth:validateResetCode', code),
    resetPassword: ({ code, newPassword }) => invoke('auth:resetPassword', { code, newPassword }),
    getAllResetCodes: (userId, page, limit, onlyActive) =>
      invoke('auth:getAllResetCodes', { userId, page, limit, onlyActive }),
  },
  candidat: {
    list: () => invoke('candidat:list'),
    get: (id) => invoke('candidat:get', id),
    create: (payload) => invoke('candidat:create', payload),
    update: (id, data) => invoke('candidat:update', { id, data }),
    delete: (id) => invoke('candidat:delete', id),
    search: (query) => invoke('candidat:search', query),
  },
  candidats: {
    list: () => invoke('candidats:list'),
    create: (payload) => invoke('candidats:create', payload),
    updateStatus: (payload) => invoke('candidats:updateStatus', payload),
  },
  planning: {
    list: () => invoke('planning:list'),
    saveLesson: (payload) => invoke('planning:saveLesson', payload),
    updateLesson: (id, data) => invoke('planning:updateLesson', { id, data }),
    deleteLesson: (id) => invoke('planning:deleteLesson', id),
  },
  formation: {
    list: () => invoke('formation:list'),
    create: (payload) => invoke('formation:create', payload),
    update: (id, data) => invoke('formation:update', { id, data }),
    delete: (id) => invoke('formation:delete', id),
  },
  examen: {
    list: () => invoke('examen:list'),
    create: (payload) => invoke('examen:create', payload),
    update: (id, data) => invoke('examen:update', { id, data }),
    delete: (id) => invoke('examen:delete', id),
  },
  paiement: {
    list: () => invoke('paiement:list'),
    byCandidat: (id) => invoke('paiement:byCandidat', id),
    create: (payload) => invoke('paiement:create', payload),
    delete: (id) => invoke('paiement:delete', id),
    soldeCandidat: (id) => invoke('paiement:soldeCandidat', id),
    resumeMensuel: (payload) => invoke('paiement:resumeMensuel', payload),
  },
  paiements: {
    list: () => invoke('paiements:list'),
    create: (payload) => invoke('paiements:create', payload),
  },
  facture: {
    list: () => invoke('facture:list'),
    create: (payload) => invoke('facture:create', payload),
    update: (id, data) => invoke('facture:update', { id, data }),
    delete: (id) => invoke('facture:delete', id),
  },
  recu: {
    list: () => invoke('recu:list'),
    get: (id) => invoke('recu:get', id),
    export: (id) => invoke('recu:export', id),
  },
  depense: {
    list: () => invoke('depense:list'),
    create: (payload) => invoke('depense:create', payload),
    delete: (id) => invoke('depense:delete', id),
  },
  caisse: {
    solde: () => invoke('caisse:solde'),
    mouvements: () => invoke('caisse:mouvements'),
    entree: (payload) => invoke('caisse:entree', payload),
    sortie: (payload) => invoke('caisse:sortie', payload),
  },
  vehicule: {
    list: () => invoke('vehicule:list'),
    create: (payload) => invoke('vehicule:create', payload),
    update: (id, data) => invoke('vehicule:update', { id, data }),
    delete: (id) => invoke('vehicule:delete', id),
  },
  vehicules: {
    list: () => invoke('vehicules:list'),
    updateStatus: (payload) => invoke('vehicules:updateStatus', payload),
  },
  moniteur: {
    list: () => invoke('moniteur:list'),
    create: (payload) => invoke('moniteur:create', payload),
    update: (id, data) => invoke('moniteur:update', { id, data }),
    delete: (id) => invoke('moniteur:delete', id),
  },
  stats: {
    dashboard: () => invoke('stats:dashboard'),
    mensuels: (mois) => invoke('stats:mensuels', mois),
  },
  export: {
    recu: (payload) => invoke('export:recu', payload),
    bilan: (payload) => invoke('export:bilan', payload),
    excel: (payload) => invoke('export:excel', payload),
    openFolder: () => invoke('export:openFolder'),
  },
  exports: {
    dashboard: (payload) => invoke('exports:dashboard', payload),
    factures: (payload) => invoke('exports:factures', payload),
  },
};

contextBridge.exposeInMainWorld('api', api);
