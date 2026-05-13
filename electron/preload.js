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

  candidats: {
    getAll: (params) => invoke('candidats:getAll', params),
    getById: (id) => invoke('candidats:getById', id),
    create: (data) => invoke('candidats:create', data),
    update: (id, data) => invoke('candidats:update', { id, data }),
    delete: (id) => invoke('candidats:delete', id),
    search: (query) => invoke('candidats:search', query),
    updateStatus: (params) => invoke('candidats:updateStatus', params),
    getStats: () => invoke('candidats:getStats'),
    getPaiements: (candidatId) => invoke('candidats:getPaiements', candidatId),
    getLecons: (candidatId) => invoke('candidats:getLecons', candidatId),
    getExamens: (candidatId) => invoke('candidats:getExamens', candidatId),
    getFactures: (candidatId) => invoke('candidats:getFactures', candidatId),
    getDocuments: (candidatId) => invoke('candidats:getDocuments', candidatId),
    addDocument: (data) => invoke('candidats:addDocument', data),
    deleteDocument: (docId) => invoke('candidats:deleteDocument', docId),
  },
};

contextBridge.exposeInMainWorld('api', api);
