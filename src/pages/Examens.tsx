import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { useAppStore } from '../store/useAppStore.js'

const examenSchema = z.object({
  candidatId: z.string().min(1, 'Selectionnez un candidat'),
  date: z.string().min(1, 'Date requise'),
  type: z.enum(['CODE', 'CONDUITE']),
  resultat: z.enum(['EN_ATTENTE', 'RECU', 'AJOURNE']),
  note: z.string().optional(),
  centre: z.string().optional(),
  notes: z.string().optional(),
})

const typeLabels = {
  CODE: 'Code',
  CONDUITE: 'Conduite',
}

const resultLabels = {
  EN_ATTENTE: 'En attente',
  RECU: 'Recu',
  AJOURNE: 'Ajourne',
}

const formatDate = (value) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))

function normalizeFallbackCandidats(items) {
  return items.map((item, index) => ({
    id: index + 1,
    prenom: item.prenom,
    nom: item.nom,
  }))
}

function normalizeFallbackExamens(items) {
  return items
    .map((item, index) => ({
      id: index + 1,
      candidatId: index + 1,
      date: new Date(Date.now() + (index + 7) * 86_400_000).toISOString(),
      type: index % 2 === 0 ? 'CONDUITE' : 'CODE',
      resultat: index === 0 ? 'EN_ATTENTE' : 'RECU',
      note: index === 0 ? null : 28 + index,
      centre: 'Centre Plateau',
      notes: item.statut,
      candidat: {
        id: index + 1,
        prenom: item.prenom,
        nom: item.nom,
      },
    }))
    .slice(0, 3)
}

async function fetchExamensData({ hasDesktopApi, fallbackCandidats }) {
  if (hasDesktopApi) {
    const [examensData, candidatsData] = await Promise.all([
      window.api.examen.list(),
      window.api.candidat.list(),
    ])

    return {
      examens: examensData,
      candidats: candidatsData,
    }
  }

  return {
    candidats: normalizeFallbackCandidats(fallbackCandidats),
    examens: normalizeFallbackExamens(fallbackCandidats),
  }
}

