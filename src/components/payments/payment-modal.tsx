"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CreditCard, Wallet, Building2, PiggyBank, Banknote, Ticket, CheckCircle2 } from "lucide-react";

const paymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  method: z.enum(["CASH", "CREDIT_CARD", "BANK_TRANSFER", "VOUCHER", "ACCOUNT_CREDIT", "OTHER"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentMethod = {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
};

const paymentMethods: PaymentMethod[] = [
  {
    id: "CREDIT_CARD",
    label: "Credit Card",
    icon: <CreditCard className="h-6 w-6" />,
    color: "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100",
  },
  {
    id: "CASH",
    label: "Cash",
    icon: <Banknote className="h-6 w-6" />,
    color: "bg-green-50 text-green-600 border-green-200 hover:bg-green-100",
  },
  {
    id: "BANK_TRANSFER",
    label: "Bank Transfer",
    icon: <Building2 className="h-6 w-6" />,
    color: "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100",
  },
  {
    id: "VOUCHER",
    label: "Voucher",
    icon: <Ticket className="h-6 w-6" />,
    color: "bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100",
  },
  {
    id: "ACCOUNT_CREDIT",
    label: "Account Credit",
    icon: <PiggyBank className="h-6 w-6" />,
    color: "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100",
  },
  {
    id: "OTHER",
    label: "Other",
    icon: <Wallet className="h-6 w-6" />,
    color: "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100",
  },
];

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onSuccess?: () => void;
};

export function PaymentModal({ isOpen, onClose, invoice, onSuccess }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: invoice?.balanceRemaining || 0,
      method: "CASH" as const,
      reference: "",
      notes: "",
    },
  });

  // Reset receipt number when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setReceiptNumber(null);
    }
  }, [isOpen]);

  async function onSubmit(data: z.infer<typeof paymentSchema>) {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/invoices/${invoice.id}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          method: selectedMethod,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process payment");
      }

      const result = await response.json();
      console.log('Payment Response:', result); // Debug log
      
      if (result.transactions?.[0]?.receipt_number) {
        setReceiptNumber(result.transactions[0].receipt_number);
        toast({
          title: "Payment Processed",
          description: `Payment successful. Receipt number: ${result.transactions[0].receipt_number}`,
        });
      } else {
        toast({
          title: "Payment Processed",
          description: "The payment has been successfully processed.",
        });
      }

      // Delay closing the modal to show the success state
      setTimeout(() => {
        onSuccess?.();
        setIsSubmitting(false);
        // Don't close the modal here - let the user close it after seeing the success state
      }, 500);

    } catch (error) {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>

        {isSubmitting ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium text-gray-900">Processing Payment...</p>
            <p className="text-sm text-gray-500">Please wait while we process your payment</p>
          </div>
        ) : receiptNumber ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <div className="animate-in zoom-in duration-300">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Payment Received</h3>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">Receipt Number</p>
              <p className="text-lg font-medium text-red-600">{receiptNumber}</p>
            </div>
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Payment Method</FormLabel>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <Button
                      key={method.id}
                      type="button"
                      variant="outline"
                      className={`h-auto p-4 justify-start gap-3 ${
                        selectedMethod === method.id ? method.color : ""
                      }`}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      {method.icon}
                      <span>{method.label}</span>
                    </Button>
                  ))}
                </div>
                {form.formState.errors.method && (
                  <p className="text-sm text-red-500">Please select a payment method</p>
                )}
              </div>

              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Payment reference..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Process Payment
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
} 