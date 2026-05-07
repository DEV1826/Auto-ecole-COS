import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { useAppStore } from '../store/useAppStore.js'
import { formatCurrency } from '../utils/currency.js'

const candidatSchema = z.object({
  prenom: z.string().min(2, 'Prenom requis'),
  nom: z.string().min(2, 'Nom requis'),
  email: z.union([z.string().email('Email invalide'), z.literal('')]),
  telephone: z.string().optional(),
  categorie: z.enum(['A', 'B', 'C', 'D', 'BE']),
  statut: z.enum(['EN_COURS', 'RECU', 'ECHOUE', 'ABANDONNE', 'EN_ATTENTE']),
  montantTotal: z
    .string()
    .refine((value) => value === '' || (!Number.isNaN(Number(value)) && Number(value) >= 0), {
      message: 'Montant invalide',
    }),
})

const statusLabels = {
  EN_COURS: 'En cours',
  RECU: 'Recu',
  ECHOUE: 'Echoue',
  ABANDONNE: 'Abandonne',
  EN_ATTENTE: 'En attente',
}

const categoryLabels = {
  A: 'Permis A',
  B: 'Permis B',
  C: 'Permis C',
  D: 'Permis D',
  BE: 'Permis BE',
}

function normalizeFallback(items) {
  return items.map((item, index) => ({
    id: index + 1,
    prenom: item.prenom,
    nom: item.nom,
    email: '',
    telephone: '',
    categorie: 'B',
    statut: 'EN_COURS',
    montantTotal: Number(String(item.resteARegler).replace(/[^\d]/g, '')) + 900,
    totalPaye: 0,
    resteARegler: Number(String(item.resteARegler).replace(/[^\d]/g, '')) || 0,
    formationNom: item.formule,
  }))
}

