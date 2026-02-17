'use client'

import { AlertTriangle, CheckCircle, Info } from 'lucide-react'
import Card from '@/components/ui/Card'

interface MajorityAlertProps {
  type: 'success' | 'warning' | 'info'
  title: string
  message: string
  details?: {
    label: string
    value: string | number
  }[]
}

export default function MajorityAlert({ type, title, message, details }: MajorityAlertProps) {
  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      iconColor: 'text-green-500',
      titleColor: 'text-green-800 dark:text-green-200',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      iconColor: 'text-yellow-500',
      titleColor: 'text-yellow-800 dark:text-yellow-200',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-800 dark:text-blue-200',
    },
  }

  const { icon: Icon, bgColor, iconColor, titleColor } = config[type]

  return (
    <Card className={`border-2 ${bgColor}`}>
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 ${iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold ${titleColor}`}>
            {title}
          </h4>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {message}
          </p>
          {details && details.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {details.map((detail, index) => (
                <div key={index} className="text-sm">
                  <span className="text-slate-500">{detail.label}: </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
