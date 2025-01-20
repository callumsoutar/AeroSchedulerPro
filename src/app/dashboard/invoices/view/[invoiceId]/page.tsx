"use client";

import { useRedirectIfNotAuthenticated } from "@/hooks/useRedirectIfNotAuthenticated";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { InvoiceDetails } from "@/components/invoices/invoice-details";
import { PaymentModal } from "@/components/payments/payment-modal";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, MoreVertical, Printer, Send, User } from "lucide-react";

async function getInvoiceDetails(invoiceId: string) {
  const response = await fetch(`/api/invoices/${invoiceId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch invoice details');
  }
  return response.json();
}

export default function InvoiceViewPage() {
  const { user, isLoading: authLoading } = useRedirectIfNotAuthenticated(
    ["OWNER", "ADMIN"],
    "/unauthorized"
  );
  
  const params = useParams();
  const invoiceId = params.invoiceId as string;
  const queryClient = useQueryClient();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { data: invoice, isLoading: invoiceLoading, error } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => getInvoiceDetails(invoiceId),
    enabled: !authLoading && !!user,
    staleTime: 1000,
    refetchInterval: false,
  });

  if (authLoading || invoiceLoading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Error loading invoice</h2>
          <p className="text-red-600">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Invoice Details</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="default"
            className="h-11 px-6 gap-2 text-base"
          >
            <Download className="h-5 w-5" />
            Download PDF
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-11 w-11">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="gap-2 h-11">
                <Printer className="h-5 w-5" />
                Print PDF
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 h-11">
                <Send className="h-5 w-5" />
                Send Invoice
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 h-11">
                <User className="h-5 w-5" />
                View Customer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {invoice.status !== "PAID" && (
            <Button 
              className="h-11 px-6 gap-2 text-base"
              onClick={() => setIsPaymentModalOpen(true)}
            >
              Add Payment
            </Button>
          )}
        </div>
      </div>

      <InvoiceDetails invoice={invoice} />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoice={invoice}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
        }}
      />
    </div>
  );
} 