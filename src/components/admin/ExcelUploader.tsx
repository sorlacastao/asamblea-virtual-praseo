'use client'

import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { ExcelUploadResult, Vecino, CensusData } from '@/types'
import { activateAssemblySession } from '@/lib/redis'

interface ExcelUploaderProps {
  assemblyId?: string;
  onUpload: (vecinos: Vecino[], censusData: CensusData) => Promise<ExcelUploadResult>;
  onSessionActivated?: (success: boolean, error?: string) => void;
}

export default function ExcelUploader({ assemblyId, onUpload, onSessionActivated }: ExcelUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isActivatingSession, setIsActivatingSession] = useState(false)
  const [sessionActivationError, setSessionActivationError] = useState<string | null>(null)
  const [result, setResult] = useState<ExcelUploadResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setSessionActivationError(null)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      await processFile(files[0])
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setSessionActivationError(null)
      await processFile(files[0])
    }
  }

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setResult({
        success: false,
        total_records: 0,
        valid_records: 0,
        invalid_records: 0,
        errors: ['El archivo debe ser un Excel (.xlsx o .xls)'],
        vecinos: [],
      })
      return
    }

    setIsUploading(true)
    setSessionActivationError(null)
    
    try {
      // En una implementación real, aquí se leería el archivo con xlsx
      // Por ahora simulamos la carga
      console.log('Procesando archivo:', file.name)
      
      // Simular resultado
      const uploadResult = {
        success: true,
        total_records: 0,
        valid_records: 0,
        invalid_records: 0,
        errors: [],
        vecinos: [],
      }
      
      setResult(uploadResult)
      
      // Si hay un assemblyId y el procesamiento fue exitoso, activar sesión en Redis
      if (assemblyId && uploadResult.success) {
        setIsActivatingSession(true)
        
        const censusData: CensusData = {
          totalVecinos: uploadResult.total_records,
          coeficienteTotal: 0, // Este valor vendría del procesamiento real del Excel
          validRecords: uploadResult.valid_records,
          invalidRecords: uploadResult.invalid_records,
          fechaCarga: new Date().toISOString(),
        }
        
        try {
          const sessionActivated = await activateAssemblySession(assemblyId, {
            totalVecinos: censusData.totalVecinos,
            coeficienteTotal: censusData.coeficienteTotal,
            fechaCarga: censusData.fechaCarga,
          })
          
          if (sessionActivated) {
            console.log('Sesión de asamblea activada en Redis')
            onSessionActivated?.(true)
          } else {
            const errorMsg = 'Error al activar la sesión en Redis'
            setSessionActivationError(errorMsg)
            onSessionActivated?.(false, errorMsg)
          }
        } catch (sessionError) {
          const errorMsg = sessionError instanceof Error ? sessionError.message : 'Error desconocido al activar sesión'
          console.error('Error activating session:', sessionError)
          setSessionActivationError(errorMsg)
          onSessionActivated?.(false, errorMsg)
        } finally {
          setIsActivatingSession(false)
        }
      }
    } catch (error) {
      setResult({
        success: false,
        total_records: 0,
        valid_records: 0,
        invalid_records: 0,
        errors: ['Error al procesar el archivo'],
        vecinos: [],
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Cargar Vecinos desde Excel
        </h3>

        {/* Zona de drop */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragging 
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
              : 'border-slate-300 dark:border-slate-600 hover:border-primary-400'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="space-y-3">
            <div className="flex justify-center">
              {isUploading ? (
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-12 h-12 text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-slate-700 dark:text-slate-300 font-medium">
                {isUploading ? 'Procesando archivo...' : 'Arrastra un archivo Excel o haz clic para seleccionar'}
              </p>
              <p className="text-sm text-slate-500">
                Formatos soportados: .xlsx, .xls
              </p>
            </div>
          </div>
        </div>

        {/* Plantilla descargable */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-success-500" />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Descargar plantilla de ejemplo
            </span>
          </div>
          <Button variant="ghost" size="sm">
            Descargar
          </Button>
        </div>

        {/* Resultado */}
        {result && (
          <div className={`
            p-4 rounded-lg
            ${result.success 
              ? 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800' 
              : 'bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800'
            }
          `}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-success-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-danger-500" />
              )}
              <span className="font-medium">
                {result.success ? 'Archivo procesado correctamente' : 'Error al procesar archivo'}
              </span>
            </div>
            
            {result.success && result.total_records > 0 && (
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <p>Total de registros: {result.total_records}</p>
                <p>Registros válidos: {result.valid_records}</p>
                {result.invalid_records > 0 && (
                  <p className="text-warning-600">Registros inválidos: {result.invalid_records}</p>
                )}
              </div>
            )}
            
            {result.errors.length > 0 && (
              <ul className="mt-2 text-sm text-danger-600 dark:text-danger-400 list-disc list-inside">
                {result.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}

            {/* Feedback de activación de sesión */}
            {isActivatingSession && (
              <div className="mt-3 p-3 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg">
                <div className="flex items-center gap-2 text-info-700 dark:text-info-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Activando sesión en Redis...</span>
                </div>
              </div>
            )}

            {sessionActivationError && (
              <div className="mt-3 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
                <div className="flex items-center gap-2 text-warning-700 dark:text-warning-300">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{sessionActivationError}</span>
                </div>
                <p className="text-xs text-warning-600 dark:text-warning-400 mt-1">
                  El archivo se procesó correctamente, pero la sesión no se activó.
                </p>
              </div>
            )}

            {result.success && !isActivatingSession && !sessionActivationError && assemblyId && (
              <div className="mt-3 p-3 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg">
                <div className="flex items-center gap-2 text-success-700 dark:text-success-300">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Sesión de asamblea activada</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
