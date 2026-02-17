'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle, Loader2, Plus, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { generateResultsPDF } from '@/lib/pdf'
import { Vecino, CensusData, ExcelUploadResult } from '@/types'
import ExcelUploader from '@/components/admin/ExcelUploader'
import AssemblyControl from '@/components/admin/AssemblyControl'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

// Tipo local para la asamblea
interface AssemblyData {
  id: string
  nombre: string
  fecha: string | Date
  hora_inicio: string
  hora_fin?: string
  tipo: 'ordinaria' | 'extraordinaria'
  estado: 'convocada' | 'en_curso' | 'cerrada' | 'suspendida'
  quorum_minimo: number
  coeficiente_total: number
  vecinos_count: number
  puntos_agenda: Array<{
    id: string
    titulo: string
    descripcion: string
    tipo: 'informativo' | 'votacion' | 'discusion'
    orden: number
    requiere_votacion: boolean
  }>
}

type LoadingState = 'idle' | 'loading' | 'loaded' | 'error'

export default function AdminDashboard() {
  const searchParams = useSearchParams()
  const assemblyIdFromUrl = searchParams.get('id')

  const [loadingState, setLoadingState] = useState<LoadingState>('loading')
  const [assembly, setAssembly] = useState<AssemblyData | null>(null)
  const [censusLoaded, setCensusLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Cargar datos de la asamblea
  const loadAssembly = useCallback(async (id: string) => {
    setLoadingState('loading')
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('assemblies')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Verificar si tiene vecinos cargados (censo)
      const { count } = await supabase
        .from('neighbors')
        .select('*', { count: 'exact', head: true })
        .eq('assembly_id', id)

      setAssembly(data as AssemblyData)
      setCensusLoaded((count ?? 0) > 0)
      setLoadingState('loaded')
    } catch (err) {
      console.error('Error loading assembly:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar la asamblea')
      setLoadingState('error')
    }
  }, [])

  // Crear una nueva asamblea
  const createNewAssembly = useCallback(async () => {
    setIsCreating(true)
    setError(null)

    try {
      const now = new Date()
      const newAssembly = {
        nombre: `Asamble ${now.toLocaleDateString('es-MX', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`,
        fecha: now.toISOString().split('T')[0],
        hora_inicio: '09:00',
        tipo: 'ordinaria' as const,
        estado: 'convocada' as const,
        quorum_minimo: 50,
        coeficiente_total: 0,
        vecinos_count: 0,
        puntos_agenda: [],
      }

      const { data, error: insertError } = await supabase
        .from('assemblies')
        .insert(newAssembly)
        .select()
        .single()

      if (insertError) throw insertError

      setAssembly(data as AssemblyData)
      setCensusLoaded(false)
      setLoadingState('loaded')
      
      // Actualizar URL con el nuevo ID
      const url = new URL(window.location.href)
      url.searchParams.set('id', data.id)
      window.history.replaceState({}, '', url.toString())
    } catch (err) {
      console.error('Error creating assembly:', err)
      setError(err instanceof Error ? err.message : 'Error al crear la asamblea')
      setLoadingState('error')
    } finally {
      setIsCreating(false)
    }
  }, [])

  // Cargar asamblea al inicio
  useEffect(() => {
    if (assemblyIdFromUrl) {
      loadAssembly(assemblyIdFromUrl)
    } else {
      // Si no hay ID, crear nueva asamblea automáticamente
      createNewAssembly()
    }
  }, [assemblyIdFromUrl, loadAssembly, createNewAssembly])

  // Callback cuando se sube el censo
  const handleCensusUpload = async (vecinos: Vecino[], censusData: CensusData): Promise<ExcelUploadResult> => {
    if (!assembly) {
      return {
        success: false,
        total_records: 0,
        valid_records: 0,
        invalid_records: 0,
        errors: ['No hay asamblea seleccionada'],
        vecinos: [],
      }
    }

    try {
      // Insertar los vecinos en Supabase
      const neighborsToInsert = vecinos.map((v: Vecino) => ({
        id: crypto.randomUUID(),
        assembly_id: assembly.id,
        name: v.nombre,
        email: v.email,
        phone: v.telefono,
        property_type: v.inmueble.tipo,
        property_number: v.inmueble.numero,
        property_block: v.inmueble.bloque,
        property_floor: v.inmueble.piso,
        coeficiente: v.coeficiente,
        payment_ref: v.ref_pago,
      }))

      const { error: insertError } = await supabase
        .from('neighbors')
        .insert(neighborsToInsert)
        .select()

      if (insertError) throw insertError

      // Calcular coeficiente total
      const coeficienteTotal = vecinos.reduce((sum, v) => sum + v.coeficiente, 0)

      // Actualizar la asamblea con el conteo de vecinos
      const { error: updateError } = await supabase
        .from('assemblies')
        .update({
          vecinos_count: vecinos.length,
          coeficiente_total: coeficienteTotal,
        })
        .eq('id', assembly.id)

      if (updateError) throw updateError

      // Actualizar estado local
      setCensusLoaded(true)
      setAssembly((prev: AssemblyData | null) => prev ? ({
        ...prev,
        vecinos_count: vecinos.length,
        coeficiente_total: coeficienteTotal,
      }) : null)

      return {
        success: true,
        total_records: censusData.totalVecinos,
        valid_records: censusData.validRecords,
        invalid_records: censusData.invalidRecords,
        errors: [],
        vecinos,
      }
    } catch (err) {
      console.error('Error uploading census:', err)
      return {
        success: false,
        total_records: 0,
        valid_records: 0,
        invalid_records: 0,
        errors: [err instanceof Error ? err.message : 'Error al guardar los vecinos'],
        vecinos: [],
      }
    }
  }

  // Callback cuando se activa la sesión en Redis
  const handleSessionActivated = (success: boolean, errorMsg?: string) => {
    if (!success) {
      console.error('Session activation failed:', errorMsg)
    }
  }

  // Iniciar la asamblea
  const handleStart = async () => {
    if (!assembly) return

    if (!censusLoaded) {
      alert('Debe cargar el censo de vecinos antes de iniciar la asamblea')
      return
    }

    try {
      const { data, error } = await supabase
        .from('assemblies')
        .update({ estado: 'en_curso' as const })
        .eq('id', assembly.id)
        .select()
        .single()

      if (error) throw error

      setAssembly(data as AssemblyData)
    } catch (err) {
      console.error('Error starting assembly:', err)
      alert(err instanceof Error ? err.message : 'Error al iniciar la asamblea')
    }
  }

  // Pausar la asamblea
  const handlePause = async () => {
    if (!assembly) return

    try {
      const { data, error } = await supabase
        .from('assemblies')
        .update({ estado: 'suspendida' as const })
        .eq('id', assembly.id)
        .select()
        .single()

      if (error) throw error

      setAssembly(data as AssemblyData)
    } catch (err) {
      console.error('Error pausing assembly:', err)
      alert(err instanceof Error ? err.message : 'Error al pausar la asamblea')
    }
  }

  // Reanudar la asamblea
  const handleResume = async () => {
    if (!assembly) return

    try {
      const { data, error } = await supabase
        .from('assemblies')
        .update({ estado: 'en_curso' as const })
        .eq('id', assembly.id)
        .select()
        .single()

      if (error) throw error

      setAssembly(data as AssemblyData)
    } catch (err) {
      console.error('Error resuming assembly:', err)
      alert(err instanceof Error ? err.message : 'Error al reanudar la asamblea')
    }
  }

  // Cerrar la asamblea
  const handleClose = async () => {
    if (!assembly) return

    const confirmClose = window.confirm('¿Está seguro de que desea cerrar la asamblea? Esta acción no se puede deshacer.')
    if (!confirmClose) return

    try {
      const now = new Date()
      const { data, error } = await supabase
        .from('assemblies')
        .update({ 
          estado: 'cerrada' as const,
          hora_fin: now.toTimeString().slice(0, 5),
        })
        .eq('id', assembly.id)
        .select()
        .single()

      if (error) throw error

      setAssembly(data as AssemblyData)
    } catch (err) {
      console.error('Error closing assembly:', err)
      alert(err instanceof Error ? err.message : 'Error al cerrar la asamblea')
    }
  }

  // Generar el reporte final (PDF)
  const handleGenerateFinalReport = async (): Promise<{
    success: boolean
    pdf?: any
    error?: string
  }> => {
    if (!assembly) {
      return { success: false, error: 'No hay asamblea seleccionada' }
    }

    try {
      // 1. Obtener los votos de la asamblea
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .eq('assembly_id', assembly.id)

      if (votesError) throw votesError

      // 2. Obtener información de los vecinos para los coeficientes
      const { data: neighbors, error: neighborsError } = await supabase
        .from('neighbors')
        .select('id, coeficiente')
        .eq('assembly_id', assembly.id)

      if (neighborsError) throw neighborsError

      // Crear mapa de coeficientes por id de vecino
      const coeficienteMap = new Map<string, number>()
      neighbors?.forEach((n: { id: string; coeficiente: number }) => {
        coeficienteMap.set(n.id, n.coeficiente)
      })

      // 3. Calcular resultados agregados
      let a_favor = 0
      let en_contra = 0
      let abstenciones = 0
      let coeficiente_a_favor = 0
      let coeficiente_en_contra = 0
      let coeficiente_abstenciones = 0

      votes?.forEach((vote: { id_vecino: string; valor: string }) => {
        const coeficiente = coeficienteMap.get(vote.id_vecino) || 0
        
        switch (vote.valor) {
          case 'a_favor':
            a_favor++
            coeficiente_a_favor += coeficiente
            break
          case 'en_contra':
            en_contra++
            coeficiente_en_contra += coeficiente
            break
          case 'abstcion':
          case 'abstención':
            abstenciones++
            coeficiente_abstenciones += coeficiente
            break
        }
      })

      // Calcular si fue aprobada (mayoría simple del coeficiente total)
      const coeficienteTotal = assembly.coeficiente_total || 0
      const aprobada = coeficiente_a_favor > (coeficienteTotal / 2)

      // 4. Obtener información de la asamblea
      const { data: assemblyData } = await supabase
        .from('assemblies')
        .select('*')
        .eq('id', assembly.id)
        .single()

      if (!assemblyData) throw new Error('Asamblea no encontrada')

      // 5. Generar el PDF usando la función de lib/pdf
      const pdf = generateResultsPDF(
        assemblyData.nombre,
        'Acta Final de Asamblea',
        {
          a_favor,
          en_contra,
          abstenciones,
          coeficiente_a_favor,
          coeficiente_en_contra,
          coeficiente_abstenciones,
          aprobada,
        }
      )

      // 6. Descargar el PDF
      pdf.save(`acta-final-${assembly.id.slice(0, 8)}.pdf`)

      // 7. Retornar éxito
      return { success: true, pdf }

    } catch (error) {
      console.error('Error generando PDF:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }
    }
  }

  // Renderizar estado de carga
  if (loadingState === 'loading' || isCreating) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            {isCreating ? 'Creando nueva asamblea...' : 'Cargando datos de la asamblea...'}
          </p>
        </div>
      </div>
    )
  }

  // Renderizar error
  if (loadingState === 'error' || error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Error
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {error || 'Ocurrió un error al cargar los datos'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => loadAssembly(assemblyIdFromUrl || '')}>
                Reintentar
              </Button>
              <Button variant="secondary" onClick={createNewAssembly}>
                Crear nueva asamblea
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // No hay asamblea
  if (!assembly) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <Settings className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            No hay asamblea seleccionada
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Seleccione una asamblea existente o cree una nueva
          </p>
          <Button onClick={createNewAssembly} className="flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            Crear nueva asamblea
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Panel de Administración
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Administre la asamblea y controle el proceso de votación
          </p>
        </div>

        {/* Info de la Asamblea */}
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {assembly.nombre}
              </h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                <span>{new Date(assembly.fecha).toLocaleDateString('es-MX', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}</span>
                <span>•</span>
                <span>ID: {assembly.id.slice(0, 8)}...</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {censusLoaded ? (
                <span className="flex items-center gap-2 px-3 py-1.5 bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 rounded-full text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Censo cargado
                </span>
              ) : (
                <span className="flex items-center gap-2 px-3 py-1.5 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 rounded-full text-sm font-medium">
                  <AlertCircle className="w-4 h-4" />
                  Sin censo
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Estado del censo (solo mostrar si no está cargado) */}
        {!censusLoaded && (
          <div className="mb-6 p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning-600 dark:text-warning-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-warning-800 dark:text-warning-300">
                  Debe cargar el censo de vecinos
                </h3>
                <p className="text-sm text-warning-700 dark:text-warning-400 mt-1">
                  Para iniciar la asamblea, primero debe cargar el archivo Excel con los vecinos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Componentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ExcelUploader - siempre visible */}
          <ExcelUploader
            assemblyId={assembly.id}
            onUpload={handleCensusUpload}
            onSessionActivated={handleSessionActivated}
          />

          {/* AssemblyControl - solo si hay censo cargado */}
          {censusLoaded && assembly ? (
            <AssemblyControl
              assembly={assembly as any}
              onStart={handleStart}
              onPause={handlePause}
              onResume={handleResume}
              onClose={handleClose}
              onGenerateFinalReport={handleGenerateFinalReport}
            />
          ) : (
            <Card className="lg:col-span-1">
              <div className="text-center py-12">
                <Settings className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Control de Asamblea
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  El control de la asamblea se habilitará después de cargar el censo de vecinos.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Información adicional */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {assembly.vecinos_count}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Vecinos registrados
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {assembly.coeficiente_total.toFixed(2)}%
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Coeficiente total
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {assembly.quorum_minimo}%
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Quórum mínimo requerido
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
