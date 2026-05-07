import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { useAppStore } from '../store/useAppStore.js'
import { formatCurrency } from '../utils/currency.js'
import { exportRecuFallback } from '../utils/exporters.js'

const modeLabels = {
  ESPECES: 'Especes',
  CHEQUE: 'Cheque',
  VIREMENT: 'Virement',
  CARTE: 'Carte',
  MOBILE_MONEY: 'Mobile money',
}

function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function normalizeFallback(items) {
  return items.map((item, index) => ({
    id: index + 1,
    numero: `REC-${new Date().getFullYear()}-${String(index + 1).padStart(5, '0')}`,
    paiementId: index + 1,
    date: new Date().toISOString(),
    montant: Number(String(item.montant).replace(/[^\d]/g, '')) || 0,
    mode: item.mode === 'CB' ? 'CARTE' : item.mode === 'Especes' ? 'ESPECES' : 'VIREMENT',
    reference: '',
    note: '',
    candidat: {
      prenom: item.candidat.split(' ')[0] || item.candidat,
      nom: item.candidat.split(' ').slice(1).join(' '),
    },
    facture: null,
  }))
}

async function fetchRecusData({ hasDesktopApi, fallbackPaiements }) {
  if (hasDesktopApi) {
    const data = await window.api.recu.list()
    return { recus: data }
  }

  return { recus: normalizeFallback(fallbackPaiements) }
}

function Recus() {
  const fallbackPaiements = useAppStore((state) => state.paiements)
  const [recus, setRecus] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const hasDesktopApi = typeof window !== 'undefined' && window.api?.recu

  useEffect(() => {
    let active = true

    async function loadInitialRecus() {
      setLoading(true)

      try {
        const data = await fetchRecusData({ hasDesktopApi, fallbackPaiements })

        if (!active) {
          return
        }

        setRecus(data.recus)
        setFeedback(null)
      } catch (error) {
        if (active) {
          setFeedback({
            tone: 'danger',
            source: 'Systeme',
            message: error.message || 'Impossible de charger les recus.',
          })
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadInitialRecus()

    return () => {
      active = false
    }
  }, [hasDesktopApi, fallbackPaiements])

  const filteredRecus = useMemo(
    () =>
      recus.filter((recu) => {
        const client = `${recu.candidat?.prenom || ''} ${recu.candidat?.nom || ''}`.toLowerCase()
        return (
          client.includes(search.toLowerCase()) ||
          String(recu.numero || '').toLowerCase().includes(search.toLowerCase())
        )
      }),
    [recus, search],
  )

  const stats = useMemo(() => {
    const total = recus.reduce((sum, item) => sum + Number(item.montant || 0), 0)
    return {
      total,
      count: recus.length,
      linkedFactures: recus.filter((item) => item.facture?.numero).length,
    }
  }, [recus])

  async function handleExport(recu) {
    try {
      if (!window.api?.recu?.export) {
        const result = await exportRecuFallback({ recu, formatCurrency })
        setFeedback({
          tone: 'success',
          source: 'Navigateur',
          message: `Recu ${result.format.toUpperCase()} telecharge avec succes.`,
        })
        return
      }

      const result = await window.api.recu.export(recu.paiementId)
      setFeedback({
        tone: 'success',
        source: 'Desktop',
        message: `Recu PDF genere dans ${result.filePath}`,
        filePath: result.filePath,
      })
    } catch (error) {
      setFeedback({
        tone: 'danger',
        source: 'Systeme',
        message: error.message || 'Impossible de generer ce recu.',
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

  return (
    <section className="page">
      <PageHeader
        title="Recus"
        description="Registre des recus emis a partir des paiements valides, avec export PDF."
      />

      <div className="stats-grid">
        <StatCard label="Recus" value={stats.count} hint="Paiements traces" />
        <StatCard label="Total recu" value={formatCurrency(stats.total)} hint="Montants encaisses" />
        <StatCard label="Lies a facture" value={stats.linkedFactures} hint="Pieces rattachees" />
        <StatCard label="Sans facture" value={stats.count - stats.linkedFactures} hint="Paiements directs" />
      </div>

      <article className="panel">
        <div className="panel-header">
          <h3>Recherche</h3>
          {feedback ? (
            <span className={`badge${feedback.tone === 'danger' ? ' danger' : ' success'}`}>
              {feedback.source}
            </span>
          ) : null}
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
        <label className="field">
          <span>Numero ou candidat</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="REC-2026 ou Sara" />
        </label>
      </article>

      <article className="panel">
        <div className="panel-header">
          <h3>Journal des recus</h3>
          <span className="badge success">{filteredRecus.length} lignes</span>
        </div>
        {loading ? (
          <div className="empty-state">Chargement des recus...</div>
        ) : !filteredRecus.length ? (
          <div className="empty-state">Aucun recu disponible.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Numero</th>
                  <th>Date</th>
                  <th>Candidat</th>
                  <th>Montant</th>
                  <th>Mode</th>
                  <th>Facture</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecus.map((recu) => (
                  <tr key={recu.numero}>
                    <td>{recu.numero}</td>
                    <td>{formatDate(recu.date)}</td>
                    <td>{recu.candidat?.prenom} {recu.candidat?.nom}</td>
                    <td>{formatCurrency(recu.montant)}</td>
                    <td>{modeLabels[recu.mode] || recu.mode}</td>
                    <td>{recu.facture?.numero || '-'}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="btn btn-secondary btn-small" onClick={() => handleExport(recu)}>
                          Export PDF
                        </button>
                      </div>
                    </td>
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

export default Recus
