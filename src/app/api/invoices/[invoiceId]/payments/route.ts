import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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
        { error: "Error fetching user data" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { amount, method, reference, notes } = body;

    // Call the Supabase function to process payment
    const { data, error } = await supabase.rpc('process_payment', {
      payment_data: {
        amount,
        method,
        reference,
        notes,
        invoiceId: params.invoiceId,
        userId: session.user.id,
        organizationId: userData.organizationId,
        status: 'COMPLETED',
        processedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    });

    if (error) {
      console.error('Error processing payment:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Fetch the created payment with its transaction
    const { data: paymentData, error: paymentError } = await supabase
      .from('Payment')
      .select(`
        *,
        transactions:Transaction!paymentId (
          id,
          type,
          status,
          amount,
          balanceAfter,
          receipt_number,
          description,
          createdAt,
          updatedAt
        )
      `)
      .eq('id', data.payment_id)
      .single();

    if (paymentError) {
      console.error('Error fetching payment details:', paymentError);
      return NextResponse.json(
        { error: 'Payment processed but failed to fetch details' },
        { status: 200 }
      );
    }

    // Return the payment data with transaction details
    return NextResponse.json(paymentData);

  } catch (error) {
    console.error('Error in payment processing:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 