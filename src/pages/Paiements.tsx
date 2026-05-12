import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { useAppStore } from '../store/useAppStore.js'
import { formatCurrency } from '../utils/currency.js'

const paiementSchema = z.object({
  candidatId: z.string().min(1, 'Selectionnez un candidat'),
  montant: z
    .string()
    .min(1, 'Montant requis')
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
      message: 'Montant invalide',
    }),
  mode: z.enum(['ESPECES', 'CHEQUE', 'VIREMENT', 'CARTE', 'MOBILE_MONEY']),
  reference: z.string().optional(),
  note: z.string().optional(),
})

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

function Paiements() {
  const storeCandidats = useAppStore((state) => state.candidats)
  const [paiements, setPaiements] = useState([])
  const [candidats, setCandidats] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [detailCandidat, setDetailCandidat] = useState(null)
  const [search, setSearch] = useState('')
  const [filterMode, setFilterMode] = useState('TOUS')
  const [feedback, setFeedback] = useState('')

  const hasDesktopApi = typeof window !== 'undefined' && window.api?.paiement && window.api?.candidat

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(paiementSchema),
    defaultValues: {
      candidatId: '',
      montant: '',
      mode: 'ESPECES',
      reference: '',
      note: '',
    },
  })

  useEffect(() => {
    async function loadData() {
      setLoading(true)

      try {
        if (hasDesktopApi) {
          const [paiementsData, candidatsData] = await Promise.all([
            window.api.paiement.list(),
            window.api.candidat.list(),
          ])
          setPaiements(paiementsData)
          setCandidats(candidatsData)
        } else {
          const fallbackPaiements = useAppStore.getState().paiements.map((item, index) => {
            const [prenom, nom] = item.candidat.split(' ')
            const candidat = storeCandidats.find(
              (entry) => entry.prenom === prenom && entry.nom === nom,
            )

            return {
              id: index + 1,
              candidatId: candidat ? Number(index + 1) : index + 1,
              montant: Number(String(item.montant).replace(/[^\d]/g, '')) || 0,
              date: new Date().toISOString(),
              mode:
                item.mode === 'CB'
                  ? 'CARTE'
                  : item.mode === 'Especes'
                    ? 'ESPECES'
                    : 'VIREMENT',
              reference: '',
              note: '',
              candidat: candidat
                ? { id: index + 1, prenom: candidat.prenom, nom: candidat.nom }
                : { id: index + 1, prenom, nom },
            }
          })

          setPaiements(fallbackPaiements)
          setCandidats(
            storeCandidats.map((item, index) => ({
              id: index + 1,
              prenom: item.prenom,
              nom: item.nom,
              montantTotal: Number(String(item.resteARegler).replace(/[^\d]/g, '')) + 900,
            })),
          )
        }

        setFeedback('')
      } catch (error) {
        setFeedback(error.message || 'Erreur lors du chargement.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [hasDesktopApi, storeCandidats])

  const stats = useMemo(() => {
    const total = paiements.reduce((sum, item) => sum + Number(item.montant || 0), 0)
    const parMode = paiements.reduce((acc, item) => {
      acc[item.mode] = (acc[item.mode] || 0) + Number(item.montant || 0)
      return acc
    }, {})

    return {
      total,
      parMode,
      count: paiements.length,
    }
  }, [paiements])

  const filteredPaiements = useMemo(
    () =>
      paiements.filter((item) => {
        const fullName = `${item.candidat?.prenom || ''} ${item.candidat?.nom || ''}`.toLowerCase()
        const matchSearch = fullName.includes(search.toLowerCase())
        const matchMode = filterMode === 'TOUS' || item.mode === filterMode
        return matchSearch && matchMode
      }),
    [filterMode, paiements, search],
  )

  const selectedCandidatId = useWatch({ control, name: 'candidatId' })
  const selectedCandidat = candidats.find((item) => String(item.id) === selectedCandidatId)

  async function onSubmit(data) {
    try {
      if (hasDesktopApi) {
        await window.api.paiement.create(data)
        const [paiementsData, candidatsData] = await Promise.all([
          window.api.paiement.list(),
          window.api.candidat.list(),
        ])
        setPaiements(paiementsData)
        setCandidats(candidatsData)
      } else {
        const candidat = candidats.find((item) => String(item.id) === data.candidatId)
        setPaiements((current) => [
          {
            id: current.length + 1,
            candidatId: Number(data.candidatId),
            montant: Number(data.montant),
            date: new Date().toISOString(),
            mode: data.mode,
            reference: data.reference || '',
            note: data.note || '',
            candidat: candidat
              ? { id: candidat.id, prenom: candidat.prenom, nom: candidat.nom }
              : null,
          },
          ...current,
        ])
      }

      reset()
      setShowModal(false)
      setFeedback('Paiement enregistre avec succes.')
    } catch (error) {
      setFeedback(error.message || 'Impossible d enregistrer le paiement.')
    }
  }

  async function handleDelete(id) {
    try {
      if (hasDesktopApi) {
        await window.api.paiement.delete(id)
        const paiementsData = await window.api.paiement.list()
        setPaiements(paiementsData)
      } else {
        setPaiements((current) => current.filter((item) => item.id !== id))
      }

      setFeedback('Paiement supprime.')
    } catch (error) {
      setFeedback(error.message || 'Impossible de supprimer ce paiement.')
    }
  }

  async function openDetail(candidatId) {
    try {
      if (hasDesktopApi) {
        const detail = await window.api.paiement.byCandidat(candidatId)
        setDetailCandidat(detail)
        return
      }

      const candidat = candidats.find((item) => item.id === candidatId)
      const historique = paiements.filter((item) => item.candidatId === candidatId)
      const totalPaye = historique.reduce((sum, item) => sum + Number(item.montant || 0), 0)
      const montantTotal = Number(candidat?.montantTotal || 0)
      const resteAPayer = Math.max(montantTotal - totalPaye, 0)

      setDetailCandidat({
        candidat,
        paiements: historique,
        montantTotal,
        totalPaye,
        resteAPayer,
        pourcentage: montantTotal ? Math.round((totalPaye / montantTotal) * 100) : 0,
        estSolde: resteAPayer <= 0,
      })
    } catch (error) {
      setFeedback(error.message || 'Impossible de charger le detail.')
    }
  }

  return (
    <section className="page">
      <PageHeader
        title="Paiements"
        description="Module de reglement avec validation, filtres, detail candidat et progression du solde."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
            Nouveau paiement
          </button>
        }
      />

      <div className="stats-grid">
        <StatCard label="Total encaisse" value={formatCurrency(stats.total)} hint="Toutes transactions" />
        <StatCard
          label="Especes"
          value={formatCurrency(stats.parMode.ESPECES || 0)}
          hint="Encaissements cash"
        />
        <StatCard
          label="Virement + cheque"
          value={formatCurrency((stats.parMode.VIREMENT || 0) + (stats.parMode.CHEQUE || 0))}
          hint="Flux bancaires"
        />
        <StatCard label="Transactions" value={stats.count} hint="Paiements enregistres" />
      </div>

      <article className="panel">
        <div className="panel-header">
          <h3>Filtres</h3>
          {feedback ? <span className="badge">{feedback}</span> : null}
        </div>
        <div className="form-grid two-cols">
          <label className="field">
            <span>Rechercher un candidat</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom ou prenom"
            />
          </label>
          <label className="field">
            <span>Mode de paiement</span>
            <select value={filterMode} onChange={(event) => setFilterMode(event.target.value)}>
              <option value="TOUS">Tous</option>
              {Object.entries(modeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </article>

      <article className="panel">
        <div className="panel-header">
          <h3>Paiements recents</h3>
          <span className="badge success">{filteredPaiements.length} lignes</span>
        </div>

        {loading ? (
          <div className="empty-state">Chargement des paiements...</div>
        ) : filteredPaiements.length === 0 ? (
          <div className="empty-state">Aucun paiement ne correspond aux filtres.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Candidat</th>
                  <th>Montant</th>
                  <th>Mode</th>
                  <th>Reference</th>
                  <th>Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPaiements.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.date)}</td>
                    <td>
                      {item.candidat?.prenom} {item.candidat?.nom}
                    </td>
                    <td>{formatCurrency(item.montant)}</td>
                    <td>{modeLabels[item.mode] || item.mode}</td>
                    <td>{item.reference || '-'}</td>
                    <td>{item.note || '-'}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => openDetail(item.candidatId)}
                        >
                          Detail
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => handleDelete(item.id)}
                        >
                          Supprimer
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

      {showModal ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-card">
            <div className="panel-header">
              <h3>Nouveau paiement</h3>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => {
                  setShowModal(false)
                  reset()
                }}
              >
                Fermer
              </button>
            </div>

            <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
              <label className="field">
                <span>Candidat</span>
                <select {...register('candidatId')}>
                  <option value="">Selectionner un candidat</option>
                  {candidats.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.prenom} {item.nom}
                    </option>
                  ))}
                </select>
                {errors.candidatId ? <small className="form-error">{errors.candidatId.message}</small> : null}
              </label>

              <div className="form-grid two-cols">
                <label className="field">
                  <span>Montant</span>
                  <input {...register('montant')} type="number" min="1" placeholder="350" />
                  {errors.montant ? <small className="form-error">{errors.montant.message}</small> : null}
                </label>
                <label className="field">
                  <span>Mode</span>
                  <select {...register('mode')}>
                    {Object.entries(modeLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {selectedCandidat ? (
                <div className="candidate-preview">
                  <strong>
                    {selectedCandidat.prenom} {selectedCandidat.nom}
                  </strong>
                  <span className="muted">
                    Contrat estime : {formatCurrency(selectedCandidat.montantTotal || 0)}
                  </span>
                </div>
              ) : null}

              <label className="field">
                <span>Reference</span>
                <input {...register('reference')} placeholder="Cheque, virement..." />
              </label>

              <label className="field">
                <span>Note</span>
                <textarea {...register('note')} placeholder="Commentaire optionnel" />
              </label>

              <div className="toolbar-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false)
                    reset()
                  }}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {detailCandidat ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-card">
            <div className="panel-header">
              <h3>
                Suivi paiement {detailCandidat.candidat?.prenom} {detailCandidat.candidat?.nom}
              </h3>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => setDetailCandidat(null)}
              >
                Fermer
              </button>
            </div>

            <div className="detail-grid">
              <div className="progress-card">
                <div className="split-line">
                  <span>Progression</span>
                  <strong>{detailCandidat.pourcentage}%</strong>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-value${detailCandidat.estSolde ? ' success' : ''}`}
                    style={{ width: `${Math.min(detailCandidat.pourcentage, 100)}%` }}
                  />
                </div>
              </div>

              <div className="stats-grid detail-stats">
                <StatCard label="Total formation" value={formatCurrency(detailCandidat.montantTotal)} />
                <StatCard label="Total paye" value={formatCurrency(detailCandidat.totalPaye)} />
                <StatCard
                  label="Reste a payer"
                  value={formatCurrency(detailCandidat.resteAPayer)}
                  hint={detailCandidat.estSolde ? 'Solde complet' : 'Paiement en cours'}
                />
              </div>

              <article className="panel">
                <div className="panel-header">
                  <h3>Historique</h3>
                  <span className={`badge${detailCandidat.estSolde ? ' success' : ''}`}>
                    {detailCandidat.estSolde ? 'Solde' : 'En cours'}
                  </span>
                </div>
                <div className="list">
                  {detailCandidat.paiements.map((item) => (
                    <div className="list-item" key={item.id}>
                      <div className="stack">
                        <strong>{formatCurrency(item.montant)}</strong>
                        <span className="muted">{formatDate(item.date)}</span>
                      </div>
                      <div className="stack">
                        <span className="badge">{modeLabels[item.mode] || item.mode}</span>
                        <span className="muted">{item.reference || '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default Paiements
