'use client'

import { useEffect, useState, ReactNode } from 'react'
import { CheckCircle, XCircle, AlertCircle, X, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  type?: ToastType
  message: string
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export default function Toast({
  type = 'info',
  message,
  isVisible,
  onClose,
  duration = 5000,
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true)
        setTimeout(onClose, 300)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle className="w-5 h-5 text-success-500" />,
    error: <XCircle className="w-5 h-5 text-danger-500" />,
    warning: <AlertCircle className="w-5 h-5 text-warning-500" />,
    info: <Info className="w-5 h-5 text-primary-500" />,
  }

  const bgColors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-success-200 dark:border-success-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-danger-200 dark:border-danger-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-warning-200 dark:border-warning-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-primary-200 dark:border-primary-800',
  }

  return (
    <div 
      className={`
        fixed bottom-4 right-4 z-50 
        flex items-center gap-3 
        p-4 rounded-lg border shadow-lg
        ${bgColors[type]}
        transform transition-all duration-300
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
    >
      {icons[type]}
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {message}
      </p>
      <button
        onClick={() => {
          setIsExiting(true)
          setTimeout(onClose, 300)
        }}
        className="ml-2 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        <X className="w-4 h-4 text-slate-500" />
      </button>
    </div>
  )
}

// Hook para manejar toasts
export function useToast() {
  const [toast, setToast] = useState<{
    type: ToastType
    message: string
    isVisible: boolean
  }>({
    type: 'info',
    message: '',
    isVisible: false,
  })

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message, isVisible: true })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }

  return { toast, showToast, hideToast }
}
