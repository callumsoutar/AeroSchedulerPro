import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { bookingFormSchema } from '@/types/booking';

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
      .select('organizationId, role')
      .eq('auth_id', session.user.id)
      .single();

    console.log('User data fetch result:', { userData, userError, userId: session.user.id });

    if (userError) {
      console.error('Failed to fetch user data:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
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

    console.log('Fetching bookings for organization:', userData.organizationId);

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
      .eq('organization_id', userData.organizationId)
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

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await req.json();

    console.log('Received booking request body:', body);

    // Convert date strings back to Date objects before validation
    const dataToValidate = {
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    };

    // Validate request body against schema
    const validatedData = bookingFormSchema.parse(dataToValidate);

    // Check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get organization ID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('organizationId')
      .eq('id', session.user.id)
      .single();

    console.log('User data fetch:', { userData, userError, userId: session.user.id });

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
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

    // Construct start and end datetime
    console.log('Constructing datetime objects from:', {
      startDate: validatedData.startDate,
      startTime: validatedData.startTime,
      endDate: validatedData.endDate,
      endTime: validatedData.endTime
    });

    const [startHour, startMinute] = validatedData.startTime.split(':').map(Number);
    const [endHour, endMinute] = validatedData.endTime.split(':').map(Number);

    const startDateTime = new Date(validatedData.startDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(validatedData.endDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    console.log('Constructed datetime objects:', {
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      startTimestamp: startDateTime.getTime(),
      endTimestamp: endDateTime.getTime()
    });

    // Validate that end time is after start time
    if (endDateTime.getTime() <= startDateTime.getTime()) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Check for overlapping bookings
    console.log('Checking for overlapping bookings:', {
      aircraft_id: validatedData.aircraft,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString()
    });

    const { data: overlappingBookings, error: overlapError } = await supabase
      .from('Booking')
      .select('id, startTime, endTime')
      .eq('aircraft_id', validatedData.aircraft)
      .eq('status', 'confirmed')
      .or(
        `and(startTime.lte.${endDateTime.toISOString()},endTime.gte.${startDateTime.toISOString()})`
      );

    console.log('Overlap check result:', {
      overlappingBookings,
      overlapError,
      query: `startTime <= ${endDateTime.toISOString()} AND endTime >= ${startDateTime.toISOString()}`
    });

    if (overlapError) {
      console.error('Error checking booking overlap:', overlapError);
      return NextResponse.json(
        { error: 'Failed to check booking availability' },
        { status: 500 }
      );
    }

    if (overlappingBookings && overlappingBookings.length > 0) {
      console.log('Found overlapping bookings:', overlappingBookings);
      return NextResponse.json(
        { 
          error: 'This time slot is already booked',
          overlappingBookings 
        },
        { status: 409 }
      );
    }

    // Create the booking
    const bookingData = {
      user_id: validatedData.member,
      aircraft_id: validatedData.aircraft,
      instructor_id: validatedData.instructor || null,
      organization_id: body.organization_id, // Use the organization_id from the request body
      type: 'flight',
      status: 'confirmed',
      description: validatedData.description || null,
      flight_type_id: validatedData.flightType,
      lesson_id: validatedData.lesson || null,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
    };

    console.log('Creating booking with data:', bookingData);

    const { data: booking, error: bookingError } = await supabase
      .from('Booking')
      .insert([bookingData])
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
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json(
        { error: 'Failed to create booking: ' + bookingError.message },
        { status: 500 }
      );
    }

    console.log('Booking created successfully:', booking);

    return NextResponse.json(booking);

  } catch (error) {
    console.error('Error in POST /api/bookings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Convert date strings back to Date objects before validation
    const dataToValidate = {
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    };

    console.log('Validating data:', dataToValidate);

    // Validate request body against schema
    const validatedData = bookingFormSchema.parse(dataToValidate);

    // Check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Construct start and end datetime
    console.log('Constructing datetime objects from:', {
      startDate: validatedData.startDate,
      startTime: validatedData.startTime,
      endDate: validatedData.endDate,
      endTime: validatedData.endTime
    });

    const [startHour, startMinute] = validatedData.startTime.split(':').map(Number);
    const [endHour, endMinute] = validatedData.endTime.split(':').map(Number);

    const startDateTime = new Date(validatedData.startDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(validatedData.endDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    console.log('Constructed datetime objects:', {
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      startTimestamp: startDateTime.getTime(),
      endTimestamp: endDateTime.getTime()
    });

    // Validate that end time is after start time
    if (endDateTime.getTime() <= startDateTime.getTime()) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Check for overlapping bookings (excluding current booking)
    const { data: overlappingBookings, error: overlapError } = await supabase
      .from('Booking')
      .select('id, startTime, endTime')
      .eq('aircraft_id', validatedData.aircraft)
      .eq('status', 'confirmed')
      .neq('id', id)
      .filter('startTime', 'lte', endDateTime.toISOString())
      .filter('endTime', 'gte', startDateTime.toISOString());

    console.log('Overlap check:', {
      query: {
        aircraft_id: validatedData.aircraft,
        excludeId: id,
        startTimeLTE: endDateTime.toISOString(),
        endTimeGTE: startDateTime.toISOString()
      },
      result: { overlappingBookings, overlapError }
    });

    if (overlapError) {
      console.error('Error checking booking overlap:', overlapError);
      return NextResponse.json(
        { error: 'Failed to check booking availability' },
        { status: 500 }
      );
    }

    if (overlappingBookings && overlappingBookings.length > 0) {
      console.log('Found overlapping bookings:', overlappingBookings);
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 409 }
      );
    }

    // Update the booking
    console.log('Attempting to update booking:', {
      id,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString()
    });

    // First, check if the booking exists and belongs to the user's organization
    const { data: existingBooking, error: existingBookingError } = await supabase
      .from('Booking')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (existingBookingError) {
      console.error('Error fetching existing booking:', existingBookingError);
      return NextResponse.json(
        { error: `Failed to fetch existing booking: ${existingBookingError.message}` },
        { status: 500 }
      );
    }

    if (!existingBooking) {
      console.error('Booking not found:', id);
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Get user's organization ID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('organizationId')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
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

    if (existingBooking.organization_id !== userData.organizationId) {
      console.error('Booking belongs to different organization:', {
        bookingOrgId: existingBooking.organization_id,
        userOrgId: userData.organizationId
      });
      return NextResponse.json(
        { error: 'Unauthorized to modify this booking' },
        { status: 403 }
      );
    }

    // Proceed with the update
    const updateData = {
      user_id: validatedData.member,
      aircraft_id: validatedData.aircraft,
      instructor_id: validatedData.instructor || null,
      description: validatedData.description || null,
      flight_type_id: validatedData.flightType,
      lesson_id: validatedData.lesson || null,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      organization_id: userData.organizationId // Ensure organization_id is included
    };

    console.log('Updating booking with data:', updateData);

    const { data: booking, error: bookingError } = await supabase
      .from('Booking')
      .update(updateData)
      .eq('id', id)
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
      .single();

    if (bookingError) {
      console.error('Error updating booking:', bookingError);
      return NextResponse.json(
        { error: `Failed to update booking: ${bookingError.message}` },
        { status: 500 }
      );
    }

    console.log('Booking updated successfully:', booking);
    return NextResponse.json(booking);

  } catch (error) {
    console.error('Error in PUT /api/bookings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 