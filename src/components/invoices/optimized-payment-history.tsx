"use client";

import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { usePaymentHistory } from "@/hooks/usePaymentHistory";
import { Loader2 } from "lucide-react";

interface OptimizedPaymentHistoryProps {
  invoiceId: string;
  invoiceNumber?: string;
}

export function OptimizedPaymentHistory({ invoiceId, invoiceNumber }: OptimizedPaymentHistoryProps) {
  const { payments, loading, error } = usePaymentHistory(invoiceId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NZ", {
      style: "currency",
      currency: "NZD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm py-2">
        Error loading payment history: {error}
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <Separator className="mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
      <div className="space-y-4">
        {payments.map((payment) => (
          <div key={payment.id} className="space-y-3">
            <div className="flex flex-col">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">
                    {payment.method.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(payment.createdAt), "MMMM do, yyyy")}
                  </p>
                </div>
                <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
              </div>
              {payment.transactions && payment.transactions.map((transaction) => (
                <div key={transaction.id} className="mt-2">
                  {transaction.receipt_number && (
                    <p className="text-sm text-red-600 font-medium">
                      Receipt: {transaction.receipt_number}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    {transaction.description.replace(
                      `Payment for Invoice ${invoiceId}`,
                      `Payment for invoice: ${invoiceNumber || invoiceId}`
                    )}
                  </p>
                </div>
              ))}
            </div>
            {payment.notes && (
              <p className="text-sm text-gray-500">{payment.notes}</p>
            )}
            <Separator />
          </div>
        ))}
      </div>
    </div>
  );
} 