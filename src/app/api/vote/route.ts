import { NextRequest, NextResponse } from 'next/server'
import { supabase, generarHashVerificacion } from '@/lib/supabase'
import { isCensusLoaded } from '@/lib/redis'
import { VoteTicket } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      assemblyId, 
      agendaPointId, 
      neighborId, 
      neighborName,
      propertyNumber,
      coeficiente,
      voteValue,
      inmueble 
    } = body

    // Validar datos requeridos
    if (!assemblyId || !agendaPointId || !neighborId || !voteValue) {
      return NextResponse.json(
        { success: false, error: 'Datos requeridos incompletos' },
        { status: 400 }
      )
    }

    // Verificar que el censo está cargado antes de permitir votar
    const censusAvailable = await isCensusLoaded(assemblyId)
    if (!censusAvailable) {
      return NextResponse.json(
        { 
          error: 'No hay un censo cargado para esta asamblea. La Administradora debe cargar el Excel del censo primero.' 
        },
        { status: 403 }
      )
    }

    // Validar que el coeficiente sea un número válido
    const coeficienteNum = typeof coeficiente === 'number' ? coeficiente : parseFloat(coeficiente) || 0
    
    // Validar opción de voto
    const opcionesValidas = ['a_favor', 'en_contra', 'abstcion']
    if (!opcionesValidas.includes(voteValue)) {
      return NextResponse.json(
        { success: false, error: 'Opción de voto inválida' },
        { status: 400 }
      )
    }

    // Generar timestamp para el hash
    const timestamp = new Date().toISOString()

    // Generar hash de verificación en el server-side
    // Incluye: timestamp, idInmueble, punto_id, opcion_voto, coeficiente y nonce aleatorio
    const hashVerificacion = generarHashVerificacion(
      timestamp,
      propertyNumber || neighborId,
      agendaPointId,
      voteValue,
      coeficienteNum,
      process.env.VOTE_SECRET_SERVER
    )

    // Guardar directamente en Supabase (tabla votos_asambleas)
    // NO guardar en Redis - Redis solo se usa para heartbeat del quórum
    const { data: voteRecord, error: supabaseError } = await supabase
      .from('votos_asambleas')
      .insert({
        assembly_id: assemblyId,
        punto_id: agendaPointId,
        neighbor_id: neighborId,
        inmueble: propertyNumber || inmueble || '',
        opcion_voto: voteValue,
        coeficiente: coeficienteNum,
        hash_verificacion: hashVerificacion,
        timestamp_voto: timestamp,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (supabaseError) {
      console.error('Error guardando voto en Supabase:', supabaseError)
      return NextResponse.json(
        { success: false, error: 'Error al guardar el voto en la asamblea' },
        { status: 500 }
      )
    }

    // Crear ticket de voto para el cliente
    const ticket: VoteTicket = {
      id: voteRecord?.id || crypto.randomUUID(),
      assembly_id: assemblyId,
      neighbor_id: neighborId,
      neighbor_name: neighborName || '',
      property_number: propertyNumber || '',
      coeficiente: coeficienteNum,
      vote_hash: hashVerificacion,
      timestamp: new Date(timestamp),
      agenda_point_id: agendaPointId,
      agenda_point_title: '', // Se llenaría con el título del punto de agenda
      vote_value: voteValue as 'a_favor' | 'en_contra' | 'abstcion',
    }

    return NextResponse.json({
      success: true,
      data: ticket,
      hash_verificacion: hashVerificacion,
    })
  } catch (error) {
    console.error('Error en vote API:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET method to retrieve votes for a specific assembly and agenda point
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assemblyId = searchParams.get('assembly_id')
    const agendaPointId = searchParams.get('punto_id')

    if (!assemblyId || !agendaPointId) {
      return NextResponse.json(
        { success: false, error: 'assembly_id y punto_id son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el censo está cargado antes de permitir obtener votos
    const censusAvailable = await isCensusLoaded(assemblyId)
    if (!censusAvailable) {
      return NextResponse.json(
        { 
          error: 'No hay un censo cargado para esta asamblea. La Administradora debe cargar el Excel del censo primero.' 
        },
        { status: 403 }
      )
    }

    const { data: votes, error } = await supabase
      .from('votos_asambleas')
      .select('*')
      .eq('assembly_id', assemblyId)
      .eq('punto_id', agendaPointId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error retrieving votes:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener los votos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: votes,
    })
  } catch (error) {
    console.error('Error en vote GET API:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
