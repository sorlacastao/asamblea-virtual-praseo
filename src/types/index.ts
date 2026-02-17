// Tipos para el sistema de Asambleas Pro

export interface Vecino {
  id: string
  nombre: string
  email: string
  telefono: string
  inmueble: Inmueble
  coeficiente: number
  ref_pago: string
  poderes: Poder[]
}

export interface Inmueble {
  tipo: 'departamento' | 'casa' | 'local' | 'estacionamiento' | 'bodega'
  numero: string
  bloque?: string
  piso?: string
}

export interface Poder {
  id: string
  otorgante_id: string
  beneficiario_id: string
  fecha_emision: Date
  vigencia: 'activa' | 'revocada' | 'vencida'
}

export interface PuntoAgenda {
  id: string
  titulo: string
  descripcion: string
  tipo: 'informativo' | 'votacion' | 'discusion'
  orden: number
  requiere_votacion: boolean
  resultado_votacion?: ResultadoVotacion
}

export interface ResultadoVotacion {
  a_favor: number
  en_contra: number
  abstenciones: number
  coeficiente_a_favor: number
  coeficiente_en_contra: number
  coeficiente_abstenciones: number
  aprobada: boolean
  timestamp: Date
}

export interface Voto {
  id: string
  id_vecino: string
  id_punto_agenda: string
  valor: 'a_favor' | 'en_contra' | 'abstcion'
  hash_sha256: string
  timestamp: Date
  ip_address?: string
  user_agent?: string
}

export interface EstadoAsistencia {
  id: string
  nombre: string
  fecha: Date
  hora_inicio: string
  hora_fin?: string
  tipo: 'ordinaria' | 'extraordinaria'
  estado: 'convocada' | 'en_curso' | 'cerrada' | 'suspendida'
  quorum_minimo: number
  coeficiente_total: number
  vecinos_count: number
  puntos_agenda: PuntoAgenda[]
  created_at: Date
}

export interface VoteTicket {
  id: string
  assembly_id: string
  neighbor_id: string
  neighbor_name: string
  property_number: string
  coeficiente: number
  vote_hash: string
  timestamp: Date
  agenda_point_id: string
  agenda_point_title: string
  vote_value: 'a_favor' | 'en_contra' | 'abstcion'
}

export interface QuorumStatus {
  connected_users: number
  total_users: number
  quorum_percentage: number
  required_quorum: number
  is_quorum_reached: boolean
  last_update: Date
  coeficiente_votado?: number
  coeficiente_total?: number
}

export interface UserSession {
  id: string
  neighbor_id: string
  assembly_id: string
  connected_at: Date
  last_heartbeat: Date
  is_active: boolean
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Excel data types
export interface ExcelRow {
  [key: string]: string | number | undefined
}

export interface ExcelUploadResult {
  success: boolean
  total_records: number
  valid_records: number
  invalid_records: number
  errors: string[]
  vecinos: Vecino[]
}

export interface CensusData {
  totalVecinos: number
  coeficienteTotal: number
  validRecords: number
  invalidRecords: number
  fechaCarga: string
}
