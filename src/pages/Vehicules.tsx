import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { useAppStore } from '../store/useAppStore.js'

const vehiculeSchema = z.object({
  immatriculation: z.string().min(4, 'Immatriculation requise'),
  marque: z.string().min(2, 'Marque requise'),
  modele: z.string().min(1, 'Modele requis'),
  annee: z
    .string()
    .min(4, 'Annee requise')
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 2000, {
      message: 'Annee invalide',
    }),
  categorie: z.enum(['A', 'B', 'C', 'D', 'BE']),
  kilometrage: z
    .string()
    .refine((value) => value === '' || (!Number.isNaN(Number(value)) && Number(value) >= 0), {
      message: 'Kilometrage invalide',
    }),
  statut: z.enum(['DISPONIBLE', 'EN_LECON', 'EN_ENTRETIEN', 'HORS_SERVICE']),
})

const statutLabels = {
  DISPONIBLE: 'Disponible',
  EN_LECON: 'En lecon',
  EN_ENTRETIEN: 'En entretien',
  HORS_SERVICE: 'Hors service',
}

function normalizeFallback(items) {
  return items.map((item, index) => ({
    id: index + 1,
    immatriculation: item.immatriculation,
    marque: '',
    modele: item.modele,
    annee: 2023,
    categorie: 'B',
    kilometrage: 0,
    statut:
      item.statut === 'Disponible'
        ? 'DISPONIBLE'
        : item.statut === 'Entretien'
          ? 'EN_ENTRETIEN'
          : 'EN_LECON',
    modeleComplet: item.modele,
  }))
}

