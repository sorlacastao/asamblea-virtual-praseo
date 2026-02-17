'use client'

import { useState, useCallback } from 'react'
import { VoteTicket } from '@/types'

interface UseVoteOptions {
  assemblyId: string
  agendaPointId: string
  neighborId: string
  neighborName: string
  propertyNumber: string
  coeficiente: number
}

interface UseVoteReturn {
  submitVote: (voteValue: 'a_favor' | 'en_contra' | 'abstcion') => Promise<VoteTicket | null>
  hasVoted: boolean
  ticket: VoteTicket | null
  isLoading: boolean
  error: string | null
}

export function useVote(options: UseVoteOptions): UseVoteReturn {
  const [hasVoted, setHasVoted] = useState(false)
  const [ticket, setTicket] = useState<VoteTicket | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitVote = useCallback(async (
    voteValue: 'a_favor' | 'en_contra' | 'abstcion'
  ): Promise<VoteTicket | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assemblyId: options.assemblyId,
          agendaPointId: options.agendaPointId,
          neighborId: options.neighborId,
          neighborName: options.neighborName,
          propertyNumber: options.propertyNumber,
          coeficiente: options.coeficiente,
          voteValue,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error al enviar el voto')
      }

      setHasVoted(true)
      setTicket(result.data)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [options])

  return {
    submitVote,
    hasVoted,
    ticket,
    isLoading,
    error,
  }
}

export default useVote
