'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { PuntoAgenda, VoteTicket } from '@/types'

interface VoteFormProps {
  agendaPoint: PuntoAgenda
  neighborInfo: {
    id: string
    name: string
    propertyNumber: string
    coeficiente: number
  }
  onVote: (voteValue: 'a_favor' | 'en_contra' | 'abstcion') => Promise<void>
  hasVoted: boolean
  disabled?: boolean
}

export default function VoteForm({
  agendaPoint,
  neighborInfo,
  onVote,
  hasVoted,
  disabled = false,
}: VoteFormProps) {
  const [selectedVote, setSelectedVote] = useState<'a_favor' | 'en_contra' | 'abstcion' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedVote || hasVoted || disabled) return
    
    setIsSubmitting(true)
    try {
      await onVote(selectedVote)
    } catch (error) {
      console.error('Error submitting vote:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const voteOptions = [
    { 
      value: 'a_favor' as const, 
      label: 'A Favor', 
      icon: ThumbsUp,
      color: 'text-success-500',
      bgColor: 'hover:bg-success-50 dark:hover:bg-success-900/20',
      selectedColor: 'bg-success-500 text-white',
    },
    { 
      value: 'en_contra' as const, 
      label: 'En Contra', 
      icon: ThumbsDown,
      color: 'text-danger-500',
      bgColor: 'hover:bg-danger-50 dark:hover:bg-danger-900/20',
      selectedColor: 'bg-danger-500 text-white',
    },
    { 
      value: 'abstcion' as const, 
      label: 'Abstención', 
      icon: Minus,
      color: 'text-slate-500',
      bgColor: 'hover:bg-slate-100 dark:hover:bg-slate-700',
      selectedColor: 'bg-slate-500 text-white',
    },
  ]

  return (
    <Card className="max-w-lg mx-auto">
      <div className="space-y-6">
        {/* Info del vecino */}
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Vecino: <span className="font-medium text-slate-900 dark:text-slate-100">{neighborInfo.name}</span>
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Inmueble: <span className="font-medium text-slate-900 dark:text-slate-100">{neighborInfo.propertyNumber}</span>
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Coeficiente: <span className="font-medium text-slate-900 dark:text-slate-100">{neighborInfo.coeficiente}%</span>
          </p>
        </div>

        {/* Punto de agenda */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            {agendaPoint.titulo}
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {agendaPoint.descripcion}
          </p>
        </div>

        {/* Opciones de voto */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Seleccione su voto:
          </p>
          <div className="grid grid-cols-3 gap-3">
            {voteOptions.map((option) => {
              const Icon = option.icon
              const isSelected = selectedVote === option.value
              
              return (
                <button
                  key={option.value}
                  onClick={() => !hasVoted && !disabled && setSelectedVote(option.value)}
                  disabled={hasVoted || disabled}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                    ${isSelected 
                      ? option.selectedColor 
                      : `border-slate-200 dark:border-slate-600 ${option.bgColor}`
                    }
                    ${(hasVoted || disabled) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? '' : option.color}`} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    {option.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Botón de envío */}
        <Button
          onClick={handleSubmit}
          disabled={!selectedVote || hasVoted || disabled || isSubmitting}
          isLoading={isSubmitting}
          className="w-full"
          size="lg"
        >
          {hasVoted ? 'Ya ha votado' : 'Confirmar Voto'}
        </Button>

        {/* Alerta de quórum */}
        {disabled && (
          <p className="text-center text-sm text-warning-600 dark:text-warning-400">
            Esperando quórum mínimo para comenzar la votación
          </p>
        )}
      </div>
    </Card>
  )
}
