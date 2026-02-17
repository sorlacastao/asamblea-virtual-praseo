'use client'

import { useState } from 'react'
import QuorumProgress from '@/components/voting/QuorumProgress'
import VoteForm from '@/components/voting/VoteForm'
import ConnectionStatus from '@/components/voting/ConnectionStatus'
import { useQuorum } from '@/hooks/useQuorum'

export default function VotingPage() {
  // Estado de ejemplo - en implementación real vendría de la URL o props
  const [assemblyId] = useState('demo-assembly')
  const [userId] = useState('demo-user')
  
  // Datos de ejemplo para el quórum
  const {
    connectedUsers,
    quorumPercentage,
    coeficienteVotado,
    totalCoeficiente,
    isQuorumReached,
    isLoading,
    error,
  } = useQuorum({
    assemblyId,
    requiredQuorum: 50,
    totalUsers: 100,
    coeficienteTotal: 100, // Coeficiente total del censo (ejemplo)
    coeficientes: {}, // Mapa de vecino -> coeficiente
    agendaPointId: '1', // ID del punto de agenda actual
  })

  // Datos de ejemplo para el formulario de投票
  const currentAgendaPoint = {
    id: '1',
    titulo: 'Aprobación de presupuesto 2024',
    descripcion: 'Se somete a votación la propuesta de presupuesto anual para el ejercicio 2024',
    tipo: 'votacion' as const,
    orden: 1,
    requiere_votacion: true,
  }

  const neighborInfo = {
    id: userId,
    name: 'Juan Pérez',
    propertyNumber: '101',
    coeficiente: 5.5,
  }

  const handleVote = async (voteValue: 'a_favor' | 'en_contra' | 'abstcion') => {
    console.log('Voto registrado:', voteValue)
    // En implementación real, aquí se enviaría el voto al servidor
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Asamblea Vecinal 2024
          </h1>
          <ConnectionStatus assemblyId={assemblyId} userId={userId} />
        </div>

        {/* Error de conexión */}
        {error && (
          <div className="p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
            <p className="text-warning-700 dark:text-warning-400">{error}</p>
          </div>
        )}

        {/* Grid de quorum y formulario */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Panel de quórum */}
          <div className="md:col-span-1">
            <QuorumProgress
              connectedUsers={connectedUsers}
              totalUsers={100}
              quorumPercentage={quorumPercentage}
              requiredQuorum={50}
              isQuorumReached={isQuorumReached}
              coeficienteVotado={coeficienteVotado}
              coeficienteTotal={totalCoeficiente}
            />
          </div>

          {/* Formulario de投票 */}
          <div className="md:col-span-2">
            {isQuorumReached ? (
              <VoteForm
                agendaPoint={currentAgendaPoint}
                neighborInfo={neighborInfo}
                onVote={handleVote}
                hasVoted={false}
              />
            ) : (
              <div className="p-8 text-center bg-slate-100 dark:bg-slate-800 rounded-lg">
                <p className="text-slate-600 dark:text-slate-400">
                  Esperando quórum mínimo para comenzar la votación...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
