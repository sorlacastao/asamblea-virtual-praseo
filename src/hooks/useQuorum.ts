'use client'

import { useState, useEffect, useCallback } from 'react'
import { getQuorumStatus } from '@/lib/redis'
import { QuorumStatus } from '@/types'

interface UseQuorumOptions {
  assemblyId: string
  requiredQuorum: number
  totalUsers: number
  coeficienteTotal?: number
  coeficientes?: Record<string, number>
  agendaPointId?: string
  pollInterval?: number // en milisegundos, por defecto 5000ms
}

interface UseQuorumReturn {
  quorumStatus: QuorumStatus | null
  connectedUsers: number
  quorumPercentage: number
  coeficienteVotado: number
  totalCoeficiente: number
  isQuorumReached: boolean
  isLoading: boolean
  error: string | null
  refreshQuorum: () => Promise<void>
}

export function useQuorum({
  assemblyId,
  requiredQuorum,
  totalUsers,
  coeficienteTotal,
  coeficientes,
  agendaPointId,
  pollInterval = 5000,
}: UseQuorumOptions): UseQuorumReturn {
  const [quorumStatus, setQuorumStatus] = useState<QuorumStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuorum = useCallback(async () => {
    try {
      setError(null)
      const status = await getQuorumStatus(
        assemblyId, 
        requiredQuorum, 
        totalUsers,
        coeficienteTotal,
        agendaPointId,
        coeficientes
      )
      setQuorumStatus(status)
    } catch (err) {
      console.error('Error fetching quorum:', err)
      setError('Error al obtener el quórum. Verificando conexión...')
    } finally {
      setIsLoading(false)
    }
  }, [assemblyId, requiredQuorum, totalUsers, coeficienteTotal, agendaPointId, coeficientes])

  // Fetch inicial
  useEffect(() => {
    fetchQuorum()
  }, [fetchQuorum])

  // Polling para actualizaciones del quórum
  useEffect(() => {
    if (!assemblyId) return

    const intervalId = setInterval(() => {
      fetchQuorum()
    }, pollInterval)

    return () => {
      clearInterval(intervalId)
    }
  }, [assemblyId, pollInterval, fetchQuorum])

  return {
    quorumStatus,
    connectedUsers: quorumStatus?.connected_users ?? 0,
    quorumPercentage: quorumStatus?.quorum_percentage ?? 0,
    coeficienteVotado: quorumStatus?.coeficiente_votado ?? 0,
    totalCoeficiente: coeficienteTotal ?? 0,
    isQuorumReached: quorumStatus?.is_quorum_reached ?? false,
    isLoading,
    error,
    refreshQuorum: fetchQuorum,
  }
}

export default useQuorum
