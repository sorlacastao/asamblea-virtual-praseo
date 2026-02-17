'use client'

import { useState } from 'react'
import { Play, Pause, Square, Clock, Users, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { EstadoAsistencia } from '@/types'
import { closeAssemblySession, cleanupAssemblyData } from '@/lib/redis'

interface AssemblyControlProps {
  assembly: EstadoAsistencia
  onStart: () => Promise<void>
  onPause: () => Promise<void>
  onResume: () => Promise<void>
  onClose: () => Promise<void>
  onGenerateFinalReport?: () => Promise<{ success: boolean; pdf?: any; error?: string }>
}

export default function AssemblyControl({
  assembly,
  onStart,
  onPause,
  onResume,
  onClose,
  onGenerateFinalReport,
}: AssemblyControlProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [pdfGenerationError, setPdfGenerationError] = useState<string | null>(null)
  const [pdfGenerated, setPdfGenerated] = useState(false)

  const handleAction = async (action: () => Promise<void>) => {
    setIsLoading(true)
    try {
      await action()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateFinalReport = async () => {
    if (!assembly?.id) return
    
    setIsGeneratingPDF(true)
    setPdfGenerationError(null)
    setPdfGenerated(false)
    
    try {
      // Paso 1: Generar PDF
      const pdfResult = await onGenerateFinalReport?.() || { success: true }
      
      if (!pdfResult.success) {
        throw new Error(pdfResult.error || 'Error al generar PDF')
      }
      
      setPdfGenerated(true)
      
      // Paso 2: Cerrar sesión en Redis (solo si PDF fue exitoso)
      await closeAssemblySession(assembly.id)
      await cleanupAssemblyData(assembly.id)
      
      // Paso 3: Actualizar estado en Supabase
      await onClose()
      
      // Feedback de éxito
      setPdfGenerationError(null)
      
    } catch (error) {
      // Si falla el PDF, NO cerramos la sesión en Redis
      setPdfGenerationError(
        error instanceof Error 
          ? error.message 
          : 'Error al generar el PDF. El estado de la asamblea permanece activo para reintentar.'
      )
      setPdfGenerated(false)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const getStatusColor = () => {
    switch (assembly.estado) {
      case 'convocada':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'en_curso':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'suspendida':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'cerrada':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const getStatusLabel = () => {
    switch (assembly.estado) {
      case 'convocada':
        return 'Convocada'
      case 'en_curso':
        return 'En Curso'
      case 'suspendida':
        return 'Suspendida'
      case 'cerrada':
        return 'Cerrada'
      default:
        return assembly.estado
    }
  }

  const getButtonLabel = () => {
    if (isGeneratingPDF) {
      return 'Generando...'
    }
    if (pdfGenerated) {
      return 'PDF Generado ✓'
    }
    return 'Generar Acta Final'
  }

  const getButtonIcon = () => {
    if (isGeneratingPDF) {
      return <Loader2 className="w-4 h-4 animate-spin" />
    }
    if (pdfGenerated) {
      return <CheckCircle className="w-4 h-4" />
    }
    return <FileText className="w-4 h-4" />
  }

  return (
    <Card>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {assembly.nombre}
            </h3>
            <p className="text-sm text-slate-500">
              {new Date(assembly.fecha).toLocaleDateString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
            {getStatusLabel()}
          </span>
        </div>

        {/* Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Hora de inicio</span>
            </div>
            <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
              {assembly.hora_inicio}
            </p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Users className="w-4 h-4" />
              <span className="text-sm">Vecinos</span>
            </div>
            <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
              {assembly.vecinos_count}
            </p>
          </div>
        </div>

        {/* Error/Success Messages */}
        {pdfGenerationError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{pdfGenerationError}</p>
            </div>
          </div>
        )}

        {pdfGenerated && !pdfGenerationError && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">Acta final generada exitosamente. La asamblea ha sido cerrada.</p>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-wrap gap-3">
          {assembly.estado === 'convocada' && (
            <Button
              onClick={() => handleAction(onStart)}
              disabled={isLoading || isGeneratingPDF}
              isLoading={isLoading}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Iniciar Asamblea
            </Button>
          )}

          {assembly.estado === 'en_curso' && (
            <>
              <Button
                onClick={() => handleAction(onPause)}
                disabled={isLoading || isGeneratingPDF}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Pausar
              </Button>
              
              {/* Botón de Generar Acta Final */}
              <Button
                onClick={handleGenerateFinalReport}
                disabled={isLoading || isGeneratingPDF}
                isLoading={isGeneratingPDF}
                variant="danger"
                className="flex items-center gap-2"
              >
                {getButtonIcon()}
                {getButtonLabel()}
              </Button>
            </>
          )}

          {assembly.estado === 'suspendida' && (
            <Button
              onClick={() => handleAction(onResume)}
              disabled={isLoading || isGeneratingPDF}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Reanudar
            </Button>
          )}
        </div>

        {/* Puntos de agenda */}
        <div>
          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">
            Puntos de Agenda
          </h4>
          <ul className="space-y-2">
            {assembly.puntos_agenda.map((punto: { id: string; titulo: string; requiere_votacion: boolean }, index: number) => (
              <li 
                key={punto.id}
                className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700/50 rounded"
              >
                <span className="w-6 h-6 flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {punto.titulo}
                </span>
                {punto.requiere_votacion && (
                  <span className="ml-auto text-xs px-2 py-0.5 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 rounded">
                    Votación
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}
