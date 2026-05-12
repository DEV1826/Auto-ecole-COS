import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { useAppStore } from '../store/useAppStore.js'
import { formatCurrency } from '../utils/currency.js'
import { exportFacturesFallback } from '../utils/exporters.js'

const factureSchema = z.object({
  candidatId: z.string().min(1, 'Selectionnez un candidat'),
  numero: z.string().min(3, 'Numero requis'),
  montantTotal: z
    .string()
    .min(1, 'Montant requis')
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
      message: 'Montant invalide',
    }),
  statut: z.enum(['EN_ATTENTE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'ANNULEE']),
  notes: z.string().optional(),
})

const statutLabels = {
  EN_ATTENTE: 'En attente',
  PARTIELLEMENT_PAYEE: 'Partiellement payee',
  PAYEE: 'Payee',
  ANNULEE: 'Annulee',
}

const formatDate = (value) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))

function normalizeFallbackFactures(items) {
  return items.map((item, index) => ({
    id: index + 1,
    numero: item.numero,
    montantTotal: Number(String(item.montant).replace(/[^\d]/g, '')) || 0,
    statut: item.statut === 'Envoyee' ? 'EN_ATTENTE' : 'PARTIELLEMENT_PAYEE',
    dateEmission: new Date().toISOString(),
    candidat: {
      id: index + 1,
      prenom: item.client.split(' ')[0] || item.client,
      nom: item.client.split(' ').slice(1).join(' '),
    },
    candidatId: index + 1,
    paiementsCount: 0,
    notes: '',
  }))
}

function normalizeFallbackCandidats(items) {
  return items.map((item, index) => ({
    id: index + 1,
    prenom: item.prenom,
    nom: item.nom,
  }))
}

