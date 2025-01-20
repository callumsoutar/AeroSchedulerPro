import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error('No authenticated session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization ID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('organizationId, role')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Error fetching user data' },
        { status: 500 }
      );
    }

    // Fetch members from the same organization
    const { data: members, error } = await supabase
      .from('User')
      .select(`
        id,
        name,
        email,
        role,
        memberStatus,
        phone,
        photo_url,
        birthDate,
        joinDate,
        lastFlight,
        memberNumber,
        isStaff,
        gender,
        address
      `)
      .eq('organizationId', userData.organizationId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching members:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error in members route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 