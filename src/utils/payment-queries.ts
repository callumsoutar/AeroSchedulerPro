import { SupabaseClient } from '@supabase/supabase-js';

interface Transaction {
  id: string;
  type: string;
  status: string;
  amount: number;
  balanceAfter: number;
  receipt_number: string | null;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  notes: string | null;
  status: string;
  processedAt: Date | null;
  createdAt: Date;
  transactions?: Transaction[];
}

export const getPaymentHistory = async (
  supabase: SupabaseClient,
  invoiceId: string
): Promise<{ data: Payment[] | null; error: any }> => {
  const { data, error } = await supabase
    .from('Payment')
    .select(`
      *,
      transactions:Transaction(*)
    `)
    .eq('invoiceId', invoiceId)
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('Payment query error:', error);
    return { data: null, error };
  }

  return { data, error: null };
}; 