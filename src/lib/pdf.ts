import jsPDF from 'jspdf'
import { VoteTicket } from '@/types'

/**
 * Generar PDF del ticket de voto
 */
export function generateVoteTicketPDF(ticket: VoteTicket): jsPDF {
  const doc = new jsPDF()

  // Título
  doc.setFontSize(20)
  doc.text('Comprobante de Voto', 105, 20, { align: 'center' })

  // Línea divisoria
  doc.setLineWidth(0.5)
  doc.line(20, 25, 190, 25)

  // Info del voto
  doc.setFontSize(12)
  doc.setTextColor(100)
  doc.text('ID del comprobante:', 20, 40)
  doc.setTextColor(0)
  doc.text(ticket.id, 70, 40)

  doc.setTextColor(100)
  doc.text('Fecha y hora:', 20, 50)
  doc.setTextColor(0)
  doc.text(new Date(ticket.timestamp).toLocaleString('es-MX'), 70, 50)

  doc.setTextColor(100)
  doc.text('Punto de agenda:', 20, 60)
  doc.setTextColor(0)
  doc.text(ticket.agenda_point_title, 70, 60)

  doc.setTextColor(100)
  doc.text('Voto:', 20, 70)
  doc.setTextColor(0)
  const voteLabel = ticket.vote_value === 'a_favor' 
    ? 'A Favor' 
    : ticket.vote_value === 'en_contra' 
      ? 'En Contra' 
      : 'Abstención'
  doc.text(voteLabel, 70, 70)

  // Info del vecino
  doc.line(20, 80, 190, 80)

  doc.setTextColor(100)
  doc.text('Vecino:', 20, 90)
  doc.setTextColor(0)
  doc.text(ticket.neighbor_name, 70, 90)

  doc.setTextColor(100)
  doc.text('Inmueble:', 20, 100)
  doc.setTextColor(0)
  doc.text(ticket.property_number, 70, 100)

  doc.setTextColor(100)
  doc.text('Coeficiente:', 20, 110)
  doc.setTextColor(0)
  doc.text(`${ticket.coeficiente}%`, 70, 110)

  // Hash del voto
  doc.line(20, 120, 190, 120)

  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text('Hash SHA-256 del voto:', 20, 130)
  
  doc.setFontSize(8)
  doc.setTextColor(0)
  const hashLines = doc.splitTextToSize(ticket.vote_hash, 170)
  doc.text(hashLines, 20, 140)

  // Pie de página
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(
    'Este documento es un comprobante oficial del voto emitido en la Asamblea Vecinal.',
    105,
    270,
    { align: 'center' }
  )

  return doc
}

/**
 * Descargar PDF del ticket
 */
export function downloadVoteTicketPDF(ticket: VoteTicket): void {
  const doc = generateVoteTicketPDF(ticket)
  doc.save(`comprobante-voto-${ticket.id.slice(0, 8)}.pdf`)
}

/**
 * Generar PDF de resultados de votación
 */
export function generateResultsPDF(
  assemblyName: string,
  agendaPointTitle: string,
  results: {
    a_favor: number
    en_contra: number
    abstenciones: number
    coeficiente_a_favor: number
    coeficiente_en_contra: number
    coeficiente_abstenciones: number
    aprobada: boolean
  }
): jsPDF {
  const doc = new jsPDF()

  // Título
  doc.setFontSize(18)
  doc.text('Resultados de Votación', 105, 20, { align: 'center' })

  doc.setFontSize(14)
  doc.text(assemblyName, 105, 30, { align: 'center' })

  doc.setFontSize(12)
  doc.text(agendaPointTitle, 105, 40, { align: 'center' })

  // Línea
  doc.setLineWidth(0.5)
  doc.line(20, 50, 190, 50)

  // Resultados
  doc.setFontSize(12)
  doc.text('Votos:', 20, 65)
  
  doc.setFontSize(11)
  doc.text(`A favor: ${results.a_favor}`, 30, 75)
  doc.text(`En contra: ${results.en_contra}`, 30, 85)
  doc.text(`Abstenciones: ${results.abstenciones}`, 30, 95)

  // Coeficientes
  doc.setFontSize(12)
  doc.text('Coeficientes:', 20, 110)
  
  doc.setFontSize(11)
  doc.text(`A favor: ${results.coeficiente_a_favor.toFixed(2)}%`, 30, 120)
  doc.text(`En contra: ${results.coeficiente_en_contra.toFixed(2)}%`, 30, 130)
  doc.text(`Abstenciones: ${results.coeficiente_abstenciones.toFixed(2)}%`, 30, 140)

  // Resultado final
  doc.setFontSize(14)
  doc.line(20, 150, 190, 150)
  
  if (results.aprobada) {
    doc.setTextColor(0, 150, 0)
    doc.text('APROBADA', 105, 165, { align: 'center' })
  } else {
    doc.setTextColor(200, 0, 0)
    doc.text('RECHAZADA', 105, 165, { align: 'center' })
  }

  return doc
}
