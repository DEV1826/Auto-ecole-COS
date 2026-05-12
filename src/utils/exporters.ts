function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export async function exportFacturesFallback({ factures, formatCurrency, format = 'xlsx' }) {
  if (format === 'pdf') {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    let y = 18

    doc.setFontSize(18)
    doc.text('Registre des factures', 14, y)
    y += 10
    doc.setFontSize(11)
    doc.text(`Genere le ${formatDate(new Date())}`, 14, y)
    y += 12
    doc.setFontSize(10)

    factures.forEach((facture) => {
      if (y > 280) {
        doc.addPage()
        y = 18
      }

      const client = facture.candidat
        ? `${facture.candidat.prenom} ${facture.candidat.nom}`
        : '-'

      doc.text(
        `${facture.numero} | ${client} | ${formatCurrency(facture.montantTotal)} | ${facture.statut}`,
        14,
        y,
      )
      y += 7
    })

    doc.save(`factures-${new Date().toISOString().slice(0, 10)}.pdf`)
    return { format: 'pdf', mode: 'browser' }
  }

  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Factures')

  sheet.columns = [
    { header: 'Numero', key: 'numero', width: 18 },
    { header: 'Client', key: 'client', width: 28 },
    { header: 'Date emission', key: 'dateEmission', width: 16 },
    { header: 'Montant', key: 'montant', width: 16 },
    { header: 'Statut', key: 'statut', width: 24 },
    { header: 'Paiements lies', key: 'paiementsCount', width: 18 },
  ]

  factures.forEach((facture) => {
    sheet.addRow({
      numero: facture.numero,
      client: facture.candidat ? `${facture.candidat.prenom} ${facture.candidat.nom}` : '-',
      dateEmission: formatDate(facture.dateEmission),
      montant: Number(facture.montantTotal || 0),
      statut: facture.statut,
      paiementsCount: facture.paiementsCount || 0,
    })
  })

  sheet.getRow(1).font = { bold: true }
  sheet.getColumn('montant').numFmt = '#,##0 "FCFA"'

  const buffer = await workbook.xlsx.writeBuffer()
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `factures-${new Date().toISOString().slice(0, 10)}.xlsx`,
  )

  return { format: 'xlsx', mode: 'browser' }
}

export async function exportRapportFallback({
  dashboardStats,
  monthlyStats,
  formatCurrency,
}) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  let y = 18

  doc.setFontSize(18)
  doc.text('Bilan Auto-Ecole', 14, y)
  y += 10
  doc.setFontSize(11)
  doc.text(`Genere le ${formatDate(new Date())}`, 14, y)
  y += 12

  const lines = [
    `Candidats actifs : ${dashboardStats?.candidatsActifs || 0}`,
    `Paiements : ${dashboardStats?.paiementsCount || 0}`,
    `Solde caisse : ${formatCurrency(dashboardStats?.soldeCaisse || 0)}`,
    `Examens planifies : ${dashboardStats?.examensPlanifies || 0}`,
  ]

  lines.forEach((line) => {
    doc.text(line, 14, y)
    y += 8
  })

  y += 4
  doc.setFontSize(13)
  doc.text('Synthese mensuelle', 14, y)
  y += 8
  doc.setFontSize(10)

  monthlyStats.forEach((item) => {
    if (y > 280) {
      doc.addPage()
      y = 18
    }

    doc.text(
      `${item.label} | Encaissements ${formatCurrency(item.encaissements)} | Depenses ${formatCurrency(item.depenses)} | Nouveaux ${item.nouveauxCandidats}`,
      14,
      y,
    )
    y += 7
  })

  doc.save(`bilan-autoecole-${new Date().toISOString().slice(0, 10)}.pdf`)
  return { format: 'pdf', mode: 'browser' }
}

export async function exportRecuFallback({ recu, formatCurrency }) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  let y = 18

  doc.setFontSize(18)
  doc.text('Recu de paiement', 14, y)
  y += 10
  doc.setFontSize(11)
  doc.text(`Numero : ${recu.numero}`, 14, y)
  y += 8
  doc.text(`Date : ${formatDate(recu.date)}`, 14, y)
  y += 12

  const lines = [
    `Candidat : ${recu.candidat?.prenom || ''} ${recu.candidat?.nom || ''}`.trim(),
    `Montant : ${formatCurrency(recu.montant)}`,
    `Mode : ${recu.mode}`,
    `Reference : ${recu.reference || '-'}`,
    `Facture : ${recu.facture?.numero || '-'}`,
  ]

  lines.forEach((line) => {
    doc.text(line, 14, y)
    y += 8
  })

  doc.save(`${recu.numero}.pdf`)
  return { format: 'pdf', mode: 'browser' }
}
