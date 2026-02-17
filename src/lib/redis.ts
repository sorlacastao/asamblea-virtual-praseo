/**
 * Cliente Redis para QUORUM EN TIEMPO REAL (heartbeat/presencia)
 * 
 * IMPORTANTE: Este archivo es para el QUORUM EN TIEMPO REAL (heartbeat), NO para votos.
 * Los votos van directamente a Supabase.
 * 
 * Usa @upstash/redis para conectar con Upstash Redis
 * Variables de entorno requeridas:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

import { Redis } from '@upstash/redis'

// =============================================================================
// CHEQUEO DE SEGURIDAD: Validar variables de entorno requeridas
// =============================================================================

function validateEnvironment(): void {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || url.trim() === '') {
    throw new Error(
      '❌ ERROR DE CONFIGURACIÓN: La variable de entorno UPSTASH_REDIS_REST_URL no está configurada.\n' +
      '   Por favor, configura UPSTASH_REDIS_REST_URL en tu archivo .env.local\n' +
      '   Ejemplo: UPSTASH_REDIS_REST_URL=https://your-database.upstash.io'
    )
  }

  if (!token || token.trim() === '') {
    throw new Error(
      '❌ ERROR DE CONFIGURACIÓN: La variable de entorno UPSTASH_REDIS_REST_TOKEN no está configurada.\n' +
      '   Por favor, configura UPSTASH_REDIS_REST_TOKEN en tu archivo .env.local\n' +
      '   Ejemplo: UPSTASH_REDIS_REST_TOKEN=AUTH_TOKEN_Aqui...'
    )
  }
}

// =============================================================================
// SINGLETON: Cliente Redis (solo se inicializa una vez)
// =============================================================================

let redisClient: Redis | null = null

function getRedisClient(): Redis {
  if (!redisClient) {
    // Validar variables de entorno antes de crear el cliente
    validateEnvironment()
    
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    
    console.log('✅ Cliente Redis inicializado correctamente')
  }
  
  return redisClient
}

// =============================================================================
// CONSTANTES
// =============================================================================

const HEARTBEAT_TTL = 60 // 60 segundos de TTL para el heartbeat
const PRESENCE_KEY_PREFIX = 'presence:' // Clave para presencia de inmueble
const USER_PRESENCE_PREFIX = 'user:' // Clave para presencia de usuario en inmueble
const SESSION_PREFIX = 'session:' // Prefijo para sesiones de usuario
const QUORUM_PREFIX = 'quorum:' // Prefijo para estado del quórum
const DEFAULT_SESSION_TTL = 3600 // 1 hora por defecto para sesiones

// =============================================================================
// FUNCIONES DE HEARTBEAT (QUORUM EN TIEMPO REAL)
// =============================================================================

/**
 * Establecer heartbeat de presencia para un inmueble
 * Usa el patrón: presence:{idInmueble} = 'online'
 * TTL de 60 segundos - se renueva con cada llamada
 * 
 * @param idInmueble - Identificador único del inmueble
 */
export async function setHeartbeat(idInmueble: string): Promise<boolean> {
  try {
    const redis = getRedisClient()
    const key = `presence:${idInmueble}`
    
    await redis.set(key, 'online', { ex: HEARTBEAT_TTL })
    return true
  } catch (error) {
    console.error('Error en setHeartbeat:', error)
    return false
  }
}

/**
 * Obtener estado de presencia de un inmueble
 * 
 * @param idInmueble - Identificador único del inmueble
 * @returns El valor de presencia o null si no existe
 */
export async function getHeartbeat(idInmueble: string): Promise<string | null> {
  try {
    const redis = getRedisClient()
    const key = `presence:${idInmueble}`
    
    const value = await redis.get<string>(key)
    return value
  } catch (error) {
    console.error('Error en getHeartbeat:', error)
    return null
  }
}

/**
 * Obtener usuarios conectados a un inmueble específico
 * Busca todas las claves que coincidan con el patrón: user:{idInmueble}:*
 * 
 * @param idInmueble - Identificador único del inmueble
 * @returns Número de usuarios conectados
 */
