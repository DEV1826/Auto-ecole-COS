import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { useAppStore } from '../store/useAppStore.js'
import { formatCurrency } from '../utils/currency.js'
import { exportRapportFallback } from '../utils/exporters.js'

const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'short' })

function buildMonthWindow(count = 6) {
  const now = new Date()

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1)
    return {
      month: date.getMonth() + 1,
      label: monthFormatter.format(date),
    }
  })
}

function Rapports() {
  const fallbackPaiements = useAppStore((state) => state.paiements)
  const fallbackDepenses = useAppStore((state) => state.depenses)
  const fallbackCandidats = useAppStore((state) => state.candidats)
  const [monthlyStats, setMonthlyStats] = useState([])
  const [dashboardStats, setDashboardStats] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const hasDesktopApi = typeof window !== 'undefined' && window.api?.stats

  async function handleExport() {
    try {
      if (!window.api?.export) {
        const result = await exportRapportFallback({
          dashboardStats,
          monthlyStats,
          formatCurrency,
        })
        setFeedback({
          tone: 'success',
          source: 'Navigateur',
          message: `Rapport ${result.format.toUpperCase()} telecharge avec succes.`,
          filePath: null,
        })
        return
      }

      const result = await window.api.export.bilan({ format: 'pdf' })
      setFeedback({
        tone: 'success',
        source: 'Desktop',
        message: `Rapport PDF genere dans ${result.filePath}`,
        filePath: result.filePath,
      })
    } catch (error) {
      setFeedback({
        tone: 'danger',
        source: 'Systeme',
        message: error.message || 'Export impossible.',
      })
    }
  }

  async function handleOpenExportFolder() {
    try {
      if (!window.api?.export?.openFolder) {
        return
      }

      await window.api.export.openFolder()
    } catch (error) {
      setFeedback({
        tone: 'danger',
        source: 'Systeme',
        message: error.message || 'Impossible d ouvrir le dossier exports.',
      })
    }
  }

  useEffect(() => {
    let active = true

    async function loadReports() {
      try {
        const months = buildMonthWindow(6)

        if (!hasDesktopApi) {
          const fallbackEncaissements = fallbackPaiements.reduce(
            (sum, item) => sum + (Number(String(item.montant).replace(/[^\d]/g, '')) || 0),
            0,
          )
          const fallbackDepensesTotal = fallbackDepenses.reduce(
            (sum, item) => sum + (Number(String(item.montant).replace(/[^\d]/g, '')) || 0),
            0,
          )

          if (active) {
            setDashboardStats({
              candidatsActifs: fallbackCandidats.length,
              paiementsCount: fallbackPaiements.length,
              totalPaiements: fallbackEncaissements,
              soldeCaisse: fallbackEncaissements - fallbackDepensesTotal,
              vehiculesDisponibles: 2,
              examensPlanifies: 0,
            })
            setMonthlyStats(
              months.map((entry, index) => ({
                ...entry,
                encaissements: Math.round(fallbackEncaissements * ((index + 2) / 10)),
                depenses: Math.round(fallbackDepensesTotal * ((index + 1) / 10)),
                nouveauxCandidats: Math.max(1, Math.round(fallbackCandidats.length / 2)),
              })),
            )
          }

          return
        }

        const [dashboardData, ...monthlyData] = await Promise.all([
          window.api.stats.dashboard(),
          ...months.map((entry) => window.api.stats.mensuels(entry.month)),
        ])

        if (active) {
          setDashboardStats(dashboardData)
          setMonthlyStats(
            months.map((entry, index) => ({
              ...entry,
              ...monthlyData[index],
            })),
          )
          setFeedback(null)
        }
      } catch (error) {
        if (active) {
          setFeedback({
            tone: 'danger',
            source: 'Systeme',
            message: error.message || 'Impossible de charger les rapports.',
          })
        }
      }
    }

    loadReports()

    return () => {
      active = false
    }
  }, [fallbackCandidats, fallbackDepenses, fallbackPaiements, hasDesktopApi])

  const reportCards = useMemo(() => {
    const totalEncaisse = monthlyStats.reduce((sum, item) => sum + Number(item.encaissements || 0), 0)
    const totalDepenses = monthlyStats.reduce((sum, item) => sum + Number(item.depenses || 0), 0)
    const totalNouveaux = monthlyStats.reduce((sum, item) => sum + Number(item.nouveauxCandidats || 0), 0)
    const marge = totalEncaisse - totalDepenses
    const panierMoyen =
      totalNouveaux > 0 ? Math.round(totalEncaisse / totalNouveaux) : 0

    return [
      {
        id: 'rep-1',
        title: 'Encaissements 6 mois',
        value: formatCurrency(totalEncaisse),
        note: 'Total cumule sur la fenetre d analyse.',
      },
      {
        id: 'rep-2',
        title: 'Marge estimee',
        value: formatCurrency(marge),
        note: 'Encaissements moins depenses.',
      },
      {
        id: 'rep-3',
        title: 'Panier moyen',
        value: formatCurrency(panierMoyen),
        note: 'Encaissements rapportes aux nouveaux dossiers.',
      },
    ]
  }, [monthlyStats])

  const latestMonth = monthlyStats.at(-1)

  return (
    <section className="page">
      <PageHeader
        title="Rapports"
        description="KPIs financiers et syntheses mensuelles alimentees par Prisma."
        actions={
          <button type="button" className="btn btn-secondary" onClick={handleExport}>
            Exporter PDF
          </button>
        }
      />

      <div className="stats-grid">
        <StatCard
          label="Candidats actifs"
          value={dashboardStats?.candidatsActifs || 0}
          hint="Base actuelle"
        />
        <StatCard
          label="Solde caisse"
          value={formatCurrency(dashboardStats?.soldeCaisse || 0)}
          hint="Dernier solde calcule"
        />
        <StatCard
          label="Paiements"
          value={dashboardStats?.paiementsCount || 0}
          hint="Transactions comptabilisees"
        />
        <StatCard
          label="Examens planifies"
          value={dashboardStats?.examensPlanifies || 0}
          hint="Suivi pedagogique"
        />
      </div>

      {feedback ? (
        <div className={`export-feedback ${feedback.tone === 'danger' ? 'danger' : 'success'}`}>
          <strong>{feedback.source}</strong>
          <span>{feedback.message}</span>
          {feedback.source === 'Desktop' && feedback.filePath ? (
            <button type="button" className="btn btn-secondary btn-small" onClick={handleOpenExportFolder}>
              Ouvrir le dossier exports
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="report-grid">
        {reportCards.map((card) => (
          <article className="panel" key={card.id}>
            <div className="stack">
              <span className="badge">{card.title}</span>
              <strong className="kpi">{card.value}</strong>
              <p className="panel-subtitle">{card.note}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="list-grid reports-layout">
        <article className="panel chart-panel">
          <div className="panel-header">
            <h3>Encaissements vs depenses</h3>
            <span className="badge success">6 mois</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(92, 70, 48, 0.14)" />
                <XAxis dataKey="label" stroke="#73614d" />
                <YAxis stroke="#73614d" />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="encaissements" fill="#c8642d" radius={[8, 8, 0, 0]} />
                <Bar dataKey="depenses" fill="#7e3411" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel chart-panel">
          <div className="panel-header">
            <h3>Nouveaux dossiers</h3>
            <span className="badge">{latestMonth ? latestMonth.label : '-'}</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(92, 70, 48, 0.14)" />
                <XAxis dataKey="label" stroke="#73614d" />
                <YAxis stroke="#73614d" allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="nouveauxCandidats"
                  stroke="#1d7f53"
                  strokeWidth={3}
                  dot={{ fill: '#1d7f53', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <article className="panel">
        <div className="panel-header">
          <h3>Synthese mensuelle</h3>
          <span className="badge success">Tableau</span>
        </div>
        {!monthlyStats.length ? (
          <div className="empty-state">Aucune statistique disponible.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mois</th>
                  <th>Encaissements</th>
                  <th>Depenses</th>
                  <th>Marge</th>
                  <th>Nouveaux dossiers</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats.map((item) => (
                  <tr key={item.month}>
                    <td>{item.label}</td>
                    <td>{formatCurrency(item.encaissements)}</td>
                    <td>{formatCurrency(item.depenses)}</td>
                    <td>{formatCurrency(Number(item.encaissements || 0) - Number(item.depenses || 0))}</td>
                    <td>{item.nouveauxCandidats}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  )
}

export default Rapports
