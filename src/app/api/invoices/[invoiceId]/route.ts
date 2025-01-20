import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log('No session found');
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

    // Fetch invoice with related data
    console.log('Fetching invoice:', params.invoiceId);
    
    // First, let's check if transactions exist for this payment
    const { data: transactionCheck, error: transactionError } = await supabase
      .from('Transaction')
      .select('*')
      .eq('invoiceId', params.invoiceId);
    
    console.log('Direct Transaction Check:', transactionCheck);
    if (transactionError) {
      console.error('Transaction Check Error:', transactionError);
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('Invoice')
      .select(`
        *,
        user:userId (
          id,
          name,
          email
        ),
        organization:organizationId (
          id,
          name
        ),
        items:InvoiceItem (
          id,
          quantity,
          unitPrice,
          chargeable:chargeableId (
            name,
            description
          )
        ),
        payments:Payment (
          id,
          amount,
          method,
          reference,
          notes,
          status,
          processedAt,
          createdAt,
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
        )
      `)
      .eq('id', params.invoiceId)
      .eq('organizationId', userData.organizationId)
      .single();

    if (invoiceError) {
      console.error('Error fetching invoice:', invoiceError);
      return NextResponse.json(
        { error: "Error fetching invoice" },
        { status: 500 }
      );
    }

    if (!invoice) {
      console.log('Invoice not found or unauthorized');
      return NextResponse.json(
        { error: "Invoice not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the session to ensure user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.log('No session found');
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

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: "Error fetching user data" },
        { status: 500 }
      );
    }

    // Get the request body
    const body = await req.json();
    const {
      invoice_data,
      invoice_items
    } = body;

    // Call the Supabase function to create invoice with items
    const { data, error } = await supabase.rpc('create_invoice_with_items', {
      invoice_data: {
        ...invoice_data,
        userId: invoice_data.memberId, // Map memberId to userId
        organizationId: userData.organizationId,
        status: 'DRAFT',
        issuedDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      invoice_items: invoice_items.map((item: any) => ({
        ...item,
        organizationId: userData.organizationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
    });

    if (error) {
      console.error('Error creating invoice:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in invoice creation:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 