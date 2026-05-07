import { NavLink } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore.js'

const navItems = [
  { to: '/', label: 'Dashboard', pill: '01' },
  { to: '/candidats', label: 'Candidats', pill: '48' },
  { to: '/formation', label: 'Formation', pill: 'B' },
  { to: '/planning', label: 'Planning', pill: 'Lecon' },
  { to: '/moniteurs', label: 'Moniteurs', pill: '06' },
  { to: '/vehicules', label: 'Vehicules', pill: '04' },
  { to: '/paiements', label: 'Paiements', pill: 'FCFA' },
  { to: '/depenses', label: 'Depenses', pill: '12' },
  { to: '/caisse', label: 'Caisse', pill: 'Jour' },
  { to: '/factures', label: 'Factures', pill: 'PDF' },
  { to: '/recus', label: 'Recus', pill: 'OK' },
  { to: '/examens', label: 'Examens', pill: 'Jury' },
  { to: '/rapports', label: 'Rapports', pill: 'KPI' },
]

function Sidebar() {
  const currentUser = useAppStore((state) => state.currentUser)
  const logout = useAppStore((state) => state.logout)

  return (
    <aside className="sidebar">
      <div className="brand-card">
        <img className="sidebar-logo" src="hero.png" alt="AutoEcole Pro" />
        <p>Gestion candidats, planning, caisse et reporting sur une seule base.</p>
      </div>

      <nav className="sidebar-nav" aria-label="Navigation principale">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span>{item.label}</span>
            <span className="nav-pill">{item.pill}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-note">
          <strong>{currentUser.name}</strong>
          <div>{currentUser.role}</div>
        </div>
        <button type="button" className="btn btn-ghost" onClick={logout}>
          Se deconnecter
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
