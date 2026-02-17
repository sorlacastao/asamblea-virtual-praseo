import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Verificar acceso de administrador
    const adminSecret = request.headers.get('x-admin-secret')
    if (adminSecret !== process.env.ADMIN_PATH_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'assemblies': {
        const { data, error } = await supabase
          .from('assemblies')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({
          success: true,
          data,
        })
      }

      case 'neighbors': {
        const { data, error } = await supabase
          .from('neighbors')
          .select('*')
          .order('name', { ascending: true })

        if (error) throw error

        return NextResponse.json({
          success: true,
          data,
        })
      }

      case 'votes': {
        const assemblyId = searchParams.get('assemblyId')
        const agendaPointId = searchParams.get('agendaPointId')

        let query = supabase
          .from('votes')
          .select('*')
          .order('created_at', { ascending: false })

        if (assemblyId) {
          query = query.eq('assembly_id', assemblyId)
        }
        if (agendaPointId) {
          query = query.eq('agenda_point_id', agendaPointId)
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json({
          success: true,
          data,
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Acción no válida' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error en admin API:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar acceso de administrador
    const adminSecret = request.headers.get('x-admin-secret')
    if (adminSecret !== process.env.ADMIN_PATH_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'createAssembly': {
        const { data: assembly, error } = await supabase
          .from('assemblies')
          .insert(data)
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          data: assembly,
        })
      }

      case 'updateAssembly': {
        const { id, ...updateData } = data

        const { data: assembly, error } = await supabase
          .from('assemblies')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          data: assembly,
        })
      }

      case 'importNeighbors': {
        const { data: neighbors, error } = await supabase
          .from('neighbors')
          .insert(data)
          .select()

        if (error) throw error

        return NextResponse.json({
          success: true,
          data: neighbors,
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Acción no válida' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error en admin API:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
