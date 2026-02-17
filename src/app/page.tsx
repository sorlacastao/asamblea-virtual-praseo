import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo y título */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-primary-600">
            Asambleas Pro
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Gestión digital de asambleas vecinales
          </p>
        </div>

        {/* Descripción */}
        <div className="card p-8">
          <h2 className="text-2xl font-semibold mb-4">
            Plataforma de Votación en Tiempo Real
          </h2>
          <ul className="text-left space-y-3 text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2">
              <span className="text-primary-500">✓</span>
              Control de quórum en tiempo real
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-500">✓</span>
              Votación segura con hash SHA-256
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-500">✓</span>
              Auditoría de votos en Supabase
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-500">✓</span>
              Carga de vecinos desde Excel
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-500">✓</span>
              Generación de tickets en PDF
            </li>
          </ul>
        </div>

        {/* Botones de navegación */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/voting"
            className="btn-primary py-3 px-6 text-lg"
          >
            Ir a Votación
          </Link>
          <Link
            href="/admin"
            className="btn-secondary py-3 px-6 text-lg"
          >
            Panel de Administración
          </Link>
        </div>

        {/* Info de versión */}
        <p className="text-sm text-slate-500">
          Versión 1.0.0 - Next.js 14 App Router
        </p>
      </div>
    </main>
  )
}
