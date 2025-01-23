import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    console.log('Starting GET /api/bookings request');
    const supabase = createRouteHandlerClient({ cookies });

    // Check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    console.log('Session check:', { session: !!session, error: authError });
    
    if (authError || !session) {
      console.log('Authentication failed:', { authError });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get organization ID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('organization_id, role')
      .eq('id', session.user.id)
      .single();

    console.log('User data fetch:', { userData, userError });

    if (userError || !userData?.organization_id) {
      console.log('Organization fetch failed:', { userError });
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    console.log('Fetching bookings for organization:', userData.organization_id);

    // Fetch bookings with related data
    const { data: bookings, error: bookingsError } = await supabase
      .from('Booking')
      .select(`
        *,
        description,
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
        ),
        booking_details:booking_details_id (
          route,
          comments,
          instructor_comment,
          passengers
        ),
        flight_times:booking_flight_times_id (
          start_hobbs,
          end_hobbs,
          start_tacho,
          end_tacho,
          flight_time
        ),
        lesson:lesson_id (*)
      `)
      .eq('organization_id', userData.organization_id)
      .order('startTime', { ascending: false });

    console.log('Bookings fetch result:', {
      hasBookings: !!bookings?.length,
      bookingsCount: bookings?.length,
      error: bookingsError,
      sampleBooking: bookings?.[0] ? {
        id: bookings[0].id,
        description: bookings[0].description,
        type: bookings[0].type,
        status: bookings[0].status,
        lesson_id: bookings[0].lesson_id,
        lesson: bookings[0].lesson,
        hasLesson: !!bookings[0].lesson,
        hasAircraft: !!bookings[0].aircraft,
        hasInstructor: !!bookings[0].instructor,
        hasUser: !!bookings[0].user
      } : null
    });

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    return NextResponse.json(bookings);

  } catch (error) {
    console.error('Unexpected error in bookings endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 