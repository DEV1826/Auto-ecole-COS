import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Candidats from './pages/Candidats.jsx'
import Formation from './pages/Formation.jsx'
import Planning from './pages/Planning.jsx'
import Moniteurs from './pages/Moniteurs.jsx'
import Vehicules from './pages/Vehicules.jsx'
import Paiements from './pages/Paiements.jsx'
import Depenses from './pages/Depenses.jsx'
import Caisse from './pages/Caisse.jsx'
import Factures from './pages/Factures.jsx'
import Examens from './pages/Examens.jsx'
import Recus from './pages/Recus.jsx'
import Rapports from './pages/Rapports.jsx'
import { useAppStore } from './store/useAppStore.js'

function ProtectedLayout() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <AppShell />
}

function App() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated)

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route path="/" element={<ProtectedLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="candidats" element={<Candidats />} />
        <Route path="formation" element={<Formation />} />
        <Route path="planning" element={<Planning />} />
        <Route path="moniteurs" element={<Moniteurs />} />
        <Route path="vehicules" element={<Vehicules />} />
        <Route path="paiements" element={<Paiements />} />
        <Route path="depenses" element={<Depenses />} />
        <Route path="caisse" element={<Caisse />} />
        <Route path="factures" element={<Factures />} />
        <Route path="recus" element={<Recus />} />
        <Route path="examens" element={<Examens />} />
        <Route path="rapports" element={<Rapports />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
    </Routes>
  )
}

export default App
