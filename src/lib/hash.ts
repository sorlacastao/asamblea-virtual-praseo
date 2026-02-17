import crypto from 'crypto'

interface VoteHashData {
  assemblyId: string
  agendaPointId: string
  neighborId: string
  voteValue: string
  timestamp: number
}

/**
 * Crear hash SHA-256 de un voto
 * Utilizado para auditoría inmutable de votos
 */
export function createVoteHash(data: VoteHashData): string {
  const payload = JSON.stringify({
    assembly_id: data.assemblyId,
    agenda_point_id: data.agendaPointId,
    neighbor_id: data.neighborId,
    vote_value: data.voteValue,
    timestamp: data.timestamp,
  })

  return crypto.createHash('sha256').update(payload).digest('hex')
}

/**
 * Verificar integridad de un voto
 */
export function verifyVoteHash(
  storedHash: string,
  data: VoteHashData
): boolean {
  const computedHash = createVoteHash(data)
  return storedHash === computedHash
}

/**
 * Generar token aleatorio seguro
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Crear hash simple para contraseñas (usar bcrypt en producción)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex')
  
  return `${salt}:${hash}`
}

/**
 * Verificar contraseña contra hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':')
  const verifyHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex')
  
  return hash === verifyHash
}
