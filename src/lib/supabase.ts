import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'crypto'

// Tipos para los parámetros de las funciones
interface QueryOptions {
  [key: string]: string | number | boolean | null | undefined
}

interface InsertOptions {
  [key: string]: unknown
}

interface UpdateOptions {
  [key: string]: unknown
}

// Validar variables de entorno antes de crear el cliente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error(
    'Falta la variable de entorno NEXT_PUBLIC_SUPABASE_URL. ' +
    'Por favor, configúrala en tu archivo .env.local'
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    'Falta la variable de entorno NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Por favor, configúrala en tu archivo .env.local'
  )
}

// Crear el cliente de Supabase SOLO después de validar las variables
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Funciones de utilidad para Supabase
export async function getTableData(table: string, query?: QueryOptions) {
  const { data, error } = await supabase
    .from(table)
    .select(query ? '*' : '*')
  
  if (error) throw error
  return data
}

export async function insertData(table: string, data: InsertOptions) {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
  
  if (error) throw error
  return result
}

export async function updateData(table: string, id: string, data: UpdateOptions) {
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
  
  if (error) throw error
  return result
}

export async function deleteData(table: string, id: string) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}

/**
 * Genera un hash de verificación para un voto usando SHA-256
 * Incluye timestamp, idInmueble, punto_id, opcion_voto, coeficiente y nonce aleatorio
 * para cumplir con requisitos de seguridad legal
 * @param timestamp - Timestamp del voto en formato ISO
 * @param idInmueble - ID del inmueble que vota
 * @param puntoId - ID del punto de agenda
 * @param opcionVoto - Opción de voto (a_favor, en_contra, abstcion)
 * @param coeficiente - Coeficiente del inmueble
 * @param secretoServidor - Secreto adicional del servidor para mayor seguridad
 * @returns Hash de verificación en formato hexadecimal
 */
export function generarHashVerificacion(
  timestamp: string,
  idInmueble: string,
  puntoId: string,
  opcionVoto: string,
  coeficiente: number,
  secretoServidor?: string
): string {
  // Generar un nonce aleatorio para mayor seguridad legal
  const nonce = randomBytes(16).toString('hex')
  
  // Concatenar los datos del voto con todos los parámetros requeridos
  const datosVoto = `${timestamp}:${idInmueble}:${puntoId}:${opcionVoto}:${coeficiente}:${nonce}`
  
  // Añadir secreto del servidor si se proporciona
  const datosCompletos = secretoServidor 
    ? `${datosVoto}:${secretoServidor}` 
    : datosVoto
  
  // Generar hash SHA-256
  const hash = createHash('sha256')
    .update(datosCompletos)
    .digest('hex')
  
  return hash
}

/**
 * Genera un hash de verificación para un voto usando SHA-256 (versión legacy)
 * @param votoId - ID único del voto
 * @param idAsistente - ID del asistente que vota
 * @param idOpcion - ID de la opción de votación
 * @param secretoServidor - Secreto adicional del servidor para mayor seguridad
 * @returns Hash de verificación en formato hexadecimal
 * @deprecated Usar generarHashVerificacion con los nuevos parámetros
 */
export function generarHashVerificacionLegacy(
  votoId: string,
  idAsistente: string,
  idOpcion: string,
  secretoServidor?: string
): string {
  // Generar un nonce aleatorio para mayor seguridad
  const nonce = randomBytes(16).toString('hex')
  
  // Concatenar los datos del voto
  const datosVoto = `${votoId}:${idAsistente}:${idOpcion}:${nonce}`
  
  // Añadir secreto del servidor si se proporciona
  const datosCompletos = secretoServidor 
    ? `${datosVoto}:${secretoServidor}` 
    : datosVoto
  
  // Generar hash SHA-256
  const hash = createHash('sha256')
    .update(datosCompletos)
    .digest('hex')
  
  return hash
}

/**
 * Verifica si un hash de verificación es válido
 * @param hashPropuesto - Hash que se quiere verificar
 * @param votoId - ID único del voto
 * @param idAsistente - ID del asistente que vota
 * @param idOpcion - ID de la opción de votación
 * @param secretoServidor - Secreto adicional del servidor
 * @returns true si el hash es válido, false en caso contrario
 */
export function verificarHash(
  hashPropuesto: string,
  votoId: string,
  idAsistente: string,
  idOpcion: string,
  secretoServidor?: string
): boolean {
  // Generar el hash esperado con el mismo nonce (si se almacena)
  // Para verificación completa, se necesitaría almacenar el nonce original
  // Esta función es útil para verificar hashes sin nonce aleatorio
  
  const datosVoto = `${votoId}:${idAsistente}:${idOpcion}`
  const datosCompletos = secretoServidor 
    ? `${datosVoto}:${secretoServidor}` 
    : datosVoto
  
  const hashEsperado = createHash('sha256')
    .update(datosCompletos)
    .digest('hex')
  
  return hashPropuesto === hashEsperado
}
