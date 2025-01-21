import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { memberId } = params;

    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization ID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('organizationId')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData?.organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get member account balance
    const { data: accountData, error: accountError } = await supabase
      .from('MemberAccount')
      .select('balance')
      .eq('userId', memberId)
      .eq('organizationId', userData.organizationId)
      .single();

    if (accountError) {
      console.error('Error fetching account:', accountError);
      return NextResponse.json(
        { error: 'Error fetching account details' },
        { status: 500 }
      );
    }

    // Get pending invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from('Invoice')
      .select('total')
      .eq('userId', memberId)
      .eq('organizationId', userData.organizationId)
      .eq('status', 'PENDING');

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError);
      return NextResponse.json(
        { error: 'Error fetching invoices' },
        { status: 500 }
      );
    }

    // Calculate total of pending invoices
    const totalPending = invoices.reduce((sum, invoice) => sum + invoice.total, 0);

    return NextResponse.json({
      balance: accountData?.balance || 0,
      openInvoices: {
        count: invoices.length,
        total: totalPending
      }
    });

  } catch (error) {
    console.error('Error in account summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 