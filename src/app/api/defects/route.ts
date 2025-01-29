import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(req.url);
    const aircraft_id = searchParams.get('aircraft_id');

    // Check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get organization ID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    let query = supabase
      .from('Defects')
      .select(`
        *,
        aircraft:aircraft_id (
          id,
          registration
        ),
        user:user_id (
          id,
          name,
          email
        )
      `)
      .eq('organization_id', userData.organization_id);

    // Filter by aircraft if specified
    if (aircraft_id) {
      query = query.eq('aircraft_id', aircraft_id);
    }

    const { data: defects, error: defectsError } = await query
      .order('reported_at', { ascending: false });

    if (defectsError) {
      return NextResponse.json(
        { error: 'Failed to fetch defects' },
        { status: 500 }
      );
    }

    return NextResponse.json(defects);

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await req.json();

    // Check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get organization ID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const { data: defect, error: defectError } = await supabase
      .from('Defects')
      .insert([
        {
          ...body,
          user_id: session.user.id,
          organization_id: userData.organization_id,
        }
      ])
      .select(`
        *,
        aircraft:aircraft_id (
          id,
          registration
        ),
        user:user_id (
          id,
          name,
          email
        )
      `)
      .single();

    if (defectError) {
      return NextResponse.json(
        { error: 'Failed to create defect' },
        { status: 500 }
      );
    }

    return NextResponse.json(defect);

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 