function Vehicules() {
  const fallback = useAppStore((state) => state.vehicules)
  const [vehicules, setVehicules] = useState(normalizeFallback(fallback))
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingVehicule, setEditingVehicule] = useState(null)
  const [statusFilter, setStatusFilter] = useState('TOUS')
  const hasDesktopApi = typeof window !== 'undefined' && window.api?.vehicule

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(vehiculeSchema),
    defaultValues: {
      immatriculation: '',
      marque: '',
      modele: '',
      annee: '',
      categorie: 'B',
      kilometrage: '',
      statut: 'DISPONIBLE',
    },
  })

  useEffect(() => {
    let active = true

    async function loadVehicules() {
      try {
        if (!hasDesktopApi) {
          if (active) {
            setVehicules(normalizeFallback(fallback))
            setLoading(false)
          }
          return
        }

        const data = await window.api.vehicule.list()
        if (active) {
          setVehicules(
            data.map((item) => ({
              ...item,
              modeleComplet: `${item.marque} ${item.modele}`.trim(),
            })),
          )
          setFeedback('')
        }
      } catch (error) {
        if (active) {
          setFeedback(error.message || 'Impossible de charger les vehicules.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadVehicules()

    return () => {
      active = false
    }
  }, [fallback, hasDesktopApi])

  const stats = useMemo(
    () => ({
      total: vehicules.length,
      disponibles: vehicules.filter((item) => item.statut === 'DISPONIBLE').length,
      entretien: vehicules.filter((item) => item.statut === 'EN_ENTRETIEN').length,
      kilometrage: vehicules.reduce((sum, item) => sum + Number(item.kilometrage || 0), 0),
    }),
    [vehicules],
  )

  const filteredVehicules = useMemo(
    () =>
      vehicules.filter((item) => {
        const matchesStatus = statusFilter === 'TOUS' || item.statut === statusFilter
        return matchesStatus
      }),
    [statusFilter, vehicules],
  )

  async function reloadVehicules() {
    if (!hasDesktopApi) {
      return
    }

    const data = await window.api.vehicule.list()
    setVehicules(
      data.map((item) => ({
        ...item,
        modeleComplet: `${item.marque} ${item.modele}`.trim(),
      })),
    )
  }

  function openCreateModal() {
    setEditingVehicule(null)
    reset({
      immatriculation: '',
      marque: '',
      modele: '',
      annee: '',
      categorie: 'B',
      kilometrage: '',
      statut: 'DISPONIBLE',
    })
    setShowModal(true)
  }

  function openEditModal(vehicule) {
    setEditingVehicule(vehicule)
    reset({
      immatriculation: vehicule.immatriculation || '',
      marque: vehicule.marque || '',
      modele: vehicule.modele || '',
      annee: vehicule.annee ? String(vehicule.annee) : '',
      categorie: vehicule.categorie || 'B',
      kilometrage: vehicule.kilometrage != null ? String(vehicule.kilometrage) : '',
      statut: vehicule.statut || 'DISPONIBLE',
    })
    setShowModal(true)
  }

  async function onSubmit(values) {
    const payload = {
      ...values,
      annee: Number(values.annee),
      kilometrage: values.kilometrage === '' ? 0 : Number(values.kilometrage),
    }

    try {
      if (hasDesktopApi) {
        if (editingVehicule) {
          await window.api.vehicule.update(editingVehicule.id, payload)
          setFeedback('Vehicule mis a jour.')
        } else {
          await window.api.vehicule.create(payload)
          setFeedback('Vehicule ajoute.')
        }
        await reloadVehicules()
      } else {
        setVehicules((current) => [
          {
            id: current.length ? Math.max(...current.map((item) => Number(item.id))) + 1 : 1,
            ...payload,
            modeleComplet: `${payload.marque} ${payload.modele}`.trim(),
          },
          ...current,
        ])
      }

      setShowModal(false)
      setEditingVehicule(null)
      reset()
    } catch (error) {
      setFeedback(error.message || 'Impossible de sauvegarder le vehicule.')
    }
  }

  async function handleDelete(id) {
    try {
      if (hasDesktopApi) {
        await window.api.vehicule.delete(id)
        await reloadVehicules()
      } else {
        setVehicules((current) => current.filter((item) => item.id !== id))
      }
      setFeedback('Vehicule supprime.')
    } catch (error) {
      setFeedback(error.message || 'Suppression impossible.')
    }
  }

  return (
    <section className="page">
      <PageHeader
        title="Vehicules"
        description="Parc automobile connecte a la base de donnees."
        actions={
          <button type="button" className="btn btn-secondary" onClick={openCreateModal}>
            Ajouter un vehicule
          </button>
        }
      />

      <div className="stats-grid">
        <StatCard label="Vehicules" value={stats.total} hint="Parc total" />
        <StatCard label="Disponibles" value={stats.disponibles} hint="Affectables" />
        <StatCard label="En entretien" value={stats.entretien} hint="Indisponibles" />
        <StatCard label="Kilometrage total" value={stats.kilometrage} hint="Cumule flotte" />
      </div>

      <article className="panel">
        <div className="panel-header">
          <h3>Filtre</h3>
          {feedback ? <span className="badge">{feedback}</span> : null}
        </div>
        <label className="field">
          <span>Statut</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="TOUS">Tous</option>
            {Object.entries(statutLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </article>

      <article className="panel">
        <div className="panel-header">
          <h3>Parc vehicules</h3>
          <span className="badge success">{filteredVehicules.length} lignes</span>
        </div>
        {loading ? (
          <div className="empty-state">Chargement des vehicules...</div>
        ) : !filteredVehicules.length ? (
          <div className="empty-state">Aucun vehicule ne correspond au filtre.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Modele</th>
                  <th>Immatriculation</th>
                  <th>Statut</th>
                  <th>Kilometrage</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicules.map((vehicule) => (
                  <tr key={vehicule.id}>
                    <td>{vehicule.modeleComplet || `${vehicule.marque} ${vehicule.modele}`.trim()}</td>
                    <td>{vehicule.immatriculation}</td>
                    <td>{statutLabels[vehicule.statut] || vehicule.statut}</td>
                    <td>{vehicule.kilometrage || 0}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => openEditModal(vehicule)}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => handleDelete(vehicule.id)}
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
              <h3>{editingVehicule ? 'Modifier un vehicule' : 'Nouveau vehicule'}</h3>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => {
                  setShowModal(false)
                  setEditingVehicule(null)
                  reset()
                }}
              >
                Fermer
              </button>
            </div>

            <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
              <div className="form-grid two-cols">
                <label className="field">
                  <span>Immatriculation</span>
                  <input {...register('immatriculation')} placeholder="AB-123-CD" />
                  {errors.immatriculation ? (
                    <small className="form-error">{errors.immatriculation.message}</small>
                  ) : null}
                </label>
                <label className="field">
                  <span>Annee</span>
                  <input {...register('annee')} type="number" min="2000" placeholder="2023" />
                  {errors.annee ? <small className="form-error">{errors.annee.message}</small> : null}
                </label>
              </div>

              <div className="form-grid two-cols">
                <label className="field">
                  <span>Marque</span>
                  <input {...register('marque')} placeholder="Peugeot" />
                  {errors.marque ? <small className="form-error">{errors.marque.message}</small> : null}
                </label>
                <label className="field">
                  <span>Modele</span>
                  <input {...register('modele')} placeholder="208" />
                  {errors.modele ? <small className="form-error">{errors.modele.message}</small> : null}
                </label>
              </div>

              <div className="form-grid two-cols">
                <label className="field">
                  <span>Categorie</span>
                  <select {...register('categorie')}>
                    <option value="A">Permis A</option>
                    <option value="B">Permis B</option>
                    <option value="C">Permis C</option>
                    <option value="D">Permis D</option>
                    <option value="BE">Permis BE</option>
                  </select>
                </label>
                <label className="field">
                  <span>Statut</span>
                  <select {...register('statut')}>
                    {Object.entries(statutLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="field">
                <span>Kilometrage</span>
                <input {...register('kilometrage')} type="number" min="0" placeholder="24000" />
                {errors.kilometrage ? (
                  <small className="form-error">{errors.kilometrage.message}</small>
                ) : null}
              </label>

              <div className="toolbar-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false)
                    setEditingVehicule(null)
                    reset()
                  }}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Sauvegarde...' : editingVehicule ? 'Mettre a jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default Vehicules
