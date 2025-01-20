import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

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
      .select('organizationId')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData?.organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    console.log('Looking for MemberAccount with:', {
      userId: session.user.id,
      organizationId: userData.organizationId
    });

    // Check if MemberAccount exists
    const { data: memberAccount, error: memberAccountError } = await supabase
      .from('MemberAccount')
      .select('*')
      .eq('userId', session.user.id)
      .eq('organizationId', userData.organizationId)
      .single();

    console.log('MemberAccount query result:', {
      memberAccount,
      error: memberAccountError
    });

    if (memberAccountError) {
      console.error('Error querying member account:', memberAccountError);
    }

    if (!memberAccount) {
      // Create MemberAccount if it doesn't exist
      const { error: createError } = await supabase
        .from('MemberAccount')
        .insert({
          id: crypto.randomUUID(),
          userId: session.user.id,
          organizationId: userData.organizationId,
          balance: 0,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

      if (createError) {
        console.error('Error creating member account:', createError);
        return NextResponse.json(
          { error: 'Failed to create member account' },
          { status: 500 }
        );
      }
    }

    // Get request body
    const body = await req.json();
    const { invoice_data, invoice_items } = body;

    // Prepare the invoice data with required fields
    const invoiceData = {
      ...invoice_data,
      "userId": session.user.id,
      "organizationId": userData.organizationId,
      "issuedDate": new Date().toISOString(),
      "createdAt": new Date().toISOString(),
      "updatedAt": new Date().toISOString()
    };

    // Prepare invoice items with required fields
    const invoiceItems = invoice_items.map((item: any) => ({
      ...item,
      "organizationId": userData.organizationId,
      "createdAt": new Date().toISOString(),
      "updatedAt": new Date().toISOString()
    }));

    console.log('Invoice Data:', invoiceData);
    console.log('Invoice Items:', invoiceItems);

    // Let's also log the exact parameters being sent to the stored procedure
    console.log('Sending to create_invoice_with_items:', {
      invoice_data: invoiceData,
      invoice_items: invoiceItems
    });

    // Verify the stored procedure exists and its parameter types
    const { data: functions, error: functionError } = await supabase.rpc('create_invoice_with_items', {
      invoice_data: invoiceData,
      invoice_items: invoiceItems
    });

    if (functionError) {
      console.error('Error creating invoice:', functionError);
      // Log additional details about the error
      console.error('Function error details:', {
        code: functionError.code,
        message: functionError.message,
        hint: functionError.hint,
        details: functionError.details
      });
      return NextResponse.json(
        { error: functionError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Invoice created successfully',
      invoice_id: functions.invoice_id
    });

  } catch (error) {
    console.error('Error in invoice creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 