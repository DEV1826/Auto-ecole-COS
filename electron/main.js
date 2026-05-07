import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { login } from './services/authService.js'
import {
  create,
  createCandidat,
  getAll as getAllCandidats,
  getById,
  getCandidats,
  remove as removeCandidat,
  search,
  update,
  updateCandidatStatus,
} from './services/candidatService.js'
import { deleteLesson, getPlanning, saveLesson, updateLesson } from './services/planningService.js'
import {
  create as createPaiement,
  deletePaiement,
  getAll as getAllPaiements,
  getByCandidat,
  getPaiements,
  getResumeMensuel,
  getSolde,
  registerPaiement,
} from './services/paiementService.js'
import {
  create as createVehicule,
  getAll as getAllVehicules,
  getVehicules,
  remove as removeVehicule,
  update as updateVehicule,
  updateVehiculeStatus,
} from './services/vehiculeService.js'
import { create as createDepense, getAll as getAllDepenses, remove as removeDepense } from './services/depenseService.js'
import { entree, getMouvements, getSolde as getCaisseSolde, sortie } from './services/caisseService.js'
import {
  create as createMoniteur,
  getAll as getAllMoniteurs,
  remove as removeMoniteur,
  update as updateMoniteur,
} from './services/moniteurService.js'
import {
  exportDashboardSnapshot,
  exportFactures,
  getExportDirectory,
} from './services/exportService.js'
import { getDashboard, getMensuels } from './services/statsService.js'
import {
  create as createFacture,
  getAll as getAllFactures,
  remove as removeFacture,
  update as updateFacture,
} from './services/factureService.js'
import {
  create as createFormation,
  getAll as getAllFormations,
  remove as removeFormation,
  update as updateFormation,
} from './services/formationService.js'
import {
  create as createExamen,
  getAll as getAllExamens,
  remove as removeExamen,
  update as updateExamen,
} from './services/examenService.js'
import {
  exportReceipt,
  getAll as getAllRecus,
  getById as getRecuById,
} from './services/recuService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#f4efe7',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const devServerUrl = process.env.VITE_DEV_SERVER_URL

  if (devServerUrl) {
    window.loadURL(devServerUrl)
  } else {
    window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

function registerIpcHandlers() {
  ipcMain.handle('auth:login', async (_event, payload) => login(payload))
  ipcMain.handle('auth:logout', async () => ({ success: true }))

  ipcMain.handle('candidat:list', async () => getAllCandidats())
  ipcMain.handle('candidat:get', async (_event, id) => getById(id))
  ipcMain.handle('candidat:create', async (_event, payload) => create(payload))
  ipcMain.handle('candidat:update', async (_event, payload) => update(payload.id, payload.data))
  ipcMain.handle('candidat:delete', async (_event, id) => removeCandidat(id))
  ipcMain.handle('candidat:search', async (_event, query) => search(query))

  ipcMain.handle('candidats:list', async () => getCandidats())
  ipcMain.handle('candidats:create', async (_event, payload) => createCandidat(payload))
  ipcMain.handle('candidats:updateStatus', async (_event, payload) =>
    updateCandidatStatus(payload),
  )

  ipcMain.handle('planning:list', async () => getPlanning())
  ipcMain.handle('planning:saveLesson', async (_event, payload) => saveLesson(payload))
  ipcMain.handle('planning:updateLesson', async (_event, payload) =>
    updateLesson(payload.id, payload.data),
  )
  ipcMain.handle('planning:deleteLesson', async (_event, id) => deleteLesson(id))

  ipcMain.handle('formation:list', async () => getAllFormations())
  ipcMain.handle('formation:create', async (_event, payload) => createFormation(payload))
  ipcMain.handle('formation:update', async (_event, payload) => updateFormation(payload.id, payload.data))
  ipcMain.handle('formation:delete', async (_event, id) => removeFormation(id))

  ipcMain.handle('examen:list', async () => getAllExamens())
  ipcMain.handle('examen:create', async (_event, payload) => createExamen(payload))
  ipcMain.handle('examen:update', async (_event, payload) => updateExamen(payload.id, payload.data))
  ipcMain.handle('examen:delete', async (_event, id) => removeExamen(id))

  ipcMain.handle('paiement:list', async () => getAllPaiements())
  ipcMain.handle('paiement:byCandidat', async (_event, id) => getByCandidat(id))
  ipcMain.handle('paiement:create', async (_event, payload) => createPaiement(payload))
  ipcMain.handle('paiement:delete', async (_event, id) => deletePaiement(id))
  ipcMain.handle('paiement:soldeCandidat', async (_event, id) => getSolde(id))
  ipcMain.handle('paiement:resumeMensuel', async (_event, payload) =>
    getResumeMensuel(payload.annee, payload.mois),
  )

  ipcMain.handle('paiements:list', async () => getPaiements())
  ipcMain.handle('paiements:create', async (_event, payload) => registerPaiement(payload))

  ipcMain.handle('facture:list', async () => getAllFactures())
  ipcMain.handle('facture:create', async (_event, payload) => createFacture(payload))
  ipcMain.handle('facture:update', async (_event, payload) => updateFacture(payload.id, payload.data))
  ipcMain.handle('facture:delete', async (_event, id) => removeFacture(id))

  ipcMain.handle('recu:list', async () => getAllRecus())
  ipcMain.handle('recu:get', async (_event, id) => getRecuById(id))
  ipcMain.handle('recu:export', async (_event, id) => exportReceipt(id))

  ipcMain.handle('depense:list', async () => getAllDepenses())
  ipcMain.handle('depense:create', async (_event, payload) => createDepense(payload))
  ipcMain.handle('depense:delete', async (_event, id) => removeDepense(id))

  ipcMain.handle('caisse:solde', async () => getCaisseSolde())
  ipcMain.handle('caisse:mouvements', async () => getMouvements())
  ipcMain.handle('caisse:entree', async (_event, payload) => entree(payload))
  ipcMain.handle('caisse:sortie', async (_event, payload) => sortie(payload))

  ipcMain.handle('vehicule:list', async () => getAllVehicules())
  ipcMain.handle('vehicule:create', async (_event, payload) => createVehicule(payload))
  ipcMain.handle('vehicule:update', async (_event, payload) => updateVehicule(payload.id, payload.data))
  ipcMain.handle('vehicule:delete', async (_event, id) => removeVehicule(id))
  ipcMain.handle('vehicules:list', async () => getVehicules())
  ipcMain.handle('vehicules:updateStatus', async (_event, payload) =>
    updateVehiculeStatus(payload),
  )

  ipcMain.handle('moniteur:list', async () => getAllMoniteurs())
  ipcMain.handle('moniteur:create', async (_event, payload) => createMoniteur(payload))
  ipcMain.handle('moniteur:update', async (_event, payload) => updateMoniteur(payload.id, payload.data))
  ipcMain.handle('moniteur:delete', async (_event, id) => removeMoniteur(id))

  ipcMain.handle('stats:dashboard', async () => getDashboard())
  ipcMain.handle('stats:mensuels', async (_event, mois) => getMensuels(mois))

  ipcMain.handle('export:recu', async (_event, payload) => exportFactures(payload))
  ipcMain.handle('export:bilan', async (_event, payload) => exportDashboardSnapshot(payload))
  ipcMain.handle('export:excel', async (_event, payload) => exportFactures(payload))
  ipcMain.handle('export:openFolder', async () => {
    const exportDir = await getExportDirectory()
    await shell.openPath(exportDir)
    return { path: exportDir }
  })
  ipcMain.handle('exports:dashboard', async (_event, payload) =>
    exportDashboardSnapshot(payload),
  )
  ipcMain.handle('exports:factures', async (_event, payload) => exportFactures(payload))
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
