import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { useAppStore } from '../store/useAppStore.js'
import { formatCurrency } from '../utils/currency.js'

const depenseSchema = z.object({
  categorie: z.enum([
    'CARBURANT',
    'ENTRETIEN_VEHICULE',
    'SALAIRE',
    'LOYER',
    'ELECTRICITE',
    'TELEPHONE',
    'ASSURANCE',
    'PUBLICITE',
    'FOURNITURES',
    'TAXES',
    'AUTRE',
  ]),
  montant: z
    .string()
    .min(1, 'Montant requis')
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
      message: 'Montant invalide',
    }),
  description: z.string().min(2, 'Description requise'),
  fournisseur: z.string().optional(),
  reference: z.string().optional(),
})

const categorieLabels = {
  CARBURANT: 'Carburant',
  ENTRETIEN_VEHICULE: 'Entretien vehicule',
  SALAIRE: 'Salaire',
  LOYER: 'Loyer',
  ELECTRICITE: 'Electricite',
  TELEPHONE: 'Telephone',
  ASSURANCE: 'Assurance',
  PUBLICITE: 'Publicite',
  FOURNITURES: 'Fournitures',
  TAXES: 'Taxes',
  AUTRE: 'Autre',
}

const formatDate = (value) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))

function normalizeFallback(items) {
  return items.map((item, index) => ({
    id: index + 1,
    categorie: 'AUTRE',
    montant: Number(String(item.montant).replace(/[^\d]/g, '')) || 0,
    description: item.label,
    fournisseur: '',
    reference: '',
    date: new Date().toISOString(),
  }))
}

