import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { id } = params;
    const body = await request.json();

    const { data, error } = await supabase
      .from('lesson_debrief_performances')
      .insert([{ ...body, lesson_debrief_id: id }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating performance:', error);
    return NextResponse.json(
      { error: 'Error creating performance' },
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
    const { performanceId, ...updateData } = body;

    const { data, error } = await supabase
      .from('lesson_debrief_performances')
      .update(updateData)
      .eq('id', performanceId)
      .eq('lesson_debrief_id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating performance:', error);
    return NextResponse.json(
      { error: 'Error updating performance' },
      { status: 500 }
    );
  }
} 