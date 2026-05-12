import { useEffect, useMemo, useState } from 'react'
import StatCard from '../components/StatCard.jsx'
import { useAppStore } from '../store/useAppStore.js'
import { formatCurrency } from '../utils/currency.js'

function normalizeFallbackCandidats(items) {
  return items.map((item) => ({
    ...item,
    montantTotal: Number(String(item.resteARegler).replace(/[^\d]/g, '')) + 900,
    totalPaye: 0,
    resteARegler: Number(String(item.resteARegler).replace(/[^\d]/g, '')) || 0,
    formationNom: item.formule,
  }))
}

function normalizeFallbackPaiements(items) {
  return items.map((item, index) => ({
    id: index + 1,
    candidat: item.candidat,
    mode: item.mode,
    montant: Number(String(item.montant).replace(/[^\d]/g, '')) || 0,
    date: new Date().toISOString(),
    note: '',
  }))
}

function Dashboard() {
  const fallbackDashboard = useAppStore((state) => state.dashboard)
  const fallbackPaiements = useAppStore((state) => state.paiements)
  const fallbackCandidats = useAppStore((state) => state.candidats)
  const [dashboard, setDashboard] = useState({
    candidatsActifs: fallbackDashboard.candidatsActifs,
    examensPlanifies: fallbackDashboard.examensPlanifies,
    totalPaiements: 0,
    soldeCaisse: Number(String(fallbackDashboard.caisseJour).replace(/[^\d]/g, '')) || 0,
    vehiculesDisponibles: 0,
  })
  const [paiements, setPaiements] = useState(normalizeFallbackPaiements(fallbackPaiements))
  const [candidats, setCandidats] = useState(normalizeFallbackCandidats(fallbackCandidats))
  const [feedback, setFeedback] = useState('')
  const hasDesktopApi =
    typeof window !== 'undefined' &&
    window.api?.stats &&
    window.api?.paiement &&
    window.api?.candidat

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        if (!hasDesktopApi) {
          if (active) {
            setDashboard((current) => ({
              ...current,
              totalPaiements: normalizeFallbackPaiements(fallbackPaiements).reduce(
                (sum, item) => sum + item.montant,
                0,
              ),
              vehiculesDisponibles: 2,
            }))
            setPaiements(normalizeFallbackPaiements(fallbackPaiements))
            setCandidats(normalizeFallbackCandidats(fallbackCandidats))
          }
          return
        }

        const [statsData, paiementsData, candidatsData] = await Promise.all([
          window.api.stats.dashboard(),
          window.api.paiement.list(),
          window.api.candidat.list(),
        ])

        if (active) {
          setDashboard(statsData)
          setPaiements(paiementsData.slice(0, 5))
          setCandidats(candidatsData.slice(0, 5))
          setFeedback('')
        }
      } catch (error) {
        if (active) {
          setFeedback(error.message || 'Impossible de charger le dashboard.')
        }
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [fallbackCandidats, fallbackPaiements, hasDesktopApi])

  const ratioEncaissement = useMemo(() => {
    const totalContrats = candidats.reduce((sum, candidat) => sum + Number(candidat.montantTotal || 0), 0)
    const totalPaye = candidats.reduce((sum, candidat) => sum + Number(candidat.totalPaye || 0), 0)

    if (!totalContrats) {
      return 0
    }

    return Math.min(Math.round((totalPaye / totalContrats) * 100), 100)
  }, [candidats])

  const lastPaiement = paiements[0]
  const impayes = candidats.reduce(
    (sum, candidat) => sum + Number(candidat.resteARegler || 0),
    0,
  )

  return (
    <section className="page">
      <div className="hero-panel">
        <div className="hero-copy stack">
          <span className="badge">Pilotage quotidien</span>
          <h2>Vue d ensemble de l auto-ecole</h2>
          <p>
            Le tableau de bord est maintenant alimente par les donnees de l application :
            candidats, paiements, caisse et examens.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary">
              Ajouter un candidat
            </button>
            <button type="button" className="btn btn-secondary">
              Planifier une lecon
            </button>
          </div>
        </div>

        <aside className="hero-highlight">
          <div className="stack">
            <span className="badge success">Taux d encaissement</span>
            <strong className="kpi">{ratioEncaissement}%</strong>
            <span className="muted">Part des contrats deja encaissee sur les dossiers affiches.</span>
          </div>
          <div className="stack">
            <span className="muted">Dernier encaissement</span>
            <strong>{lastPaiement ? formatCurrency(lastPaiement.montant) : 'Aucun'}</strong>
            <span className="muted">
              {lastPaiement ? `${lastPaiement.candidat?.prenom || ''} ${lastPaiement.candidat?.nom || lastPaiement.candidat}` : 'Aucune transaction recente'}
            </span>
          </div>
        </aside>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Candidats actifs"
          value={dashboard.candidatsActifs}
          hint="Dossiers suivis"
        />
        <StatCard
          label="Examens planifies"
          value={dashboard.examensPlanifies}
          hint="Sessions a venir"
        />
        <StatCard
          label="Solde caisse"
          value={formatCurrency(dashboard.soldeCaisse)}
          hint="Tresorerie actuelle"
        />
        <StatCard label="Impayes" value={formatCurrency(impayes)} hint="Reste a encaisser" />
      </div>

      {feedback ? <div className="panel-subtitle">{feedback}</div> : null}

      <div className="list-grid">
        <article className="panel">
          <div className="panel-header">
            <h3>Candidats a suivre</h3>
            <span className="badge">{candidats.length} dossiers</span>
          </div>
          <div className="list">
            {candidats.map((candidat) => (
              <div className="list-item" key={candidat.id}>
                <div className="stack">
                  <strong>
                    {candidat.prenom} {candidat.nom}
                  </strong>
                  <span className="muted">
                    {candidat.formationNom || candidat.formule || 'Parcours non renseigne'}
                  </span>
                </div>
                <div className="stack">
                  <span className="badge">{candidat.statut}</span>
                  <span className="muted">{formatCurrency(candidat.resteARegler)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h3>Paiements recents</h3>
            <span className="badge success">{dashboard.paiementsCount || paiements.length} operations</span>
          </div>
          <div className="list">
            {paiements.map((paiement) => (
              <div className="list-item" key={paiement.id}>
                <div className="stack">
                  <strong>
                    {paiement.candidat?.prenom
                      ? `${paiement.candidat.prenom} ${paiement.candidat.nom}`
                      : paiement.candidat}
                  </strong>
                  <span className="muted">{paiement.mode}</span>
                </div>
                <div className="stack">
                  <strong>{formatCurrency(paiement.montant)}</strong>
                  <span className="badge success">Encaisse</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Total paiements"
          value={formatCurrency(dashboard.totalPaiements)}
          hint="Somme encaissee"
        />
        <StatCard
          label="Vehicules disponibles"
          value={dashboard.vehiculesDisponibles}
          hint="Flotte exploitable"
        />
        <StatCard
          label="Paiements recents"
          value={paiements.length}
          hint="Bloc affiche"
        />
        <StatCard
          label="Candidats a suivre"
          value={candidats.length}
          hint="Bloc affiche"
        />
      </div>
    </section>
  )
}

export default Dashboard