function Depenses() {
  const fallback = useAppStore((state) => state.depenses)
  const [depenses, setDepenses] = useState(normalizeFallback(fallback))
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [categorieFilter, setCategorieFilter] = useState('TOUTES')
  const hasDesktopApi = typeof window !== 'undefined' && window.api?.depense

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(depenseSchema),
    defaultValues: {
      categorie: 'CARBURANT',
      montant: '',
      description: '',
      fournisseur: '',
      reference: '',
    },
  })

  useEffect(() => {
    let active = true

    async function loadDepenses() {
      try {
        if (!hasDesktopApi) {
          if (active) {
            setDepenses(normalizeFallback(fallback))
            setLoading(false)
          }
          return
        }

        const data = await window.api.depense.list()
        if (active) {
          setDepenses(data)
          setFeedback('')
        }
      } catch (error) {
        if (active) {
          setFeedback(error.message || 'Impossible de charger les depenses.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadDepenses()

    return () => {
      active = false
    }
  }, [fallback, hasDesktopApi])

  const filteredDepenses = useMemo(
    () =>
      depenses.filter((item) => {
        const haystack =
          `${item.description || ''} ${item.fournisseur || ''} ${item.reference || ''}`.toLowerCase()
        const matchesSearch = haystack.includes(search.toLowerCase())
        const matchesCategorie =
          categorieFilter === 'TOUTES' || item.categorie === categorieFilter
        return matchesSearch && matchesCategorie
      }),
    [categorieFilter, depenses, search],
  )

  const stats = useMemo(() => {
    const total = depenses.reduce((sum, item) => sum + Number(item.montant || 0), 0)
    const carburant = depenses
      .filter((item) => item.categorie === 'CARBURANT')
      .reduce((sum, item) => sum + Number(item.montant || 0), 0)
    const entretien = depenses
      .filter((item) => item.categorie === 'ENTRETIEN_VEHICULE')
      .reduce((sum, item) => sum + Number(item.montant || 0), 0)

    return {
      total,
      carburant,
      entretien,
      count: depenses.length,
    }
  }, [depenses])

  async function reloadDepenses() {
    if (!hasDesktopApi) {
      return
    }

    const data = await window.api.depense.list()
    setDepenses(data)
  }

  async function onSubmit(values) {
    const payload = {
      ...values,
      montant: Number(values.montant),
      fournisseur: values.fournisseur || null,
      reference: values.reference || null,
    }

    try {
      if (hasDesktopApi) {
        await window.api.depense.create(payload)
        await reloadDepenses()
      } else {
        setDepenses((current) => [
          {
            id: current.length ? Math.max(...current.map((item) => Number(item.id))) + 1 : 1,
            ...payload,
            date: new Date().toISOString(),
          },
          ...current,
        ])
      }

      reset()
      setShowModal(false)
      setFeedback('Depense ajoutee.')
    } catch (error) {
      setFeedback(error.message || 'Impossible d enregistrer la depense.')
    }
  }

  async function handleDelete(id) {
    try {
      if (hasDesktopApi) {
        await window.api.depense.delete(id)
        await reloadDepenses()
      } else {
        setDepenses((current) => current.filter((item) => item.id !== id))
      }

      setFeedback('Depense supprimee.')
    } catch (error) {
      setFeedback(error.message || 'Suppression impossible.')
    }
  }

  return (
    <section className="page">
      <PageHeader
        title="Depenses"
        description="Charges courantes, frais vehicules et fournitures."
        actions={
          <button type="button" className="btn btn-secondary" onClick={() => setShowModal(true)}>
            Nouvelle depense
          </button>
        }
      />

      <div className="stats-grid">
        <StatCard label="Total depenses" value={formatCurrency(stats.total)} hint="Toutes categories" />
        <StatCard label="Carburant" value={formatCurrency(stats.carburant)} hint="Flotte auto" />
        <StatCard label="Entretien" value={formatCurrency(stats.entretien)} hint="Maintenance" />
        <StatCard label="Operations" value={stats.count} hint="Pieces enregistrees" />
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
              placeholder="Description, fournisseur, reference"
            />
          </label>
          <label className="field">
            <span>Categorie</span>
            <select
              value={categorieFilter}
              onChange={(event) => setCategorieFilter(event.target.value)}
            >
              <option value="TOUTES">Toutes</option>
              {Object.entries(categorieLabels).map(([key, label]) => (
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
          <h3>Journal des depenses</h3>
          <span className="badge success">{filteredDepenses.length} lignes</span>
        </div>

        {loading ? (
          <div className="empty-state">Chargement des depenses...</div>
        ) : !filteredDepenses.length ? (
          <div className="empty-state">Aucune depense ne correspond aux filtres.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Categorie</th>
                  <th>Description</th>
                  <th>Fournisseur</th>
                  <th>Reference</th>
                  <th>Montant</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepenses.map((depense) => (
                  <tr key={depense.id}>
                    <td>{formatDate(depense.date)}</td>
                    <td>{categorieLabels[depense.categorie] || depense.categorie}</td>
                    <td>{depense.description}</td>
                    <td>{depense.fournisseur || '-'}</td>
                    <td>{depense.reference || '-'}</td>
                    <td>{formatCurrency(depense.montant)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => handleDelete(depense.id)}
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
              <h3>Nouvelle depense</h3>
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
              <div className="form-grid two-cols">
                <label className="field">
                  <span>Categorie</span>
                  <select {...register('categorie')}>
                    {Object.entries(categorieLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Montant</span>
                  <input {...register('montant')} type="number" min="1" placeholder="95" />
                  {errors.montant ? <small className="form-error">{errors.montant.message}</small> : null}
                </label>
              </div>

              <label className="field">
                <span>Description</span>
                <input {...register('description')} placeholder="Plein Peugeot 208" />
                {errors.description ? (
                  <small className="form-error">{errors.description.message}</small>
                ) : null}
              </label>

              <div className="form-grid two-cols">
                <label className="field">
                  <span>Fournisseur</span>
                  <input {...register('fournisseur')} placeholder="Station service" />
                </label>
                <label className="field">
                  <span>Reference</span>
                  <input {...register('reference')} placeholder="DEP-2026-001" />
                </label>
              </div>

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
                  {isSubmitting ? 'Enregistrement...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default Depenses