export async function getConnectedUsers(idInmueble: string): Promise<number> {
  try {
    const redis = getRedisClient()
    const pattern = `user:${idInmueble}:*`
    
    const keys = await redis.keys(pattern)
    return keys.length
  } catch (error) {
    console.error('Error en getConnectedUsers:', error)
    return 0
  }
}

/**
 * Remover heartbeat de un usuario específico
 * Elimina la clave de presencia del usuario en el inmueble
 * 
 * @param idInmueble - Identificador único del inmueble
 * @param userId - Identificador del usuario
 */
export async function removeHeartbeat(
  idInmueble: string,
  userId: string
): Promise<boolean> {
  try {
    const redis = getRedisClient()
    const key = `user:${idInmueble}:${userId}`
    
    await redis.del(key)
    return true
  } catch (error) {
    console.error('Error en removeHeartbeat:', error)
    return false
  }
}

// =============================================================================
// FUNCIONES AUXILIARES (para mantener compatibilidad)
// =============================================================================

/**
 * Guardar sesión de usuario en Redis
 * Usa el patrón: session:{userId} = sessionData
 * TTL configurable, 1 hora por defecto
 * 
 * @param userId - Identificador único del usuario
 * @param sessionData - Datos de la sesión a guardar
 * @param ttlSeconds - Tiempo de vida en segundos (opcional, por defecto 3600)
 */
export async function setUserSession(
  userId: string,
  sessionData: object,
  ttlSeconds?: number
): Promise<boolean> {
  try {
    const redis = getRedisClient()
    const key = `session:${userId}`
    const ttl = ttlSeconds || DEFAULT_SESSION_TTL
    
    await redis.set(key, JSON.stringify(sessionData), { ex: ttl })
    return true
  } catch (error) {
    console.error('Error en setUserSession:', error)
    return false
  }
}

/**
 * Obtener sesión de usuario de Redis
 * 
 * @param userId - Identificador único del usuario
 * @returns Los datos de la sesión o null si no existe
 */
export async function getUserSession(userId: string): Promise<object | null> {
  try {
    const redis = getRedisClient()
    const key = `session:${userId}`
    
    const value = await redis.get<string>(key)
    if (!value) return null
    
    return JSON.parse(value)
  } catch (error) {
    console.error('Error en getUserSession:', error)
    return null
  }
}

/**
 * Eliminar sesión de usuario de Redis
 * 
 * @param userId - Identificador único del usuario
 * @returns true si se eliminó correctamente
 */
export async function deleteUserSession(userId: string): Promise<boolean> {
  try {
    const redis = getRedisClient()
    const key = `session:${userId}`
    
    await redis.del(key)
    return true
  } catch (error) {
    console.error('Error en deleteUserSession:', error)
    return false
  }
}

/**
 * Obtener estado del quórum de un inmueble
 * 
 * @param idInmueble - Identificador único del inmueble
 * @returns El estado del quórum o null si no existe
 */
export async function getQuorumStatus(idInmueble: string): Promise<object | null> {
  try {
    const redis = getRedisClient()
    const key = `quorum:${idInmueble}`
    
    const value = await redis.get<string>(key)
    if (!value) return null
    
    return JSON.parse(value)
  } catch (error) {
    console.error('Error en getQuorumStatus:', error)
    return null
  }
}

/**
 * Actualizar heartbeat de usuario (mantiene compatibilidad con código existente)
 * 
 * @deprecated Usa setHeartbeat(idInmueble) en su lugar
 */
export async function updateHeartbeat(
  assemblyId: string,
  userId: string
): Promise<boolean> {
  try {
    const redis = getRedisClient()
    const key = `user:${assemblyId}:${userId}`
    
    await redis.set(key, Date.now().toString(), { ex: HEARTBEAT_TTL })
    return true
  } catch (error) {
    console.error('Error updating heartbeat:', error)
    return false
  }
}

/**
 * Obtener usuarios conectados a una asamblea (mantiene compatibilidad)
 * 
 * @deprecated Usa getConnectedUsers(idInmueble) en su lugar
 */