function Factures() {
  const fallbackFactures = useAppStore((state) => state.factures)
  const fallbackCandidats = useAppStore((state) => state.candidats)
  const [factures, setFactures] = useState(normalizeFallbackFactures(fallbackFactures))
  const [candidats, setCandidats] = useState(normalizeFallbackCandidats(fallbackCandidats))
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingFacture, setEditingFacture] = useState(null)
  const hasDesktopApi =
    typeof window !== 'undefined' && window.api?.facture && window.api?.candidat

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(factureSchema),
    defaultValues: {
      candidatId: '',
      numero: '',
      montantTotal: '',
      statut: 'EN_ATTENTE',
      notes: '',
    },
  })

  useEffect(() => {
    let active = true

    async function loadFactures() {
      try {
        if (!hasDesktopApi) {
          if (active) {
            setFactures(normalizeFallbackFactures(fallbackFactures))
            setCandidats(normalizeFallbackCandidats(fallbackCandidats))
            setLoading(false)
          }
          return
        }

        const [facturesData, candidatsData] = await Promise.all([
          window.api.facture.list(),
          window.api.candidat.list(),
        ])

        if (active) {
          setFactures(facturesData)
          setCandidats(candidatsData)
          setFeedback(null)
        }
      } catch (error) {
        if (active) {
          setFeedback({
            tone: 'danger',
            source: 'Systeme',
            message: error.message || 'Impossible de charger les factures.',
          })
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadFactures()

    return () => {
      active = false
    }
  }, [fallbackCandidats, fallbackFactures, hasDesktopApi])

  const stats = useMemo(() => {
    const total = factures.reduce((sum, item) => sum + Number(item.montantTotal || 0), 0)
    const payees = factures.filter((item) => item.statut === 'PAYEE').length
    const enAttente = factures.filter((item) => item.statut === 'EN_ATTENTE').length

    return {
      total,
      payees,
      enAttente,
      count: factures.length,
    }
  }, [factures])

  async function reloadFactures() {
    if (!hasDesktopApi) {
      return
    }

    const facturesData = await window.api.facture.list()
    setFactures(facturesData)
  }

  function openCreateModal() {
    setEditingFacture(null)
    reset({
      candidatId: '',
      numero: `FAC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      montantTotal: '',
      statut: 'EN_ATTENTE',
      notes: '',
    })
    setShowModal(true)
  }

  function openEditModal(facture) {
    setEditingFacture(facture)
    reset({
      candidatId: String(facture.candidatId || ''),
      numero: facture.numero || '',
      montantTotal: facture.montantTotal ? String(facture.montantTotal) : '',
      statut: facture.statut || 'EN_ATTENTE',
      notes: facture.notes || '',
    })
    setShowModal(true)
  }

  async function onSubmit(values) {
    const payload = {
      ...values,
      candidatId: Number(values.candidatId),
      montantTotal: Number(values.montantTotal),
      notes: values.notes || null,
    }

    try {
      if (hasDesktopApi) {
        if (editingFacture) {
          await window.api.facture.update(editingFacture.id, payload)
          setFeedback({ tone: 'success', source: 'Base', message: 'Facture mise a jour.' })
        } else {
          await window.api.facture.create(payload)
          setFeedback({ tone: 'success', source: 'Base', message: 'Facture creee.' })
        }
        await reloadFactures()
      } else {
        const candidat = candidats.find((item) => String(item.id) === values.candidatId)
        setFactures((current) => [
          {
            id: current.length ? Math.max(...current.map((item) => Number(item.id))) + 1 : 1,
            ...payload,
            dateEmission: new Date().toISOString(),
            candidat,
            paiementsCount: 0,
          },
          ...current,
        ])
      }

      setShowModal(false)
      setEditingFacture(null)
      reset()
    } catch (error) {
      setFeedback({
        tone: 'danger',
        source: 'Systeme',
        message: error.message || 'Impossible de sauvegarder la facture.',
      })
    }
  }

  async function handleDelete(id) {
    try {
      if (hasDesktopApi) {
        await window.api.facture.delete(id)
        await reloadFactures()
      } else {
        setFactures((current) => current.filter((item) => item.id !== id))
      }
      setFeedback({ tone: 'success', source: 'Base', message: 'Facture supprimee.' })
    } catch (error) {
      setFeedback({
        tone: 'danger',
        source: 'Systeme',
        message: error.message || 'Suppression impossible.',
      })
    }
  }

  async function handleExport(format) {
    try {
      if (!window.api?.export) {
        const result = await exportFacturesFallback({
          factures,
          formatCurrency,
          format,
        })
        setFeedback({
          tone: 'success',
          source: 'Navigateur',
          message: `Export ${result.format.toUpperCase()} telecharge avec succes.`,
          filePath: null,
        })
        return
      }

      const result = await window.api.export.excel({ format, count: factures.length })
      setFeedback({
        tone: 'success',
        source: 'Desktop',
        message: `Export ${result.format.toUpperCase()} genere dans ${result.filePath}`,
        filePath: result.filePath,
      })
    } catch (error) {
      setFeedback({
        tone: 'danger',
        source: 'Systeme',
        message: error.message || 'Export impossible.',
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
        title="Factures"
        description="Preparation des documents a exporter en PDF ou a imprimer."
        actions={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => handleExport('pdf')}>
              Export PDF
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => handleExport('xlsx')}>
              Export Excel
            </button>
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>
              Generer une facture
            </button>
          </>
        }
      />

      <div className="stats-grid">
        <StatCard label="Factures" value={stats.count} hint="Pieces emises" />
        <StatCard label="Montant total" value={formatCurrency(stats.total)} hint="Portefeuille facture" />
        <StatCard label="Payees" value={stats.payees} hint="Soldes complets" />
        <StatCard label="En attente" value={stats.enAttente} hint="A recouvrer" />
      </div>

      <article className="panel">
        <div className="panel-header">
          <h3>Suivi des factures</h3>
          {feedback ? (
            <span className={`badge${feedback.tone === 'danger' ? ' danger' : ' success'}`}>
              {feedback.source}
            </span>
          ) : (
            <span className="badge success">Base</span>
          )}
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

        {loading ? (
          <div className="empty-state">Chargement des factures...</div>
        ) : !factures.length ? (
          <div className="empty-state">Aucune facture disponible.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Numero</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Paiements lies</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {factures.map((facture) => (
                  <tr key={facture.id}>
                    <td>{facture.numero}</td>
                    <td>
                      {facture.candidat
                        ? `${facture.candidat.prenom} ${facture.candidat.nom}`
                        : '-'}
                    </td>
                    <td>{formatDate(facture.dateEmission)}</td>
                    <td>{formatCurrency(facture.montantTotal)}</td>
                    <td>{statutLabels[facture.statut] || facture.statut}</td>
                    <td>{facture.paiementsCount}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => openEditModal(facture)}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => handleDelete(facture.id)}
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
              <h3>{editingFacture ? 'Modifier une facture' : 'Nouvelle facture'}</h3>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => {
                  setShowModal(false)
                  setEditingFacture(null)
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
                  {candidats.map((candidat) => (
                    <option key={candidat.id} value={candidat.id}>
                      {candidat.prenom} {candidat.nom}
                    </option>
                  ))}
                </select>
                {errors.candidatId ? <small className="form-error">{errors.candidatId.message}</small> : null}
              </label>

              <div className="form-grid two-cols">
                <label className="field">
                  <span>Numero</span>
                  <input {...register('numero')} placeholder="FAC-2026-0001" />
                  {errors.numero ? <small className="form-error">{errors.numero.message}</small> : null}
                </label>
                <label className="field">
                  <span>Montant</span>
                  <input {...register('montantTotal')} type="number" min="0" placeholder="1400" />
                  {errors.montantTotal ? (
                    <small className="form-error">{errors.montantTotal.message}</small>
                  ) : null}
                </label>
              </div>

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

              <label className="field">
                <span>Notes</span>
                <textarea {...register('notes')} placeholder="Informations complementaires" />
              </label>

              <div className="toolbar-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false)
                    setEditingFacture(null)
                    reset()
                  }}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Sauvegarde...' : editingFacture ? 'Mettre a jour' : 'Creer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default Factures