function Examens() {
  const fallbackCandidats = useAppStore((state) => state.candidats)
  const [examens, setExamens] = useState([])
  const [candidats, setCandidats] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingExamen, setEditingExamen] = useState(null)
  const [resultFilter, setResultFilter] = useState('TOUS')
  const hasDesktopApi =
    typeof window !== 'undefined' && window.api?.examen && window.api?.candidat

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(examenSchema),
    defaultValues: {
      candidatId: '',
      date: '',
      type: 'CONDUITE',
      resultat: 'EN_ATTENTE',
      note: '',
      centre: '',
      notes: '',
    },
  })

  async function loadExamens() {
    setLoading(true)

    try {
      const data = await fetchExamensData({ hasDesktopApi, fallbackCandidats })
      setExamens(data.examens)
      setCandidats(data.candidats)
      setFeedback('')
    } catch (error) {
      setFeedback(error.message || 'Impossible de charger les examens.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    async function loadInitialExamens() {
      setLoading(true)

      try {
        const data = await fetchExamensData({ hasDesktopApi, fallbackCandidats })

        if (!active) {
          return
        }

        setExamens(data.examens)
        setCandidats(data.candidats)
        setFeedback('')
      } catch (error) {
        if (active) {
          setFeedback(error.message || 'Impossible de charger les examens.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadInitialExamens()

    return () => {
      active = false
    }
  }, [hasDesktopApi, fallbackCandidats])

  const filteredExamens = useMemo(
    () => examens.filter((item) => resultFilter === 'TOUS' || item.resultat === resultFilter),
    [examens, resultFilter],
  )

  const stats = useMemo(() => {
    const pending = examens.filter((item) => item.resultat === 'EN_ATTENTE').length
    const success = examens.filter((item) => item.resultat === 'RECU').length
    const failed = examens.filter((item) => item.resultat === 'AJOURNE').length
    const average =
      examens.filter((item) => item.note != null).reduce((sum, item, _, arr) => sum + Number(item.note || 0) / arr.length, 0) || 0

    return {
      pending,
      success,
      failed,
      average: Math.round(average * 10) / 10,
    }
  }, [examens])

  function openCreateModal() {
    setEditingExamen(null)
    reset({
      candidatId: '',
      date: new Date().toISOString().slice(0, 10),
      type: 'CONDUITE',
      resultat: 'EN_ATTENTE',
      note: '',
      centre: '',
      notes: '',
    })
    setShowModal(true)
  }

  function openEditModal(examen) {
    setEditingExamen(examen)
    reset({
      candidatId: String(examen.candidatId || ''),
      date: new Date(examen.date).toISOString().slice(0, 10),
      type: examen.type || 'CONDUITE',
      resultat: examen.resultat || 'EN_ATTENTE',
      note: examen.note != null ? String(examen.note) : '',
      centre: examen.centre || '',
      notes: examen.notes || '',
    })
    setShowModal(true)
  }

  async function onSubmit(values) {
    const payload = {
      ...values,
      note: values.note === '' ? null : Number(values.note),
      centre: values.centre || null,
      notes: values.notes || null,
      date: new Date(values.date).toISOString(),
    }

    try {
      if (hasDesktopApi) {
        if (editingExamen) {
          await window.api.examen.update(editingExamen.id, payload)
          setFeedback('Examen mis a jour.')
        } else {
          await window.api.examen.create(payload)
          setFeedback('Examen ajoute.')
        }
        await loadExamens()
      } else {
        const candidat = candidats.find((item) => String(item.id) === values.candidatId)
        setExamens((current) =>
          editingExamen
            ? current.map((item) =>
                item.id === editingExamen.id
                  ? {
                      ...item,
                      ...payload,
                      candidatId: Number(values.candidatId),
                      candidat,
                    }
                  : item,
              )
            : [
                {
                  id: current.length ? Math.max(...current.map((item) => Number(item.id))) + 1 : 1,
                  ...payload,
                  candidatId: Number(values.candidatId),
                  candidat,
                },
                ...current,
              ],
        )
        setFeedback(editingExamen ? 'Examen mis a jour.' : 'Examen ajoute.')
      }

      setShowModal(false)
      setEditingExamen(null)
      reset()
    } catch (error) {
      setFeedback(error.message || 'Impossible de sauvegarder cet examen.')
    }
  }

  async function handleDelete(id) {
    try {
      if (hasDesktopApi) {
        await window.api.examen.delete(id)
        await loadExamens()
      } else {
        setExamens((current) => current.filter((item) => item.id !== id))
      }
      setFeedback('Examen supprime.')
    } catch (error) {
      setFeedback(error.message || 'Suppression impossible.')
    }
  }

  return (
    <section className="page">
      <PageHeader
        title="Examens"
        description="Suivi des passages code et conduite avec centres, notes et resultats."
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            Nouvel examen
          </button>
        }
      />

      <div className="stats-grid">
        <StatCard label="En attente" value={stats.pending} hint="Sessions a venir" />
        <StatCard label="Reussites" value={stats.success} hint="Resultats positifs" />
        <StatCard label="Ajournes" value={stats.failed} hint="A reprogrammer" />
        <StatCard label="Moyenne notes" value={stats.average || 0} hint="Examens notes" />
      </div>

      <article className="panel">
        <div className="panel-header">
          <h3>Suivi des passages</h3>
          {feedback ? <span className="badge">{feedback}</span> : null}
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Filtrer par resultat</span>
            <select value={resultFilter} onChange={(event) => setResultFilter(event.target.value)}>
              <option value="TOUS">Tous</option>
              {Object.entries(resultLabels).map(([key, label]) => (
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
          <h3>Planning examens</h3>
          <span className="badge success">{filteredExamens.length} lignes</span>
        </div>
        {loading ? (
          <div className="empty-state">Chargement des examens...</div>
        ) : !filteredExamens.length ? (
          <div className="empty-state">Aucun examen disponible.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Candidat</th>
                  <th>Type</th>
                  <th>Centre</th>
                  <th>Resultat</th>
                  <th>Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExamens.map((examen) => (
                  <tr key={examen.id}>
                    <td>{formatDate(examen.date)}</td>
                    <td>{examen.candidat?.prenom} {examen.candidat?.nom}</td>
                    <td>{typeLabels[examen.type] || examen.type}</td>
                    <td>{examen.centre || '-'}</td>
                    <td>{resultLabels[examen.resultat] || examen.resultat}</td>
                    <td>{examen.note ?? '-'}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="btn btn-secondary btn-small" onClick={() => openEditModal(examen)}>
                          Modifier
                        </button>
                        <button type="button" className="btn btn-secondary btn-small" onClick={() => handleDelete(examen.id)}>
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
              <h3>{editingExamen ? 'Modifier un examen' : 'Nouvel examen'}</h3>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => {
                  setShowModal(false)
                  setEditingExamen(null)
                  reset()
                }}
              >
                Fermer
              </button>
            </div>

            <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
              <div className="form-grid two-cols">
                <label className="field">
                  <span>Candidat</span>
                  <select {...register('candidatId')}>
                    <option value="">Selectionner un candidat</option>
                    {candidats.map((candidat) => (
                      <option key={candidat.id} value={candidat.id}>
                        {candidat.prenom} {candidat.nom}
                      </option>
                    ))}
                  </select>
                  {errors.candidatId ? <small className="form-error">{errors.candidatId.message}</small> : null}
                </label>
                <label className="field">
                  <span>Date</span>
                  <input {...register('date')} type="date" />
                  {errors.date ? <small className="form-error">{errors.date.message}</small> : null}
                </label>
              </div>

              <div className="form-grid two-cols">
                <label className="field">
                  <span>Type</span>
                  <select {...register('type')}>
                    {Object.entries(typeLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Resultat</span>
                  <select {...register('resultat')}>
                    {Object.entries(resultLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-grid two-cols">
                <label className="field">
                  <span>Centre</span>
                  <input {...register('centre')} placeholder="Centre Plateau" />
                </label>
                <label className="field">
                  <span>Note</span>
                  <input {...register('note')} type="number" min="0" max="31" placeholder="28" />
                </label>
              </div>

              <label className="field">
                <span>Notes</span>
                <textarea {...register('notes')} placeholder="Observation ou commentaire..." />
              </label>

              <div className="toolbar-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false)
                    setEditingExamen(null)
                    reset()
                  }}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Sauvegarde...' : editingExamen ? 'Mettre a jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default Examens
