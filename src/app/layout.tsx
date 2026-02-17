import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Asambleas Pro - Gestión de Asambleas Vecinales',
  description: 'Plataforma digital para la gestión de asambleas vecinales con votación en tiempo real',
  keywords: ['asambleas', 'votación', 'vecinos', 'quórum', 'tiempo real'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  )
}
