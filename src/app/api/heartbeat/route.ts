import { NextRequest, NextResponse } from 'next/server'
import { setHeartbeat, getHeartbeat, isCensusLoaded } from '@/lib/redis'

/**
 * API Route para heartbeat del quórum en tiempo real
 * 
 * Establece la presencia de un inmueble en Redis con TTL de 60 segundos.
 * El cliente debe enviar heartbeats periódicamente (cada ~30 segundos) 
 * para mantener la presencia activa.
 * 
 * Método: POST
 * Body: { idInmueble: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { idInmueble } = body

    // Validar que se proporcionó el idInmueble
    if (!idInmueble || typeof idInmueble !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Parámetro requerido: idInmueble (string)' 
        },
        { status: 400 }
      )
    }

    // Verificar que el censo está cargado antes de permitir heartbeats
    const censusAvailable = await isCensusLoaded(idInmueble)
    if (!censusAvailable) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No hay un censo cargado para esta asamblea. La Administradora debe cargar el Excel del censo primero.' 
        },
        { status: 403 }
      )
    }

    // Establecer el heartbeat con TTL de 60 segundos
    const success = await setHeartbeat(idInmueble)

    if (!success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al establecer heartbeat en Redis' 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Heartbeat establecido correctamente',
      ttl: 60,
    })
  } catch (error) {
    console.error('Error en heartbeat API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}

// Método no permitido
export async function GET() {
  return NextResponse.json(
    { 
      success: false, 
      error: 'Método no permitido. Usa POST con { idInmueble }' 
    },
    { status: 405 }
  )
}
