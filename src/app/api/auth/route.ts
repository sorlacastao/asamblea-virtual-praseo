import { NextRequest, NextResponse } from 'next/server'
import { setUserSession, deleteUserSession, getUserSession } from '@/lib/redis'
import { UserSession } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, assemblyId, neighborId, ...sessionData } = body

    if (action === 'login') {
      const session: UserSession = {
        id: crypto.randomUUID(),
        neighbor_id: neighborId,
        assembly_id: assemblyId,
        connected_at: new Date(),
        last_heartbeat: new Date(),
        is_active: true,
      }

      await setUserSession(assemblyId, session)

      return NextResponse.json({
        success: true,
        data: session,
      })
    }

    if (action === 'logout') {
      await deleteUserSession(assemblyId, neighborId)

      return NextResponse.json({
        success: true,
        message: 'Sesión cerrada correctamente',
      })
    }

    return NextResponse.json(
      { success: false, error: 'Acción no válida' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error en auth API:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assemblyId = searchParams.get('assemblyId')
    const neighborId = searchParams.get('neighborId')

    if (!assemblyId || !neighborId) {
      return NextResponse.json(
        { success: false, error: 'Parámetros requeridos' },
        { status: 400 }
      )
    }

    const session = await getUserSession(assemblyId, neighborId)

    return NextResponse.json({
      success: true,
      data: session,
    })
  } catch (error) {
    console.error('Error en auth API:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
