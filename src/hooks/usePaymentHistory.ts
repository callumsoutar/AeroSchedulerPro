import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getPaymentHistory } from '@/utils/payment-queries';

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

export function usePaymentHistory(invoiceId: string) {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    let isMounted = true;

    async function fetchPaymentHistory() {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await getPaymentHistory(supabase, invoiceId);
        
        if (!isMounted) return;

        if (error) {
          console.error('Error fetching payment history:', error);
          setError(error.message || 'Failed to fetch payment history');
          return;
        }

        setPayments(data);
      } catch (err) {
        if (!isMounted) return;
        console.error('Unexpected error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPaymentHistory();

    return () => {
      isMounted = false;
    };
  }, [invoiceId, supabase]);

  return {
    payments,
    loading,
    error,
  };
} 