import * as XLSX from 'xlsx'
import { Vecino, ExcelRow, ExcelUploadResult, Inmueble } from '@/types'

/**
 * Procesar archivo Excel y convertir a array de Vecinos
 */
export function processExcelFile(file: ArrayBuffer): ExcelUploadResult {
  try {
    const workbook = XLSX.read(file, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json<ExcelRow>(worksheet)

    const vecinos: Vecino[] = []
    const errors: string[] = []

    data.forEach((row, index) => {
      try {
        // Validar campos requeridos
        const nombre = row['nombre'] as string
        const email = row['email'] as string
        const numero = row['numero'] as string
        const tipo = row['tipo'] as string
        const coeficiente = parseFloat(row['coeficiente'] as string)

        if (!nombre || !email || !numero || !tipo) {
          errors.push(`Fila ${index + 2}: Faltan datos requeridos`)
          return
        }

        if (isNaN(coeficiente) || coeficiente <= 0) {
          errors.push(`Fila ${index + 2}: Coeficiente inválido`)
          return
        }

        // Mapear tipo de inmueble
        const tipoInmueble: Inmueble['tipo'] = mapInmuebleType(tipo)

        const vecino: Vecino = {
          id: crypto.randomUUID(),
          nombre,
          email,
          telefono: (row['telefono'] as string) || '',
          inmueble: {
            tipo: tipoInmueble,
            numero,
            bloque: row['bloque'] as string,
            piso: row['piso'] as string,
          },
          coeficiente,
          ref_pago: (row['ref_pago'] as string) || '',
          poderes: [],
        }

        vecinos.push(vecino)
      } catch (err) {
        errors.push(`Fila ${index + 2}: Error al procesar`)
      }
    })

    return {
      success: errors.length === 0,
      total_records: data.length,
      valid_records: vecinos.length,
      invalid_records: data.length - vecinos.length,
      errors,
      vecinos,
    }
  } catch (error) {
    return {
      success: false,
      total_records: 0,
      valid_records: 0,
      invalid_records: 0,
      errors: ['Error al procesar el archivo Excel'],
      vecinos: [],
    }
  }
}

/**
 * Mapear tipo de inmueble desde Excel
 */
function mapInmuebleType(tipo: string): Inmueble['tipo'] {
  const tipoLower = tipo.toLowerCase()
  
  if (tipoLower.includes('dept') || tipoLower.includes('departamento')) {
    return 'departamento'
  }
  if (tipoLower.includes('casa')) {
    return 'casa'
  }
  if (tipoLower.includes('local')) {
    return 'local'
  }
  if (tipoLower.includes('estacionamiento') || tipoLower.includes('parking')) {
    return 'estacionamiento'
  }
  if (tipoLower.includes('bodega') || tipoLower.includes('storage')) {
    return 'bodega'
  }
  
  return 'departamento'
}

/**
 * Generar plantilla Excel de ejemplo
 */
export function generateTemplate(): ArrayBuffer {
  const template = [
    {
      nombre: 'Juan Pérez',
      email: 'juan@email.com',
      telefono: '5551234567',
      tipo: 'departamento',
      numero: '101',
      bloque: 'A',
      piso: '1',
      coeficiente: 5.5,
      ref_pago: 'REF001',
    },
    {
      nombre: 'María García',
      email: 'maria@email.com',
      telefono: '5559876543',
      tipo: 'departamento',
      numero: '102',
      bloque: 'A',
      piso: '1',
      coeficiente: 5.5,
      ref_pago: 'REF002',
    },
  ]

  const worksheet = XLSX.utils.json_to_sheet(template)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Vecinos')

  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
}
