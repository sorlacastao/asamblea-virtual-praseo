'use client'

import { useEffect, useState } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { updateHeartbeat } from '@/lib/redis'

interface ConnectionStatusProps {
  assemblyId: string
  userId: string
}

export default function ConnectionStatus({ assemblyId, userId }: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null)

  useEffect(() => {
    // Estado inicial de conexión
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Heartbeat para mantener la sesión activa
  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        await updateHeartbeat(assemblyId, userId)
        setLastHeartbeat(new Date())
        setIsReconnecting(false)
      } catch (error) {
        console.error('Heartbeat error:', error)
        setIsReconnecting(true)
      }
    }

    // Enviar heartbeat inicial
    sendHeartbeat()

    // Enviar heartbeat cada 30 segundos
    const interval = setInterval(sendHeartbeat, 30000)

    return () => clearInterval(interval)
  }, [assemblyId, userId])

  if (isOnline && !isReconnecting) {
    return (
      <div className="flex items-center gap-2 text-sm text-success-600 dark:text-success-400">
        <Wifi className="w-4 h-4" />
        <span>Conectado</span>
        {lastHeartbeat && (
          <span className="text-slate-400 text-xs">
            • {lastHeartbeat.toLocaleTimeString()}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-warning-600 dark:text-warning-400">
      {isReconnecting ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Reconectando...</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Sin conexión</span>
        </>
      )}
    </div>
  )
}
