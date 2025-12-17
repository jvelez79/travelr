import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Helper para verificar si es admin
function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
  return adminEmails.includes(email.toLowerCase())
}

function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

interface RegenerateTripRequest {
  tripId: string
  regenerateAll?: boolean      // true = regenera resumen + todos los días
  dayNumbers?: number[]        // específico: solo estos días
}

/**
 * POST /api/admin/regenerate-trip
 *
 * Regenera un viaje existente sin pasar por el flujo de preguntas.
 * Usa las preferencias y lugares ya guardados en generation_states.
 * Solo accesible para admins.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar rol admin
    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body: RegenerateTripRequest = await request.json()
    const { tripId, regenerateAll = true, dayNumbers } = body

    if (!tripId) {
      return NextResponse.json({ error: 'tripId is required' }, { status: 400 })
    }

    console.log(`[admin/regenerate-trip] User ${user.email} regenerating trip ${tripId}`)

    // 1. Obtener estado actual con preferencias guardadas
    const { data: state, error: stateError } = await supabase
      .from('generation_states')
      .select('*')
      .eq('trip_id', tripId)
      .single()

    if (stateError || !state) {
      return NextResponse.json({ error: 'No generation state found for this trip' }, { status: 404 })
    }

    if (!state.preferences) {
      return NextResponse.json({ error: 'No saved preferences found. User must answer questions first.' }, { status: 400 })
    }

    // 2. Obtener trip para calcular días
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const totalDays = calculateDays(trip.start_date, trip.end_date)
    const daysToRegenerate = dayNumbers || Array.from({ length: totalDays }, (_, i) => i + 1)

    // 3. Determinar acción
    const action = regenerateAll ? 'start' : 'continue'

    // 4. Reset estado según opción
    if (regenerateAll) {
      // Reset completo del estado
      await supabase.from('generation_states').update({
        status: 'generating_summary',
        current_day: null,
        completed_days: [],
        pending_days: daysToRegenerate,
        failed_days: [],
        error_message: null,
        retry_count: 0,
      }).eq('trip_id', tripId)
    } else {
      // Solo reset de días específicos
      const currentCompleted = (state.completed_days as number[]) || []
      await supabase.from('generation_states').update({
        status: 'generating',
        pending_days: daysToRegenerate,
        completed_days: currentCompleted.filter((d: number) => !daysToRegenerate.includes(d)),
        failed_days: [],
        error_message: null,
      }).eq('trip_id', tripId)
    }

    // 5. Invocar Edge Function (fire and forget)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    fetch(`${supabaseUrl}/functions/v1/generate-itinerary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        tripId,
        userId: user.id,
        action,
        preferences: state.preferences,
        fullPlaces: state.full_places,
        dayNumber: action === 'continue' ? daysToRegenerate[0] : undefined,
      }),
    }).catch((err) => {
      console.error('[admin/regenerate-trip] Edge Function invocation error:', err)
    })

    console.log(`[admin/regenerate-trip] Started regeneration: action=${action}, days=${daysToRegenerate.join(',')}`)

    return NextResponse.json({
      success: true,
      message: `Regenerating ${regenerateAll ? 'all' : daysToRegenerate.length} days`,
      tripId,
      action,
      daysToRegenerate,
      usedPreferences: state.preferences,
    })
  } catch (error) {
    console.error('[admin/regenerate-trip] Error:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate trip' },
      { status: 500 }
    )
  }
}
