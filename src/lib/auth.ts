import { generateSecureToken } from './hash'

interface AuthConfig {
  secret: string
  expiresIn: number // en horas
}

/**
 * Generar token de acceso para vecino
 */
export function generateAccessToken(neighborId: string, assemblyId: string): string {
  const payload = {
    neighborId,
    assemblyId,
    token: generateSecureToken(),
    createdAt: Date.now(),
  }

  // En producción, usar JWT o加密
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

/**
 * Validar token de acceso
 */
export function validateAccessToken(token: string): {
  valid: boolean
  neighborId?: string
  assemblyId?: string
} {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString())
    
    // Verificar si el token no ha expirado (24 horas)
    const expiresIn = 24 * 60 * 60 * 1000 // 24 horas en ms
    if (Date.now() - payload.createdAt > expiresIn) {
      return { valid: false }
    }

    return {
      valid: true,
      neighborId: payload.neighborId,
      assemblyId: payload.assemblyId,
    }
  } catch {
    return { valid: false }
  }
}

/**
 * Generar URL de acceso para voting
 */
export function generateVotingUrl(assemblyId: string, neighborId: string): string {
  const token = generateAccessToken(neighborId, assemblyId)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  return `${baseUrl}/voting/${assemblyId}?token=${token}`
}

/**
 * Validar acceso de administrador
 */
export function validateAdminAccess(secret: string): boolean {
  return secret === process.env.ADMIN_PATH_SECRET
}
