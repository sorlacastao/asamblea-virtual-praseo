'use client'

import { useEffect, useState, useCallback } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'

interface HeartbeatManagerProps {
  idInmueble: string
}

type ConnectionState = 'connected' | 'disconnected' | 'reconnecting'

export default function HeartbeatManager({ idInmueble }: HeartbeatManagerProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null)
  const [errorCount, setErrorCount] = useState(0)

  const sendHeartbeat = useCallback(async () => {
    if (!idInmueble) {
      console.warn('HeartbeatManager: No idInmueble provided')
      return
    }

    try {
      const response = await fetch('/api/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idInmueble }),
      })

      const data = await response.json()

      if (data.success) {
        setConnectionState('connected')
        setLastHeartbeat(new Date())
        setErrorCount(0)
      } else {
        console.error('Heartbeat failed:', data.error)
        setConnectionState('reconnecting')
        setErrorCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error('Heartbeat network error:', error)
      setConnectionState('reconnecting')
      setErrorCount((prev) => prev + 1)
    }
  }, [idInmueble])

  useEffect(() => {
    // Enviar heartbeat inicial
    sendHeartbeat()

    // Configurar interval cada 30 segundos (30000 ms)
    const intervalId = setInterval(() => {
      sendHeartbeat()
    }, 30000)

    // Cleanup: limpiar el interval al desmontar el componente
    return () => {
      clearInterval(intervalId)
    }
  }, [sendHeartbeat])

  // Determinar el icono y texto según el estado de conexión
  const getConnectionDisplay = () => {
    switch (connectionState) {
      case 'connected':
        return (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <Wifi className="w-4 h-4" />
            <span>Conectado</span>
            {lastHeartbeat && (
              <span className="text-slate-400 text-xs ml-1">
                • {lastHeartbeat.toLocaleTimeString()}
              </span>
            )}
          </div>
        )
      case 'reconnecting':
        return (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Reconectando...</span>
            {errorCount > 0 && (
              <span className="text-slate-400 text-xs ml-1">
                • {errorCount} error{errorCount !== 1 ? 'es' : ''}
              </span>
            )}
          </div>
        )
      case 'disconnected':
      default:
        return (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <WifiOff className="w-4 h-4" />
            <span>Sin conexión</span>
          </div>
        )
    }
  }

  return (
    <div className="heartbeat-manager" role="status" aria-live="polite">
      {getConnectionDisplay()}
    </div>
  )
}
