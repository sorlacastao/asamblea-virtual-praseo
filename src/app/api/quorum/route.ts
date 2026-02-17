import { NextRequest, NextResponse } from 'next/server'
import { getQuorumStatus, getConnectedUsers, updateHeartbeat } from '@/lib/redis'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assemblyId = searchParams.get('assemblyId')
    const requiredQuorum = parseFloat(searchParams.get('requiredQuorum') || '50')
    const totalUsers = parseInt(searchParams.get('totalUsers') || '0')
    const coeficienteTotal = searchParams.get('coeficienteTotal') 
      ? parseFloat(searchParams.get('coeficienteTotal')!) 
      : undefined
    const agendaPointId = searchParams.get('agendaPointId') || undefined
    const coeficientesParam = searchParams.get('coeficientes')
    const coeficientes = coeficientesParam 
      ? JSON.parse(coeficientesParam) 
      : undefined

    if (!assemblyId) {
      return NextResponse.json(
        { success: false, error: 'ID de asamblea requerido' },
        { status: 400 }
      )
    }

    const status = await getQuorumStatus(
      assemblyId, 
      requiredQuorum, 
      totalUsers,
      coeficienteTotal,
      agendaPointId,
      coeficientes
    )

    return NextResponse.json({
      success: true,
      data: status,
    })
  } catch (error) {
    console.error('Error en quorum API:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, assemblyId, userId } = body

    if (action === 'heartbeat') {
      if (!assemblyId || !userId) {
        return NextResponse.json(
          { success: false, error: 'Parámetros requeridos' },
          { status: 400 }
        )
      }

      const success = await updateHeartbeat(assemblyId, userId)

      return NextResponse.json({
        success,
        message: success ? 'Heartbeat actualizado' : 'Error al actualizar heartbeat',
      })
    }

    return NextResponse.json(
      { success: false, error: 'Acción no válida' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error en quorum API:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
