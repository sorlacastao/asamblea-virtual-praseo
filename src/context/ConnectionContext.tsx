'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'

interface ConnectionContextType {
  isOnline: boolean
  setIsOnline: (online: boolean) => void
  connectionState: 'connected' | 'disconnected' | 'reconnecting'
  setConnectionState: (state: 'connected' | 'disconnected' | 'reconnecting') => void
  lastHeartbeat: Date | null
  setLastHeartbeat: (date: Date | null) => void
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(
  undefined
)

interface ConnectionProviderProps {
  children: ReactNode
  showOverlay?: boolean
}

export function ConnectionProvider({
  children,
  showOverlay = true,
}: ConnectionProviderProps) {
  const [isOnline, setIsOnlineState] = useState(true)
  const [connectionState, setConnectionStateState] = useState<
    'connected' | 'disconnected' | 'reconnecting'
  >('connected')
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null)
  const [showReconnecting, setShowReconnecting] = useState(false)

  // Función para actualizar el estado de conexión
  const setIsOnline = useCallback((online: boolean) => {
    setIsOnlineState(online)
    if (online) {
      setConnectionStateState('connected')
      setShowReconnecting(false)
    } else {
      setConnectionStateState('disconnected')
    }
  }, [])

  // Función para actualizar el estado de conexión desde HeartbeatManager
  const handleConnectionStateChange = useCallback(
    (
      state: 'connected' | 'disconnected' | 'reconnecting',
      heartbeat?: Date
    ) => {
      setConnectionStateState(state)
      if (heartbeat) {
        setLastHeartbeat(heartbeat)
      }

      if (state === 'connected') {
        setIsOnlineState(true)
        setShowReconnecting(false)
      } else if (state === 'reconnecting') {
        setShowReconnecting(true)
      } else if (state === 'disconnected') {
        setIsOnlineState(false)
        setShowReconnecting(true)
      }
    },
    []
  )

  // Escuchar eventos online/offline del navegador
  useEffect(() => {
    // Estado inicial
    const checkOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnlineState(online)
      if (!online) {
        setConnectionStateState('disconnected')
        setShowReconnecting(true)
      }
    }

    checkOnlineStatus()

    const handleOnline = () => {
      setIsOnline(true)
      setConnectionStateState('connected')
      setShowReconnecting(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setConnectionStateState('disconnected')
      setShowReconnecting(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setIsOnline])

  // Auto-ocultar el overlay de reconexión después de 10 segundos si se reconectó
  useEffect(() => {
    if (showReconnecting && isOnline) {
      const timer = setTimeout(() => {
        setShowReconnecting(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showReconnecting, isOnline])

  const value: ConnectionContextType = {
    isOnline,
    setIsOnline,
    connectionState,
    setConnectionState: handleConnectionStateChange,
    lastHeartbeat,
    setLastHeartbeat,
  }

  return (
    <ConnectionContext.Provider value={value}>
      {children}
      {showOverlay && showReconnecting && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex flex-col items-center gap-4 p-8 bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-sm mx-4">
            {connectionState === 'reconnecting' ? (
              <>
                <RefreshCw className="w-12 h-12 text-amber-500 animate-spin" />
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                  Reconectando...
                </h2>
              </>
            ) : (
              <>
                <WifiOff className="w-12 h-12 text-red-500" />
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                  Sin conexión
                </h2>
              </>
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
              {connectionState === 'reconnecting'
                ? 'Intentando establecer conexión con el servidor...'
                : 'Por favor verifica tu conexión a internet e intenta de nuevo.'}
            </p>
            {lastHeartbeat && (
              <p className="text-xs text-slate-400">
                Última conexión: {lastHeartbeat.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      )}
    </ConnectionContext.Provider>
  )
}

export function useConnection(): ConnectionContextType {
  const context = useContext(ConnectionContext)
  if (context === undefined) {
    throw new Error(
      'useConnection must be used within a ConnectionProvider'
    )
  }
  return context
}

// Hook para usar solo el estado de conexión (más simple)
export function useConnectionState() {
  const { isOnline, setIsOnline, connectionState } = useConnection()
  return { isOnline, setIsOnline, connectionState }
}

export default ConnectionContext
