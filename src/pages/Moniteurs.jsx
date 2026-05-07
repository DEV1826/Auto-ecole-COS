import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { useAppStore } from '../store/useAppStore.js'

const moniteurSchema = z.object({
  prenom: z.string().min(2, 'Prenom requis'),
  nom: z.string().min(2, 'Nom requis'),
  email: z.union([z.string().email('Email invalide'), z.literal('')]),
  telephone: z.string().optional(),
  specialite: z.string().optional(),
})

function normalizeFallback(items) {
  return items.map((item, index) => ({
    id: index + 1,
    prenom: item.nom,
    nom: '',
    nomComplet: item.nom,
    specialite: item.disponibilite,
    telephone: item.vehicule,
    email: '',
    actif: true,
  }))
}

function Moniteurs() {
  const fallback = useAppStore((state) => state.moniteurs)
  const [moniteurs, setMoniteurs] = useState(normalizeFallback(fallback))
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingMoniteur, setEditingMoniteur] = useState(null)
  const hasDesktopApi = typeof window !== 'undefined' && window.api?.moniteur

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(moniteurSchema),
    defaultValues: {
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
      specialite: '',
    },
  })

  useEffect(() => {
    let active = true

    async function loadMoniteurs() {
      try {
        if (!hasDesktopApi) {
          if (active) {
            setMoniteurs(normalizeFallback(fallback))
            setLoading(false)
          }
          return
        }

        const data = await window.api.moniteur.list()
        if (active) {
          setMoniteurs(
            data.map((item) => ({
              ...item,
              nomComplet: `${item.prenom} ${item.nom}`,
            })),
          )
          setFeedback('')
        }
      } catch (error) {
        if (active) {
          setFeedback(error.message || 'Impossible de charger les moniteurs.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadMoniteurs()

    return () => {
      active = false
    }
  }, [fallback, hasDesktopApi])

  const stats = useMemo(
    () => ({
      total: moniteurs.length,
      actifs: moniteurs.filter((item) => item.actif !== false).length,
      avecTelephone: moniteurs.filter((item) => item.telephone).length,
      specialites: new Set(moniteurs.map((item) => item.specialite).filter(Boolean)).size,
    }),
    [moniteurs],
  )

  const filteredMoniteurs = useMemo(
    () =>
      moniteurs.filter((item) =>
        `${item.nomComplet || `${item.prenom} ${item.nom}`} ${item.specialite || ''} ${item.telephone || ''}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [moniteurs, search],
  )

  async function reloadMoniteurs() {
    if (!hasDesktopApi) {
      return
    }

    const data = await window.api.moniteur.list()
    setMoniteurs(
      data.map((item) => ({
        ...item,
        nomComplet: `${item.prenom} ${item.nom}`,
      })),
    )
  }

  function openCreateModal() {
    setEditingMoniteur(null)
    reset({
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
      specialite: '',
    })
    setShowModal(true)
  }

  function openEditModal(moniteur) {
    setEditingMoniteur(moniteur)
    reset({
      prenom: moniteur.prenom || '',
      nom: moniteur.nom || '',
      email: moniteur.email || '',
      telephone: moniteur.telephone || '',
      specialite: moniteur.specialite || '',
    })
    setShowModal(true)
  }

  async function onSubmit(values) {
    const payload = {
      ...values,
      email: values.email || null,
      telephone: values.telephone || null,
      specialite: values.specialite || null,
    }

    try {
      if (hasDesktopApi) {
        if (editingMoniteur) {
          await window.api.moniteur.update(editingMoniteur.id, payload)
          setFeedback('Moniteur mis a jour.')
        } else {
          await window.api.moniteur.create(payload)
          setFeedback('Moniteur ajoute.')
        }
        await reloadMoniteurs()
      } else {
        setMoniteurs((current) => [
          {
            id: current.length ? Math.max(...current.map((item) => Number(item.id))) + 1 : 1,
            ...payload,
            actif: true,
            nomComplet: `${values.prenom} ${values.nom}`,
          },
          ...current,
        ])
      }

      setShowModal(false)
      setEditingMoniteur(null)
      reset()
    } catch (error) {
      setFeedback(error.message || 'Impossible de sauvegarder le moniteur.')
    }
  }

  async function handleDelete(id) {
    try {
      if (hasDesktopApi) {
        await window.api.moniteur.delete(id)
        await reloadMoniteurs()
      } else {
        setMoniteurs((current) => current.filter((item) => item.id !== id))
      }
      setFeedback('Moniteur supprime.')
    } catch (error) {
      setFeedback(error.message || 'Suppression impossible.')
    }
  }

  return (
    <section className="page">
      <PageHeader
        title="Moniteurs"
        description="Gestion des instructeurs relies a la base de donnees."
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            Ajouter un moniteur
          </button>
        }
      />

      <div className="stats-grid">
        <StatCard label="Moniteurs" value={stats.total} hint="Equipe totale" />
        <StatCard label="Actifs" value={stats.actifs} hint="Disponibles dans la base" />
        <StatCard label="Contacts" value={stats.avecTelephone} hint="Avec telephone" />
        <StatCard label="Specialites" value={stats.specialites} hint="Competences renseignees" />
      </div>

      <article className="panel">
        <div className="panel-header">
          <h3>Recherche</h3>
          {feedback ? <span className="badge">{feedback}</span> : null}
        </div>
        <label className="field">
          <span>Filtrer les moniteurs</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nom, specialite, telephone"
          />
        </label>
      </article>

      <article className="panel">
        <div className="panel-header">
          <h3>Liste des moniteurs</h3>
          <span className="badge success">{filteredMoniteurs.length} lignes</span>
        </div>
        {loading ? (
          <div className="empty-state">Chargement des moniteurs...</div>
        ) : !filteredMoniteurs.length ? (
          <div className="empty-state">Aucun moniteur ne correspond a la recherche.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Moniteur</th>
                  <th>Specialite</th>
                  <th>Telephone</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMoniteurs.map((moniteur) => (
                  <tr key={moniteur.id}>
                    <td>{moniteur.nomComplet || `${moniteur.prenom} ${moniteur.nom}`}</td>
                    <td>{moniteur.specialite || '-'}</td>
                    <td>{moniteur.telephone || '-'}</td>
                    <td>{moniteur.email || '-'}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => openEditModal(moniteur)}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => handleDelete(moniteur.id)}
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
              <h3>{editingMoniteur ? 'Modifier un moniteur' : 'Nouveau moniteur'}</h3>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => {
                  setShowModal(false)
                  setEditingMoniteur(null)
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
                  <input {...register('prenom')} placeholder="Marc" />
                  {errors.prenom ? <small className="form-error">{errors.prenom.message}</small> : null}
                </label>
                <label className="field">
                  <span>Nom</span>
                  <input {...register('nom')} placeholder="Henry" />
                  {errors.nom ? <small className="form-error">{errors.nom.message}</small> : null}
                </label>
              </div>

              <div className="form-grid two-cols">
                <label className="field">
                  <span>Email</span>
                  <input {...register('email')} placeholder="marc@example.com" />
                  {errors.email ? <small className="form-error">{errors.email.message}</small> : null}
                </label>
                <label className="field">
                  <span>Telephone</span>
                  <input {...register('telephone')} placeholder="0610101010" />
                </label>
              </div>

              <label className="field">
                <span>Specialite</span>
                <input {...register('specialite')} placeholder="Conduite, code..." />
              </label>

              <div className="toolbar-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false)
                    setEditingMoniteur(null)
                    reset()
                  }}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Sauvegarde...' : editingMoniteur ? 'Mettre a jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default Moniteurs
