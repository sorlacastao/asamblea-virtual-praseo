/**
 * Funciones utilitarias del proyecto
 */

/**
 * Formatear fecha a formato legible
 */
export function formatDate(date: Date | string, locale: string = 'es-MX'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Formatear hora a formato legible
 */
export function formatTime(date: Date | string, locale: string = 'es-MX'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formatear fecha y hora
 */
export function formatDateTime(date: Date | string, locale: string = 'es-MX'): string {
  return `${formatDate(date, locale)} ${formatTime(date, locale)}`
}

/**
 * Calcular porcentaje
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return (value / total) * 100
}

/**
 * Formatear coeficiente
 */
export function formatCoeficiente(coeficiente: number): string {
  return `${coeficiente.toFixed(2)}%`
}

/**
 * Validar email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Generar ID único
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Truncar texto
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

/**
 * Capitalizar primera letra
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Obtener initials de nombre
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Convertir objeto a query string
 */
export function objectToQueryString(obj: Record<string, string | number | boolean>): string {
  return Object.entries(obj)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}

/**
 * Clasificar resultado de votación
 */
export function classifyVoteResult(
  coeficienteAprobacion: number,
  requiredMajority: number = 50
): 'aprobada' | 'rechazada' | 'empatada' {
  if (coeficienteAprobacion > requiredMajority) {
    return 'aprobada'
  }
  if (coeficienteAprobacion < requiredMajority) {
    return 'rechazada'
  }
  return 'empatada'
}
