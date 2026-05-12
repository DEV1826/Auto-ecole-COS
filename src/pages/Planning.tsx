import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { useAppStore } from '../store/useAppStore.js'

const lessonSchema = z.object({
  date: z.string().min(1, 'Date et heure requises'),
  duree: z
    .string()
    .min(1, 'Duree requise')
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
      message: 'Duree invalide',
    }),
  type: z.enum(['CODE', 'CONDUITE', 'CONDUITE_ACCOMPAGNEE']),
  statut: z.enum(['PLANIFIEE', 'EFFECTUEE', 'ANNULEE', 'ABSENCE']),
  candidatId: z.string().min(1, 'Selectionnez un candidat'),
  moniteurId: z.string().min(1, 'Selectionnez un moniteur'),
  vehiculeId: z.string().optional(),
  notes: z.string().optional(),
})

const typeLabels = {
  CODE: 'Code',
  CONDUITE: 'Conduite',
  CONDUITE_ACCOMPAGNEE: 'Conduite accompagnee',
}

const statusLabels = {
  PLANIFIEE: 'Planifiee',
  EFFECTUEE: 'Effectuee',
  ANNULEE: 'Annulee',
  ABSENCE: 'Absence',
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatDayLabel(value) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}

function toInputDateTime(value) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const normalized = new Date(date.getTime() - offset * 60_000)
  return normalized.toISOString().slice(0, 16)
}

function buildFallbackLessons(candidats, moniteurs, vehicules) {
  if (!candidats.length || !moniteurs.length) {
    return []
  }

  return candidats.slice(0, 3).map((candidat, index) => ({
    id: index + 1,
    date: new Date(Date.now() + (index + 1) * 86_400_000).toISOString(),
    duree: index === 0 ? 90 : 60,
    type: index === 2 ? 'CODE' : 'CONDUITE',
    statut: index === 1 ? 'EFFECTUEE' : 'PLANIFIEE',
    notes: index === 0 ? 'Point de depart centre-ville' : '',
    candidatId: candidat.id,
    moniteurId: moniteurs[index % moniteurs.length]?.id || moniteurs[0]?.id,
    vehiculeId: vehicules[index % Math.max(vehicules.length, 1)]?.id || null,
    candidat: { id: candidat.id, prenom: candidat.prenom, nom: candidat.nom },
    moniteur: moniteurs[index % moniteurs.length]
      ? {
          id: moniteurs[index % moniteurs.length].id,
          prenom: moniteurs[index % moniteurs.length].prenom || '',
          nom: moniteurs[index % moniteurs.length].nom,
        }
      : null,
    vehicule: vehicules[index % Math.max(vehicules.length, 1)]
      ? {
          id: vehicules[index % vehicules.length].id,
          modele: vehicules[index % vehicules.length].modele,
          immatriculation: vehicules[index % vehicules.length].immatriculation,
        }
      : null,
  }))
}

function normalizeFallbackCandidats(items) {
  return items.map((item, index) => ({
    id: index + 1,
    prenom: item.prenom,
    nom: item.nom,
  }))
}

function normalizeFallbackMoniteurs(items) {
  return items.map((item, index) => {
    const trimmed = String(item.nom || '').replace(/^M\.?\s*|^Mme\s*/i, '').trim()
    const [prenom, ...rest] = trimmed.split(' ')
    return {
      id: index + 1,
      prenom: rest.length ? prenom : '',
      nom: rest.length ? rest.join(' ') : trimmed,
    }
  })
}

function normalizeFallbackVehicules(items) {
  return items.map((item, index) => ({
    id: index + 1,
    modele: item.modele,
    immatriculation: item.immatriculation,
    statut: item.statut,
  }))
}

