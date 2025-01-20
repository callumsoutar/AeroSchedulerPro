import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const { memberId } = params;

  try {
    console.log('API Route - Starting request for member:', memberId);

    // Check if user is authenticated
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('API Route - Session error:', sessionError);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      );
    }

    if (!session) {
      console.log('API Route - No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('API Route - Session found for user:', session.user.id);

    // Get user's organization ID for authorization
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('organizationId, role')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('API Route - Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Error fetching user data: ' + userError.message },
        { status: 500 }
      );
    }

    if (!userData) {
      console.error('API Route - No user data found');
      return NextResponse.json(
        { error: 'User data not found' },
        { status: 404 }
      );
    }

    console.log('API Route - Found organization:', userData.organizationId);

    // Fetch user with related data
    const { data: user, error: userFetchError } = await supabase
      .from('User')
      .select(`
        *,
        UserMemberships (
          id,
          membershipType,
          status,
          startDate,
          expiryDate,
          paid,
          discount
        ),
        UserPilotDetails!inner (
          id,
          caaClientNumber,
          licenceType,
          typeRatings,
          class1Expiry,
          class2Expiry,
          dl9Expiry,
          bfrExpiry,
          endorsements,
          primeRatings
        )
      `)
      .eq('id', memberId)
      .eq('organizationId', userData.organizationId)
      .single();

    console.log('API Route - Query result:', {
      hasUser: !!user,
      error: userFetchError,
      hasUserMemberships: user?.UserMemberships?.length > 0,
      hasUserPilotDetails: !!user?.UserPilotDetails
    });

    if (userFetchError) {
      console.error('API Route - Error fetching user:', userFetchError);
      return NextResponse.json(
        { error: 'Error fetching user details: ' + userFetchError.message },
        { status: 500 }
      );
    }

    if (!user) {
      console.log('API Route - User not found');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('API Route - Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 