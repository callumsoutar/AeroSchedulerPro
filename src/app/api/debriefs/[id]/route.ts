import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { id } = params;

    const { data, error } = await supabase
      .from('lesson_debriefs')
      .select(`
        *,
        booking:Booking (
          *,
          lesson:Lesson (*)
        ),
        performances:lesson_debrief_performances (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching debrief:', error);
    return NextResponse.json(
      { error: 'Error fetching debrief' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { id } = params;
    const body = await request.json();

    const { data, error } = await supabase
      .from('lesson_debriefs')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating debrief:', error);
    return NextResponse.json(
      { error: 'Error updating debrief' },
      { status: 500 }
    );
  }
} 