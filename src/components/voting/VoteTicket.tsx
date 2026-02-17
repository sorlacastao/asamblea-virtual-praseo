'use client'

import { Ticket, CheckCircle, XCircle, Minus, Copy } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { VoteTicket as VoteTicketType } from '@/types'

interface VoteTicketProps {
  ticket: VoteTicketType
  onDownload?: () => void
}

export default function VoteTicket({ ticket, onDownload }: VoteTicketProps) {
  const voteIcons = {
    a_favor: <CheckCircle className="w-6 h-6 text-success-500" />,
    en_contra: <XCircle className="w-6 h-6 text-danger-500" />,
    abstcion: <Minus className="w-6 h-6 text-slate-500" />,
  }

  const voteLabels = {
    a_favor: 'A Favor',
    en_contra: 'En Contra',
    abstcion: 'Abstención',
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(ticket.vote_hash)
  }

  return (
    <Card className="max-w-md mx-auto border-2 border-primary-200 dark:border-primary-800">
      <div className="text-center space-y-4">
        {/* Header */}
        <div className="flex justify-center">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full">
            <Ticket className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Comprobante de Voto
          </h3>
          <p className="text-sm text-slate-500">
            ID: {ticket.id.slice(0, 8)}...
          </p>
        </div>

        {/* Voto registrado */}
        <div className="flex items-center justify-center gap-2 py-2">
          {voteIcons[ticket.vote_value]}
          <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {voteLabels[ticket.vote_value]}
          </span>
        </div>

        {/* Info del punto de agenda */}
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-left">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Punto de agenda:
          </p>
          <p className="font-medium text-slate-900 dark:text-slate-100">
            {ticket.agenda_point_title}
          </p>
        </div>

        {/* Info del vecino */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-500">Vecino</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {ticket.neighbor_name}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Inmueble</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {ticket.property_number}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Coeficiente</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {ticket.coeficiente}%
            </p>
          </div>
          <div>
            <p className="text-slate-500">Fecha</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {new Date(ticket.timestamp).toLocaleString('es-MX')}
            </p>
          </div>
        </div>

        {/* Hash del voto */}
        <div className="space-y-2">
          <p className="text-sm text-slate-500">Hash SHA-256 del voto:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-slate-100 dark:bg-slate-700 p-2 rounded overflow-x-auto">
              {ticket.vote_hash}
            </code>
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              title="Copiar hash"
            >
              <Copy className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Botón de descarga */}
        {onDownload && (
          <Button onClick={onDownload} variant="secondary" className="w-full">
            Descargar Comprobante PDF
          </Button>
        )}
      </div>
    </Card>
  )
}