function getWeekStart(referenceDate) {
  const date = new Date(referenceDate)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

async function fetchPlanningData({
  hasDesktopApi,
  fallbackCandidats,
  fallbackMoniteurs,
  fallbackVehicules,
}) {
  if (hasDesktopApi) {
    const [lessonsData, candidatsData, moniteursData, vehiculesData] = await Promise.all([
      window.api.planning.list(),
      window.api.candidat.list(),
      window.api.moniteur.list(),
      window.api.vehicule.list(),
    ])

    return {
      lessons: lessonsData,
      candidats: candidatsData,
      moniteurs: moniteursData,
      vehicules: vehiculesData,
    }
  }

  const fallbackCandidates = normalizeFallbackCandidats(fallbackCandidats)
  const fallbackInstructors = normalizeFallbackMoniteurs(fallbackMoniteurs)
  const fallbackFleet = normalizeFallbackVehicules(fallbackVehicules)

  return {
    lessons: buildFallbackLessons(fallbackCandidates, fallbackInstructors, fallbackFleet),
    candidats: fallbackCandidates,
    moniteurs: fallbackInstructors,
    vehicules: fallbackFleet,
  }
}

function Planning() {
  const fallbackCandidats = useAppStore((state) => state.candidats)
  const fallbackMoniteurs = useAppStore((state) => state.moniteurs)
  const fallbackVehicules = useAppStore((state) => state.vehicules)
  const [lessons, setLessons] = useState([])
  const [candidats, setCandidats] = useState([])
  const [moniteurs, setMoniteurs] = useState([])
  const [vehicules, setVehicules] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('TOUS')
  const [weekAnchor, setWeekAnchor] = useState(getWeekStart(new Date()))
  const hasDesktopApi =
    typeof window !== 'undefined' &&
    window.api?.planning &&
    window.api?.candidat &&
    window.api?.moniteur &&
    window.api?.vehicule

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      date: '',
      duree: '60',
      type: 'CONDUITE',
      statut: 'PLANIFIEE',
      candidatId: '',
      moniteurId: '',
      vehiculeId: '',
      notes: '',
    },
  })

  async function loadPlanning() {
    setLoading(true)

    try {
      const data = await fetchPlanningData({
        hasDesktopApi,
        fallbackCandidats,
        fallbackMoniteurs,
        fallbackVehicules,
      })
      setLessons(data.lessons)
      setCandidats(data.candidats)
      setMoniteurs(data.moniteurs)
      setVehicules(data.vehicules)
      setFeedback('')
    } catch (error) {
      setFeedback(error.message || 'Impossible de charger le planning.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    async function loadInitialPlanning() {
      setLoading(true)

      try {
        const data = await fetchPlanningData({
          hasDesktopApi,
          fallbackCandidats,
          fallbackMoniteurs,
          fallbackVehicules,
        })

        if (!active) {
          return
        }

        setLessons(data.lessons)
        setCandidats(data.candidats)
        setMoniteurs(data.moniteurs)
        setVehicules(data.vehicules)
        setFeedback('')
      } catch (error) {
        if (active) {
          setFeedback(error.message || 'Impossible de charger le planning.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadInitialPlanning()

    return () => {
      active = false
    }
  }, [fallbackCandidats, fallbackMoniteurs, fallbackVehicules, hasDesktopApi])

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const candidateName = `${lesson.candidat?.prenom || ''} ${lesson.candidat?.nom || ''}`.toLowerCase()
      const instructorName = `${lesson.moniteur?.prenom || ''} ${lesson.moniteur?.nom || ''}`.toLowerCase()
      const matchesSearch =
        candidateName.includes(search.toLowerCase()) ||
        instructorName.includes(search.toLowerCase()) ||
        (lesson.vehicule?.modele || '').toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'TOUS' || lesson.statut === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [lessons, search, statusFilter])

  const stats = useMemo(() => {
    const planned = lessons.filter((lesson) => lesson.statut === 'PLANIFIEE').length
    const completed = lessons.filter((lesson) => lesson.statut === 'EFFECTUEE').length
    const totalMinutes = lessons.reduce((sum, lesson) => sum + Number(lesson.duree || 0), 0)
    const availableVehicules = vehicules.filter((vehicule) => vehicule.statut !== 'ENTRETIEN').length

    return {
      planned,
      completed,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      availableVehicules,
    }
  }, [lessons, vehicules])

  const upcomingLessons = useMemo(
    () =>
      [...filteredLessons]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3),
    [filteredLessons],
  )

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekAnchor, index)),
    [weekAnchor],
  )

  const calendarDays = useMemo(
    () =>
      weekDays.map((day) => {
        const key = day.toISOString().slice(0, 10)
        const entries = filteredLessons
          .filter((lesson) => lesson.date.slice(0, 10) === key)
          .sort((a, b) => new Date(a.date) - new Date(b.date))

        return { day, entries }
      }),
    [filteredLessons, weekDays],
  )

  function openCreateModal() {
    setEditingLesson(null)
    reset({
      date: toInputDateTime(new Date()),
      duree: '60',
      type: 'CONDUITE',
      statut: 'PLANIFIEE',
      candidatId: '',
      moniteurId: '',
      vehiculeId: '',
      notes: '',
    })
    setShowModal(true)
  }

  function openEditModal(lesson) {
    setEditingLesson(lesson)
    reset({
      date: toInputDateTime(lesson.date),
      duree: String(lesson.duree || 60),
      type: lesson.type || 'CONDUITE',
      statut: lesson.statut || 'PLANIFIEE',
      candidatId: String(lesson.candidatId || ''),
      moniteurId: String(lesson.moniteurId || ''),
      vehiculeId: lesson.vehiculeId ? String(lesson.vehiculeId) : '',
      notes: lesson.notes || '',
    })
    setShowModal(true)
  }

  async function onSubmit(values) {
    const payload = {
      ...values,
      duree: Number(values.duree),
      vehiculeId: values.vehiculeId || null,
      notes: values.notes || null,
    }

    try {
      if (hasDesktopApi) {
        if (editingLesson) {
          await window.api.planning.updateLesson(editingLesson.id, payload)
          setFeedback('Lecon mise a jour.')
        } else {
          await window.api.planning.saveLesson(payload)
          setFeedback('Lecon planifiee.')
        }
        await loadPlanning()
      } else {
        const candidat = candidats.find((item) => String(item.id) === values.candidatId)
        const moniteur = moniteurs.find((item) => String(item.id) === values.moniteurId)
        const vehicule = vehicules.find((item) => String(item.id) === values.vehiculeId)

        if (editingLesson) {
          setLessons((current) =>
            current.map((item) =>
              item.id === editingLesson.id
                ? {
                    ...item,
                    ...payload,
                    candidatId: Number(values.candidatId),
                    moniteurId: Number(values.moniteurId),
                    vehiculeId: values.vehiculeId ? Number(values.vehiculeId) : null,
                    candidat,
                    moniteur,
                    vehicule: vehicule || null,
                  }
                : item,
            ),
          )
          setFeedback('Lecon mise a jour.')
        } else {
          setLessons((current) => [
            {
              id: current.length ? Math.max(...current.map((item) => Number(item.id))) + 1 : 1,
              ...payload,
              candidatId: Number(values.candidatId),
              moniteurId: Number(values.moniteurId),
              vehiculeId: values.vehiculeId ? Number(values.vehiculeId) : null,
              candidat,
              moniteur,
              vehicule: vehicule || null,
            },
            ...current,
          ])
          setFeedback('Lecon planifiee.')
        }
      }

      setShowModal(false)
      setEditingLesson(null)
      reset()
    } catch (error) {
      setFeedback(error.message || 'Impossible de sauvegarder la lecon.')
    }
  }

  async function handleDelete(id) {
    try {
      if (hasDesktopApi) {
        await window.api.planning.deleteLesson(id)
        await loadPlanning()
      } else {
        setLessons((current) => current.filter((item) => item.id !== id))
      }

      setFeedback('Lecon supprimee.')
    } catch (error) {
      setFeedback(error.message || 'Suppression impossible.')
    }
  }

  return (
    <section className="page">
      <PageHeader
        title="Planning"
        description="Organisation des lecons avec candidats, moniteurs, vehicules et suivi des statuts."
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            Nouvelle lecon
          </button>
        }
      />

      <div className="stats-grid">
        <StatCard label="Lecons planifiees" value={stats.planned} hint="A venir" />
        <StatCard label="Lecons effectuees" value={stats.completed} hint="Historique" />
        <StatCard label="Volume horaire" value={`${stats.totalHours} h`} hint="Toutes lecons" />
        <StatCard label="Vehicules disponibles" value={stats.availableVehicules} hint="Hors entretien" />
      </div>

      <div className="list-grid">
        <article className="panel">
          <div className="panel-header">
            <h3>Filtres</h3>
            {feedback ? <span className="badge">{feedback}</span> : null}
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Recherche</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Candidat, moniteur ou vehicule"
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

        <article className="panel">
          <div className="panel-header">
            <h3>Prochaines lecons</h3>
            <span className="badge success">{upcomingLessons.length} a l ecran</span>
          </div>
          {upcomingLessons.length ? (
            <div className="list">
              {upcomingLessons.map((lesson) => (
                <div className="list-item" key={`upcoming-${lesson.id}`}>
                  <div className="stack">
                    <strong>
                      {lesson.candidat?.prenom} {lesson.candidat?.nom}
                    </strong>
                    <span className="muted">{formatDateTime(lesson.date)}</span>
                  </div>
                  <div className="stack">
                    <span className="badge">{typeLabels[lesson.type] || lesson.type}</span>
                    <span className="muted">
                      {lesson.moniteur?.prenom} {lesson.moniteur?.nom}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">Aucune lecon a venir pour ces filtres.</div>
          )}
        </article>
      </div>

      <article className="panel">
        <div className="panel-header">
          <h3>Vue calendrier</h3>
          <div className="table-actions">
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => setWeekAnchor((current) => addDays(current, -7))}
            >
              Semaine precedente
            </button>
            <span className="badge success">
              {formatDayLabel(weekDays[0])} - {formatDayLabel(weekDays[6])}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => setWeekAnchor((current) => addDays(current, 7))}
            >
              Semaine suivante
            </button>
          </div>
        </div>

        <div className="calendar-grid">
          {calendarDays.map(({ day, entries }) => (
            <div className="calendar-day" key={day.toISOString()}>
              <div className="split-line">
                <strong>{formatDayLabel(day)}</strong>
                <span className="badge">{entries.length}</span>
              </div>
              {entries.length ? (
                <div className="calendar-events">
                  {entries.map((lesson) => (
                    <button
                      type="button"
                      className="calendar-event"
                      key={lesson.id}
                      onClick={() => openEditModal(lesson)}
                    >
                      <strong>{new Date(lesson.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</strong>
                      <span>
                        {lesson.candidat?.prenom} {lesson.candidat?.nom}
                      </span>
                      <small>
                        {typeLabels[lesson.type] || lesson.type} | {[lesson.moniteur?.prenom, lesson.moniteur?.nom].filter(Boolean).join(' ')}
                      </small>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="empty-state calendar-empty">Aucune lecon</div>
              )}
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <div className="panel-header">
          <h3>Lecons</h3>
          <span className="badge success">{filteredLessons.length} lignes</span>
        </div>

        {loading ? (
          <div className="empty-state">Chargement du planning...</div>
        ) : !filteredLessons.length ? (
          <div className="empty-state">Aucune lecon ne correspond aux filtres.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Candidat</th>
                  <th>Moniteur</th>
                  <th>Vehicule</th>
                  <th>Type</th>
                  <th>Duree</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLessons.map((lesson) => (
                  <tr key={lesson.id}>
                    <td>{formatDateTime(lesson.date)}</td>
                    <td>
                      {lesson.candidat?.prenom} {lesson.candidat?.nom}
                    </td>
                    <td>
                      {lesson.moniteur?.prenom} {lesson.moniteur?.nom}
                    </td>
                    <td>
                      {lesson.vehicule
                        ? `${lesson.vehicule.modele} - ${lesson.vehicule.immatriculation}`
                        : '-'}
                    </td>
                    <td>{typeLabels[lesson.type] || lesson.type}</td>
                    <td>{lesson.duree} min</td>
                    <td>{statusLabels[lesson.statut] || lesson.statut}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => openEditModal(lesson)}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => handleDelete(lesson.id)}
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
              <h3>{editingLesson ? 'Modifier une lecon' : 'Nouvelle lecon'}</h3>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => {
                  setShowModal(false)
                  setEditingLesson(null)
                  reset()
                }}
              >
                Fermer
              </button>
            </div>

            <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
              <div className="form-grid two-cols">
                <label className="field">
                  <span>Date et heure</span>
                  <input {...register('date')} type="datetime-local" />
                  {errors.date ? <small className="form-error">{errors.date.message}</small> : null}
                </label>
                <label className="field">
                  <span>Duree (minutes)</span>
                  <input {...register('duree')} type="number" min="30" step="15" />
                  {errors.duree ? <small className="form-error">{errors.duree.message}</small> : null}
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

              <div className="form-grid two-cols">
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
                  {errors.candidatId ? (
                    <small className="form-error">{errors.candidatId.message}</small>
                  ) : null}
                </label>
                <label className="field">
                  <span>Moniteur</span>
                  <select {...register('moniteurId')}>
                    <option value="">Selectionner un moniteur</option>
                    {moniteurs.map((item) => (
                      <option key={item.id} value={item.id}>
                        {[item.prenom, item.nom].filter(Boolean).join(' ')}
                      </option>
                    ))}
                  </select>
                  {errors.moniteurId ? (
                    <small className="form-error">{errors.moniteurId.message}</small>
                  ) : null}
                </label>
              </div>

              <label className="field">
                <span>Vehicule</span>
                <select {...register('vehiculeId')}>
                  <option value="">Aucun vehicule</option>
                  {vehicules.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.modele} - {item.immatriculation}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Notes</span>
                <textarea {...register('notes')} placeholder="Consignes, point de rendez-vous, remarques..." />
              </label>

              <div className="toolbar-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false)
                    setEditingLesson(null)
                    reset()
                  }}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Sauvegarde...' : editingLesson ? 'Mettre a jour' : 'Planifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default Planning
