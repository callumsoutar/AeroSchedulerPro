import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('GET /api/bookings/[id] - Starting request for booking:', params.id);
    const supabase = createRouteHandlerClient({ cookies });

    // Check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    console.log('Auth check result:', { hasSession: !!session, authError });
    
    if (authError || !session) {
      console.error('Authentication failed:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get organization ID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('organizationId, id')
      .eq('id', session.user.id)
      .single();

    console.log('User data fetch result:', { userData, userError, userId: session.user.id });

    if (userError) {
      console.error('Failed to fetch user data:', userError);
      return NextResponse.json(
        { error: `Failed to fetch user data: ${userError.message}` },
        { status: 500 }
      );
    }

    if (!userData?.organizationId) {
      console.error('No organization found for user:', session.user.id);
      return NextResponse.json(
        { error: 'Organization not found for user' },
        { status: 404 }
      );
    }

    console.log('Fetching booking with params:', {
      bookingId: params.id,
      organizationId: userData.organizationId
    });

    // Fetch the specific booking
    const { data: booking, error: bookingError } = await supabase
      .from('Booking')
      .select(`
        *,
        aircraft:aircraft_id (
          id,
          registration,
          aircraft_type:type_id (
            id,
            type,
            model
          )
        ),
        instructor:instructor_id (
          id,
          name,
          email
        ),
        user:user_id (
          id,
          name,
          email
        )
      `)
      .eq('id', params.id)
      .eq('organization_id', userData.organizationId)
      .single();

    console.log('Booking fetch result:', {
      hasBooking: !!booking,
      bookingError,
      bookingId: booking?.id
    });

    if (bookingError) {
      console.error('Failed to fetch booking:', bookingError);
      return NextResponse.json(
        { error: `Failed to fetch booking: ${bookingError.message}` },
        { status: 500 }
      );
    }

    if (!booking) {
      console.error('Booking not found:', params.id);
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(booking);

  } catch (error) {
    console.error('Error in GET /api/bookings/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 