export async function getConnectedUsersLegacy(assemblyId: string): Promise<number> {
  try {
    const redis = getRedisClient()
    const pattern = `user:${assemblyId}:*`
    
    const keys = await redis.keys(pattern)
    return keys.length
  } catch (error) {
    console.error('Error getting connected users:', error)
    return 0
  }
}

// =============================================================================
// SESIÓN DE ASAMBLEA
// =============================================================================

/**
 * Activa la sesión de asamblea en Redis después de cargar el censo
 * @param assemblyId - ID de la asamblea
 * @param censusData - Datos del censo cargado { totalVecinos, coeficienteTotal, fechaCarga }
 * @param ttlSeconds - Tiempo de vida en segundos (default: 4 horas)
 */
export async function activateAssemblySession(
  assemblyId: string,
  censusData: { totalVecinos: number; coeficienteTotal: number; fechaCarga: string },
  ttlSeconds: number = 14400 // 4 horas
): Promise<boolean> {
  try {
    const redis = getRedisClient()
    const key = `assembly:${assemblyId}:session`
    await redis.set(key, JSON.stringify({
      status: 'active',
      censusLoaded: true,
      ...censusData,
      activatedAt: new Date().toISOString()
    }), { ex: ttlSeconds })
    return true
  } catch (error) {
    console.error('Error activating assembly session:', error)
    return false
  }
}

/**
 * Verifica si la sesión de asamblea está activa y tiene censo cargado
 * @param assemblyId - ID de la asamblea
 */
export async function getAssemblySession(assemblyId: string): Promise<{
  status: string;
  censusLoaded: boolean;
  totalVecinos?: number;
  coeficienteTotal?: number;
  activatedAt?: string;
} | null> {
  try {
    const redis = getRedisClient()
    const key = `assembly:${assemblyId}:session`
    const data = await redis.get<string>(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Error getting assembly session:', error)
    return null
  }
}

/**
 * Verifica si el censo está cargado para una asamblea específica
 * @param assemblyId - ID de la asamblea
 */
export async function isCensusLoaded(assemblyId: string): Promise<boolean> {
  const session = await getAssemblySession(assemblyId)
  return session?.censusLoaded === true
}

/**
 * Cierra la sesión de asamblea (llamar solo después de generar PDF exitosamente)
 * @param assemblyId - ID de la asamblea
 */
export async function closeAssemblySession(assemblyId: string): Promise<boolean> {
  try {
    const redis = getRedisClient()
    const key = `assembly:${assemblyId}:session`
    // Marcamos como cerrada pero mantenemos los datos por 1 hora para referencia
    await redis.set(key, JSON.stringify({
      status: 'closed',
      censusLoaded: true,
      closedAt: new Date().toISOString()
    }), { ex: 3600 })
    return true
  } catch (error) {
    console.error('Error closing assembly session:', error)
    return false
  }
}

/**
 * Limpia los datos temporales de la asamblea (heartbeats, etc)
 * @param assemblyId - ID de la asamblea
 */
export async function cleanupAssemblyData(assemblyId: string): Promise<void> {
  try {
    const redis = getRedisClient()
    // Limpiar claves de presencia relacionadas con esta asamblea
    const pattern = `presence:${assemblyId}:*`
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
    
    // Limpiar sesiones de usuarios de esta asamblea
    const userPattern = `user:${assemblyId}:*`
    const userKeys = await redis.keys(userPattern)
    if (userKeys.length > 0) {
      await redis.del(...userKeys)
    }
  } catch (error) {
    console.error('Error cleaning up assembly data:', error)
    // No lanzamos error para no bloquear el cierre
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

// Exportar el cliente Redis para uso directo si es necesario
export { getRedisClient as redis }

// Exportar por defecto
export default {
  setHeartbeat,
  getHeartbeat,
  getConnectedUsers,
  removeHeartbeat,
  updateHeartbeat,
  getConnectedUsersLegacy,
  setUserSession,
  getUserSession,
  deleteUserSession,
  getQuorumStatus,
  activateAssemblySession,
  getAssemblySession,
  isCensusLoaded,
  closeAssemblySession,
  cleanupAssemblyData,
}
