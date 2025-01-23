import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const { booking_id } = body;

    const { data, error } = await supabase
      .from('lesson_debriefs')
      .insert([{ booking_id }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating debrief:', error);
    return NextResponse.json(
      { error: 'Error creating debrief' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from('lesson_debriefs')
      .select(`
        *,
        booking:Booking (*),
        performances:lesson_debrief_performances (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching debriefs:', error);
    return NextResponse.json(
      { error: 'Error fetching debriefs' },
      { status: 500 }
    );
  }
} 