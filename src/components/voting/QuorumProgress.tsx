'use client'

import { Users, Target, CheckCircle2, Percent } from 'lucide-react'
import ProgressBar from '@/components/ui/ProgressBar'
import Card from '@/components/ui/Card'

interface QuorumProgressProps {
  connectedUsers: number
  totalUsers: number
  quorumPercentage: number
  requiredQuorum: number
  isQuorumReached: boolean
  coeficienteVotado?: number
  coeficienteTotal?: number
}

export default function QuorumProgress({
  connectedUsers,
  totalUsers,
  quorumPercentage,
  requiredQuorum,
  isQuorumReached,
  coeficienteVotado,
  coeficienteTotal,
}: QuorumProgressProps) {
  return (
    <Card className="bg-slate-50 dark:bg-slate-800/50">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-500" />
            Control de Quórum
          </h3>
          {isQuorumReached ? (
            <span className="flex items-center gap-1 text-sm text-success-600 dark:text-success-400">
              <CheckCircle2 className="w-4 h-4" />
              Quórum alcanzado
            </span>
          ) : (
            <span className="flex items-center gap-1 text-sm text-warning-600 dark:text-warning-400">
              <Target className="w-4 h-4" />
              Pendiente
            </span>
          )}
        </div>

        {/* Progress bar */}
        <ProgressBar
          value={quorumPercentage}
          max={100}
          variant={isQuorumReached ? 'success' : 'warning'}
          size="lg"
          showLabel
        />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center p-3 bg-white dark:bg-slate-700/50 rounded-lg">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {connectedUsers}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Conectados
            </p>
          </div>
          <div className="text-center p-3 bg-white dark:bg-slate-700/50 rounded-lg">
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
              {totalUsers}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Total vecinos
            </p>
          </div>
        </div>

        {/* Coeficiente info - shown when available */}
        {coeficienteVotado !== undefined && coeficienteTotal !== undefined && coeficienteTotal > 0 && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Coeficiente de votos
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white dark:bg-slate-700/50 rounded-lg">
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {coeficienteVotado.toFixed(2)}%
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Votado
                </p>
              </div>
              <div className="text-center p-3 bg-white dark:bg-slate-700/50 rounded-lg">
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                  {coeficienteTotal.toFixed(2)}%
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Total censo
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Required quorum info */}
        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          <p>
            Se requiere <span className="font-semibold">{requiredQuorum}%</span> de quorum
          </p>
        </div>
      </div>
    </Card>
  )
}
