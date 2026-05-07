import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { useAppStore } from '../store/useAppStore.js'
import { formatCurrency } from '../utils/currency.js'

const formationSchema = z.object({
  nom: z.string().min(2, 'Nom requis'),
  description: z.string().optional(),
  prixTotal: z
    .string()
    .min(1, 'Prix requis')
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
      message: 'Prix invalide',
    }),
  heuresCode: z
    .string()
    .refine((value) => value === '' || (!Number.isNaN(Number(value)) && Number(value) >= 0), {
      message: 'Valeur invalide',
    }),
  heuresConduite: z
    .string()
    .refine((value) => value === '' || (!Number.isNaN(Number(value)) && Number(value) >= 0), {
      message: 'Valeur invalide',
    }),
  categorie: z.enum(['A', 'B', 'C', 'D', 'BE']),
})

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
    nom: item.nom,
    description: '',
    prixTotal: Number(String(item.heures).replace(/[^\d]/g, '')) * 50 || 0,
    heuresCode: 20,
    heuresConduite: Number(String(item.heures).replace(/[^\d]/g, '')) || 20,
    categorie: 'B',
    actif: true,
    candidatsCount: 0,
  }))
}

function Formation() {
  const fallback = useAppStore((state) => state.formations)
  const [formations, setFormations] = useState(normalizeFallback(fallback))
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingFormation, setEditingFormation] = useState(null)
  const hasDesktopApi = typeof window !== 'undefined' && window.api?.formation

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(formationSchema),
    defaultValues: {
      nom: '',
      description: '',
      prixTotal: '',
      heuresCode: '20',
      heuresConduite: '20',
      categorie: 'B',
    },
  })

  useEffect(() => {
    let active = true

    async function loadFormations() {
      try {
        if (!hasDesktopApi) {
          if (active) {
            setFormations(normalizeFallback(fallback))
            setLoading(false)
          }
          return
        }

        const data = await window.api.formation.list()
        if (active) {
          setFormations(data)
          setFeedback('')
        }
      } catch (error) {
        if (active) {
          setFeedback(error.message || 'Impossible de charger les formations.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadFormations()

    return () => {
      active = false
    }
  }, [fallback, hasDesktopApi])

  const stats = useMemo(() => {
    const total = formations.length
    const actifs = formations.filter((item) => item.actif !== false).length
    const heures = formations.reduce((sum, item) => sum + Number(item.heuresConduite || 0), 0)
    const candidats = formations.reduce((sum, item) => sum + Number(item.candidatsCount || 0), 0)

    return { total, actifs, heures, candidats }
  }, [formations])

  async function reloadFormations() {
    if (!hasDesktopApi) {
      return
    }

    const data = await window.api.formation.list()
    setFormations(data)
  }

  function openCreateModal() {
    setEditingFormation(null)
    reset({
      nom: '',
      description: '',
      prixTotal: '',
      heuresCode: '20',
      heuresConduite: '20',
      categorie: 'B',
    })
    setShowModal(true)
  }

  function openEditModal(formation) {
    setEditingFormation(formation)
    reset({
      nom: formation.nom || '',
      description: formation.description || '',
      prixTotal: formation.prixTotal ? String(formation.prixTotal) : '',
      heuresCode: formation.heuresCode != null ? String(formation.heuresCode) : '0',
      heuresConduite:
        formation.heuresConduite != null ? String(formation.heuresConduite) : '20',
      categorie: formation.categorie || 'B',
    })
    setShowModal(true)
  }

  async function onSubmit(values) {
    const payload = {
      ...values,
      prixTotal: Number(values.prixTotal),
      heuresCode: values.heuresCode === '' ? 0 : Number(values.heuresCode),
      heuresConduite: values.heuresConduite === '' ? 0 : Number(values.heuresConduite),
      description: values.description || null,
      actif: true,
    }

    try {
      if (hasDesktopApi) {
        if (editingFormation) {
          await window.api.formation.update(editingFormation.id, payload)
          setFeedback('Formation mise a jour.')
        } else {
          await window.api.formation.create(payload)
          setFeedback('Formation ajoutee.')
        }
        await reloadFormations()
      } else {
        setFormations((current) => [
          {
            id: current.length ? Math.max(...current.map((item) => Number(item.id))) + 1 : 1,
            ...payload,
            candidatsCount: 0,
          },
          ...current,
        ])
      }

      setShowModal(false)
      setEditingFormation(null)
      reset()
    } catch (error) {
      setFeedback(error.message || 'Impossible de sauvegarder la formation.')
    }
  }

  async function handleDelete(id) {
    try {
      if (hasDesktopApi) {
        const result = await window.api.formation.delete(id)
        await reloadFormations()
        setFeedback(result.archived ? 'Formation archivee car deja liee a des candidats.' : 'Formation supprimee.')
      } else {
        setFormations((current) => current.filter((item) => item.id !== id))
        setFeedback('Formation supprimee.')
      }
    } catch (error) {
      setFeedback(error.message || 'Suppression impossible.')
    }
  }

  return (
    <section className="page">
      <PageHeader
        title="Formation"
        description="Catalogue des parcours proposes et suivi pedagogique."
        actions={
          <button type="button" className="btn btn-secondary" onClick={openCreateModal}>
            Ajouter une formule
          </button>
        }
      />

      <div className="stats-grid">
        <StatCard label="Formules" value={stats.total} hint="Catalogue total" />
        <StatCard label="Actives" value={stats.actifs} hint="Offres disponibles" />
        <StatCard label="Heures conduite" value={stats.heures} hint="Volume cumule" />
        <StatCard label="Affectations" value={stats.candidats} hint="Candidats relies" />
      </div>

      {feedback ? <div className="panel-subtitle">{feedback}</div> : null}

      {loading ? (
        <div className="empty-state">Chargement des formations...</div>
      ) : (
        <div className="list-grid">
          {formations.map((formation) => (
            <article className="panel" key={formation.id}>
              <div className="stack">
                <span className="badge">
                  {formation.heuresCode}h code / {formation.heuresConduite}h conduite
                </span>
                <h3>{formation.nom}</h3>
                <p className="panel-subtitle">
                  {formation.description || 'Description non renseignee'}
                </p>
                <div className="split-line">
                  <span className="muted">{categoryLabels[formation.categorie] || formation.categorie}</span>
                  <strong>{formatCurrency(formation.prixTotal)}</strong>
                </div>
                <div className="split-line">
                  <span className="muted">{formation.candidatsCount} candidat(s)</span>
                  <span className={`badge${formation.actif ? ' success' : ''}`}>
                    {formation.actif ? 'Active' : 'Archivee'}
                  </span>
                </div>
                <div className="table-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => openEditModal(formation)}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => handleDelete(formation.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {showModal ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-card">
            <div className="panel-header">
              <h3>{editingFormation ? 'Modifier une formation' : 'Nouvelle formation'}</h3>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => {
                  setShowModal(false)
                  setEditingFormation(null)
                  reset()
                }}
              >
                Fermer
              </button>
            </div>

            <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
              <label className="field">
                <span>Nom</span>
                <input {...register('nom')} placeholder="Permis B accelere" />
                {errors.nom ? <small className="form-error">{errors.nom.message}</small> : null}
              </label>

              <label className="field">
                <span>Description</span>
                <textarea {...register('description')} placeholder="Code + conduite" />
              </label>

              <div className="form-grid two-cols">
                <label className="field">
                  <span>Prix total</span>
                  <input {...register('prixTotal')} type="number" min="0" placeholder="1400" />
                  {errors.prixTotal ? <small className="form-error">{errors.prixTotal.message}</small> : null}
                </label>
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
              </div>

              <div className="form-grid two-cols">
                <label className="field">
                  <span>Heures code</span>
                  <input {...register('heuresCode')} type="number" min="0" placeholder="20" />
                  {errors.heuresCode ? <small className="form-error">{errors.heuresCode.message}</small> : null}
                </label>
                <label className="field">
                  <span>Heures conduite</span>
                  <input {...register('heuresConduite')} type="number" min="0" placeholder="20" />
                  {errors.heuresConduite ? (
                    <small className="form-error">{errors.heuresConduite.message}</small>
                  ) : null}
                </label>
              </div>

              <div className="toolbar-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false)
                    setEditingFormation(null)
                    reset()
                  }}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Sauvegarde...' : editingFormation ? 'Mettre a jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default Formation