function Candidats() {
  const fallback = useAppStore((state) => state.candidats)
  const [candidats, setCandidats] = useState(normalizeFallback(fallback))
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('TOUS')
  const [showModal, setShowModal] = useState(false)
  const [editingCandidat, setEditingCandidat] = useState(null)
  const hasDesktopApi = typeof window !== 'undefined' && window.api?.candidat

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(candidatSchema),
    defaultValues: {
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
      categorie: 'B',
      statut: 'EN_COURS',
      montantTotal: '',
    },
  })

  async function loadCandidats() {
    setLoading(true)

    try {
      if (!hasDesktopApi) {
        setCandidats(normalizeFallback(fallback))
        setLoading(false)
        return
      }

      const data = await window.api.candidat.list()
      setCandidats(data)
      setFeedback('')
    } catch (error) {
      setFeedback(error.message || 'Impossible de charger les candidats.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    async function loadInitialCandidats() {
      try {
        if (!hasDesktopApi) {
          if (active) {
            setCandidats(normalizeFallback(fallback))
            setLoading(false)
          }
          return
        }

        const data = await window.api.candidat.list()
        if (active) {
          setCandidats(data)
          setFeedback('')
        }
      } catch (error) {
        if (active) {
          setFeedback(error.message || 'Impossible de charger les candidats.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadInitialCandidats()

    return () => {
      active = false
    }
  }, [fallback, hasDesktopApi])

  const filteredCandidats = useMemo(
    () =>
      candidats.filter((item) => {
        const haystack =
          `${item.prenom} ${item.nom} ${item.email || ''} ${item.telephone || ''}`.toLowerCase()
        const matchesSearch = haystack.includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'TOUS' || item.statut === statusFilter
        return matchesSearch && matchesStatus
      }),
    [candidats, search, statusFilter],
  )

  const stats = useMemo(() => {
    const actifs = candidats.filter((item) => item.statut === 'EN_COURS').length
    const soldes = candidats.filter((item) => Number(item.resteARegler || 0) <= 0).length
    const totalRestant = candidats.reduce((sum, item) => sum + Number(item.resteARegler || 0), 0)
    const totalContrats = candidats.reduce((sum, item) => sum + Number(item.montantTotal || 0), 0)

    return {
      actifs,
      soldes,
      totalRestant,
      totalContrats,
    }
  }, [candidats])

  function openCreateModal() {
    setEditingCandidat(null)
    reset({
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
      categorie: 'B',
      statut: 'EN_COURS',
      montantTotal: '',
    })
    setShowModal(true)
  }

  function openEditModal(candidat) {
    setEditingCandidat(candidat)
    reset({
      prenom: candidat.prenom || '',
      nom: candidat.nom || '',
      email: candidat.email || '',
      telephone: candidat.telephone || '',
      categorie: candidat.categorie || 'B',
      statut: candidat.statut || 'EN_COURS',
      montantTotal: candidat.montantTotal ? String(candidat.montantTotal) : '',
    })
    setShowModal(true)
  }

  async function onSubmit(values) {
    const payload = {
      ...values,
      email: values.email || null,
      telephone: values.telephone || null,
      montantTotal: values.montantTotal === '' ? null : Number(values.montantTotal),
    }

    try {
      if (hasDesktopApi) {
        if (editingCandidat) {
          await window.api.candidat.update(editingCandidat.id, payload)
          setFeedback('Candidat mis a jour.')
        } else {
          await window.api.candidat.create(payload)
          setFeedback('Candidat ajoute.')
        }

        await loadCandidats()
      } else {
        setCandidats((current) =>
          editingCandidat
            ? current.map((item) =>
                item.id === editingCandidat.id
                  ? {
                      ...item,
                      ...payload,
                      resteARegler: payload.montantTotal || 0,
                      totalPaye: 0,
                      formationNom: null,
                    }
                  : item,
              )
            : [
                {
                  id: current.length ? Math.max(...current.map((item) => Number(item.id))) + 1 : 1,
                  ...payload,
                  resteARegler: payload.montantTotal || 0,
                  totalPaye: 0,
                  formationNom: null,
                },
                ...current,
              ],
        )
      }

      setShowModal(false)
      setEditingCandidat(null)
      reset()
    } catch (error) {
      setFeedback(error.message || 'Impossible de sauvegarder ce candidat.')
    }
  }

  async function handleDelete(id) {
    try {
      if (hasDesktopApi) {
        await window.api.candidat.delete(id)
        await loadCandidats()
      } else {
        setCandidats((current) => current.filter((item) => item.id !== id))
      }

      setFeedback('Candidat supprime.')
    } catch (error) {
      setFeedback(error.message || 'Suppression impossible.')
    }
  }

  return (
    <section className="page">
      <PageHeader
        title="Candidats"
        description="Gestion complete des eleves : inscription, suivi financier et statut pedagogique."
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            Nouveau dossier
          </button>
        }
      />

      <div className="stats-grid">
        <StatCard label="Candidats actifs" value={stats.actifs} hint="Dossiers en cours" />
        <StatCard label="Dossiers soldes" value={stats.soldes} hint="Paiement complet" />
        <StatCard label="Reste a regler" value={formatCurrency(stats.totalRestant)} hint="Encaissement futur" />
        <StatCard label="Montant contrats" value={formatCurrency(stats.totalContrats)} hint="Valeur portefeuille" />
      </div>

      <article className="panel">
        <div className="panel-header">
          <h3>Filtres</h3>
          {feedback ? <span className="badge">{feedback}</span> : null}
        </div>
        <div className="form-grid two-cols">
          <label className="field">
            <span>Recherche</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom, prenom, email, telephone"
            />
          </label>
          <label className="field">
            <span>Statut</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="TOUS">Tous</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </article>

      <div className="candidate-grid">
        {filteredCandidats.slice(0, 3).map((candidat) => {
          const pourcentage =
            Number(candidat.montantTotal || 0) > 0
              ? Math.min(
                  Math.round((Number(candidat.totalPaye || 0) / Number(candidat.montantTotal || 0)) * 100),
                  100,
                )
              : 0

          return (
            <article className="candidate-card" key={`card-${candidat.id}`}>
              <div className="split-line">
                <strong>
                  {candidat.prenom} {candidat.nom}
                </strong>
                <span className="badge">{categoryLabels[candidat.categorie] || candidat.categorie}</span>
              </div>
              <span className="muted">{statusLabels[candidat.statut] || candidat.statut}</span>
              <div className="progress-bar candidate-progress">
                <div className="progress-value" style={{ width: `${pourcentage}%` }} />
              </div>
              <div className="split-line">
                <span className="muted">Reste</span>
                <strong>{formatCurrency(candidat.resteARegler)}</strong>
              </div>
              <div className="table-actions">
                <button type="button" className="btn btn-secondary btn-small" onClick={() => openEditModal(candidat)}>
                  Modifier
                </button>
                <button type="button" className="btn btn-secondary btn-small" onClick={() => handleDelete(candidat.id)}>
                  Supprimer
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <article className="panel">
        <div className="panel-header">
          <h3>Liste des dossiers</h3>
          <span className="badge success">{filteredCandidats.length} affiches</span>
        </div>

        {loading ? (
          <div className="empty-state">Chargement des candidats...</div>
        ) : !filteredCandidats.length ? (
          <div className="empty-state">Aucun candidat ne correspond aux filtres.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Prenom</th>
                  <th>Nom</th>
                  <th>Categorie</th>
                  <th>Statut</th>
                  <th>Contrat</th>
                  <th>Reste a regler</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidats.map((candidat) => (
                  <tr key={candidat.id}>
                    <td>{candidat.prenom}</td>
                    <td>{candidat.nom}</td>
                    <td>{categoryLabels[candidat.categorie] || candidat.categorie}</td>
                    <td>{statusLabels[candidat.statut] || candidat.statut}</td>
                    <td>{formatCurrency(candidat.montantTotal)}</td>
                    <td>{formatCurrency(candidat.resteARegler)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => openEditModal(candidat)}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => handleDelete(candidat.id)}
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
              <h3>{editingCandidat ? 'Modifier un candidat' : 'Nouveau candidat'}</h3>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => {
                  setShowModal(false)
                  setEditingCandidat(null)
                  reset()
                }}
              >
                Fermer
              </button>
            </div>

            <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
              <div className="form-grid two-cols">
                <label className="field">
                  <span>Prenom</span>
                  <input {...register('prenom')} placeholder="Sara" />
                  {errors.prenom ? <small className="form-error">{errors.prenom.message}</small> : null}
                </label>
                <label className="field">
                  <span>Nom</span>
                  <input {...register('nom')} placeholder="Benali" />
                  {errors.nom ? <small className="form-error">{errors.nom.message}</small> : null}
                </label>
              </div>

              <div className="form-grid two-cols">
                <label className="field">
                  <span>Email</span>
                  <input {...register('email')} placeholder="sara@example.com" />
                  {errors.email ? <small className="form-error">{errors.email.message}</small> : null}
                </label>
                <label className="field">
                  <span>Telephone</span>
                  <input {...register('telephone')} placeholder="0611223344" />
                </label>
              </div>

              <div className="form-grid two-cols">
                <label className="field">
                  <span>Categorie</span>
                  <select {...register('categorie')}>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Statut</span>
                  <select {...register('statut')}>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="field">
                <span>Montant du contrat</span>
                <input {...register('montantTotal')} type="number" min="0" placeholder="1400" />
                {errors.montantTotal ? (
                  <small className="form-error">{errors.montantTotal.message}</small>
                ) : null}
              </label>

              <div className="toolbar-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false)
                    setEditingCandidat(null)
                    reset()
                  }}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Sauvegarde...' : editingCandidat ? 'Mettre a jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default Candidats
