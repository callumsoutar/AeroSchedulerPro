"use client";

import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface PaymentHistoryProps {
  payments: {
    id: string;
    amount: number;
    method: string;
    reference: string | null;
    notes: string | null;
    status: string;
    processedAt: Date | null;
    createdAt: Date;
    transactions?: {
      receipt_number: string | null;
    }[];
  }[];
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NZ", {
      style: "currency",
      currency: "NZD",
    }).format(amount);
  };

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-gray-900 mb-4">Payment History</h3>
      <div className="space-y-4">
        {payments.map((payment) => (
          <div key={payment.id}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900">{payment.method}</p>
                <div className="text-sm text-gray-500">
                  {format(new Date(payment.processedAt || payment.createdAt), "PPP")}
                  {payment.transactions?.[0]?.receipt_number && (
                    <p className="text-red-600 mt-1">
                      Receipt: {payment.transactions[0].receipt_number}
                    </p>
                  )}
                </div>
                {payment.reference && (
                  <p className="text-sm text-gray-500 mt-1">Ref: {payment.reference}</p>
                )}
              </div>
              <span className="font-medium text-gray-900">{formatCurrency(payment.amount)}</span>
            </div>
            <Separator className="mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
} 