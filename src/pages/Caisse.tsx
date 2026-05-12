import { useEffect, useMemo, useState } from 'react'
import StatCard from '../components/StatCard.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { useAppStore } from '../store/useAppStore.js'
import { formatCurrency } from '../utils/currency.js'

function Caisse() {
  const fallbackPaiements = useAppStore((state) => state.paiements)
  const fallbackDepenses = useAppStore((state) => state.depenses)
  const [mouvements, setMouvements] = useState([])
  const [solde, setSolde] = useState(null)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    async function loadCaisse() {
      try {
        if (!window.api?.caisse) {
          const fakeEntries = fallbackPaiements.map((item, index) => ({
            id: `e-${index}`,
            type: 'ENTREE',
            description: item.candidat,
            montant: Number(String(item.montant).replace(/[^\d]/g, '')) || 0,
            reference: '',
            date: new Date().toISOString(),
          }))
          const fakeSorties = fallbackDepenses.map((item, index) => ({
            id: `s-${index}`,
            type: 'SORTIE',
            description: item.label,
            montant: Number(String(item.montant).replace(/[^\d]/g, '')) || 0,
            reference: '',
            date: new Date().toISOString(),
          }))
          const currentMouvements = [...fakeEntries, ...fakeSorties]
          const computedSolde = currentMouvements.reduce(
            (sum, item) => sum + (item.type === 'ENTREE' ? item.montant : -item.montant),
            0,
          )
          setMouvements(currentMouvements)
          setSolde({ solde: computedSolde, mouvements: currentMouvements.length })
          return
        }

        const [mouvementsData, soldeData] = await Promise.all([
          window.api.caisse.mouvements(),
          window.api.caisse.solde(),
        ])
        setMouvements(mouvementsData)
        setSolde(soldeData)
        setFeedback('')
      } catch (error) {
        setFeedback(error.message || 'Impossible de charger la caisse.')
      }
    }

    loadCaisse()
  }, [fallbackDepenses, fallbackPaiements])

  const entrees = useMemo(
    () => mouvements.filter((item) => item.type === 'ENTREE'),
    [mouvements],
  )
  const sorties = useMemo(
    () => mouvements.filter((item) => item.type === 'SORTIE'),
    [mouvements],
  )
  const totals = useMemo(
    () => ({
      entrees: entrees.reduce((sum, item) => sum + Number(item.montant || 0), 0),
      sorties: sorties.reduce((sum, item) => sum + Number(item.montant || 0), 0),
    }),
    [entrees, sorties],
  )
  const recentMouvements = useMemo(() => mouvements.slice(0, 8), [mouvements])
  const formatDate = (value) =>
    new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value))

  return (
    <section className="page">
      <PageHeader
        title="Caisse"
        description="Lecture rapide des entrees, sorties et soldes journaliers."
        actions={solde ? <span className="badge success">Solde {formatCurrency(solde.solde)}</span> : null}
      />
      <div className="stats-grid">
        <StatCard label="Solde" value={formatCurrency(solde?.solde || 0)} hint="Tresorerie actuelle" />
        <StatCard label="Entrees" value={formatCurrency(totals.entrees)} hint="Encaissements cumules" />
        <StatCard label="Sorties" value={formatCurrency(totals.sorties)} hint="Charges cumulees" />
        <StatCard label="Mouvements" value={solde?.mouvements || mouvements.length} hint="Journal de caisse" />
      </div>

      <div className="list-grid">
        <article className="panel">
          <div className="panel-header">
            <h3>Entrees</h3>
            <span className="badge success">Encaissements</span>
          </div>
          <div className="list">
            {entrees.map((mouvement) => (
              <div className="list-item" key={mouvement.id}>
                <span>{mouvement.description}</span>
                <strong>{formatCurrency(mouvement.montant)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h3>Sorties</h3>
            <span className="badge danger">Charges</span>
          </div>
          <div className="list">
            {sorties.map((mouvement) => (
              <div className="list-item" key={mouvement.id}>
                <span>{mouvement.description}</span>
                <strong>{formatCurrency(mouvement.montant)}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="panel">
        <div className="panel-header">
          <h3>Mouvements recents</h3>
          {feedback ? <span className="badge">{feedback}</span> : <span className="badge success">Historique</span>}
        </div>
        {!recentMouvements.length ? (
          <div className="empty-state">Aucun mouvement enregistre.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Reference</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                {recentMouvements.map((mouvement) => (
                  <tr key={mouvement.id}>
                    <td>{formatDate(mouvement.date)}</td>
                    <td>{mouvement.type}</td>
                    <td>{mouvement.description}</td>
                    <td>{mouvement.reference || '-'}</td>
                    <td>{formatCurrency(mouvement.montant)}</td>
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

export default Caisse
