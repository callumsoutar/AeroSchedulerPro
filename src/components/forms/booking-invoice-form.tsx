"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { PlusIcon, SearchIcon, XIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Chargeable } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { useChargeables } from "@/hooks/useChargeables";

const formSchema = z.object({
  lineItems: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    subtotal: z.number(),
  })),
  subtotal: z.number(),
  tax: z.number(),
  total: z.number(),
});

type LineItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

interface BookingInvoiceFormProps {
  userId: string;
  bookingId: string;
  onInvoiceCreated?: (invoiceId: string) => void;
  flightCharges?: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    timeType: string;
    flightTime: number;
  } | null;
  disabled?: boolean;
}

export default function BookingInvoiceForm({ 
  userId, 
  bookingId, 
  onInvoiceCreated,
  flightCharges,
  disabled = false
}: BookingInvoiceFormProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [itemsOpen, setItemsOpen] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const supabase = createClientComponentClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: chargeables = [], isLoading: isLoadingChargeables } = useChargeables();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lineItems: [],
    },
  });

  const filteredChargeables = (chargeables || []).filter((item) => {
    if (!itemSearchQuery) return true;
    const search = itemSearchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(search) ||
      (item.description?.toLowerCase() || "").includes(search)
    );
  });

  // Calculate totals whenever line items change
  useEffect(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * 0.15; // 15% tax rate
    const total = subtotal + tax;

    form.setValue("lineItems", lineItems);
    form.setValue("subtotal", subtotal);
    form.setValue("tax", tax);
    form.setValue("total", total);
  }, [lineItems, form]);

  // Add flight charges when they are received
  useEffect(() => {
    if (flightCharges) {
      const newItem: LineItem = {
        id: flightCharges.id, // Use the fixed chargeable ID
        name: `${flightCharges.description} - ${flightCharges.timeType} Time: ${flightCharges.flightTime.toFixed(1)} hours`,
        quantity: flightCharges.quantity,
        unitPrice: flightCharges.unitPrice,
        subtotal: flightCharges.quantity * flightCharges.unitPrice
      };

      setLineItems(prevItems => {
        // Remove any previous flight charges
        const filteredItems = prevItems.filter(item => item.id !== 'flight-time-charge');
        return [...filteredItems, newItem];
      });

      toast({
        title: "Flight Charges Added",
        description: "Flight charges have been added to the invoice.",
      });
    }
  }, [flightCharges]);

  const addLineItem = (chargeable: Chargeable) => {
    const newItem: LineItem = {
      id: chargeable.id,
      name: chargeable.name,
      quantity: 1,
      unitPrice: chargeable.unitPrice,
      subtotal: chargeable.unitPrice
    };
    setLineItems([...lineItems, newItem]);
    setItemsOpen(false);
    setItemSearchQuery("");
  };

  const updateLineItemQuantity = (id: string, quantity: number) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          quantity,
          subtotal: quantity * item.unitPrice
        };
      }
      return item;
    }));
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const addFlightCharges = (charges: {
    description: string;
    quantity: number;
    unitPrice: number;
    timeType: string;
    flightTime: number;
  }) => {
    const newItem: LineItem = {
      id: `flight-${Date.now()}`, // Temporary ID for the line item
      name: `${charges.description} - ${charges.timeType} Time: ${charges.flightTime.toFixed(1)} hours`,
      quantity: charges.quantity,
      unitPrice: charges.unitPrice,
      subtotal: charges.quantity * charges.unitPrice
    };

    setLineItems([...lineItems, newItem]);
    toast({
      title: "Flight Charges Added",
      description: "Flight charges have been added to the invoice.",
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);

      const payload = {
        invoice_data: {
          memberId: userId,
          bookingId: bookingId,
          dueDate: new Date(), // Due immediately
          subtotal: values.subtotal,
          tax: values.tax,
          total: values.total,
          reference: `Booking ${bookingId}`,
          status: 'PENDING'
        },
        invoice_items: lineItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal
        }))
      };

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create invoice');
      }

      toast({
        title: "Success",
        description: "Invoice created successfully",
      });

      if (onInvoiceCreated) {
        onInvoiceCreated(data.invoice_id);
      }

    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create invoice",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Flight Charges</h2>
              <p className="text-sm text-gray-500">Add items to invoice</p>
            </div>

            {/* Line Items Table */}
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Item</th>
                    <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">Quantity</th>
                    <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">Unit Price</th>
                    <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">Subtotal</th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lineItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-sm text-gray-500">
                        No items added yet
                      </td>
                    </tr>
                  ) : (
                    lineItems.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 px-4 text-sm">{item.name}</td>
                        <td className="py-3 px-4 text-sm text-right">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItemQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-20 text-right"
                          />
                        </td>
                        <td className="py-3 px-4 text-sm text-right">${item.unitPrice.toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm text-right">${item.subtotal.toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(item.id)}
                            className="h-8 w-8 p-0"
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                  {/* Add Item Row */}
                  <tr className="border-t">
                    <td colSpan={5} className="p-2">
                      <Popover open={itemsOpen} onOpenChange={setItemsOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start"
                            disabled={disabled}
                          >
                            <PlusIcon className="mr-2 h-4 w-4" />
                            Add flight charges...
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[100%] p-0" align="start">
                          <div className="flex flex-col">
                            <div className="flex items-center border-b px-3">
                              <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                              <input
                                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Search items..."
                                value={itemSearchQuery}
                                onChange={(e) => setItemSearchQuery(e.target.value)}
                              />
                            </div>
                            <Tabs defaultValue="all" className="w-full">
                              <TabsList className="w-full justify-start h-12 p-1">
                                <TabsTrigger value="all" className="flex items-center">
                                  <span className="mr-1">🔍</span> All
                                </TabsTrigger>
                                <TabsTrigger value="landing" className="flex items-center">
                                  <span className="mr-1">✈️</span> Landing Fees
                                </TabsTrigger>
                                <TabsTrigger value="airways" className="flex items-center">
                                  <span className="mr-1">🛫</span> Airways Fees
                                </TabsTrigger>
                              </TabsList>
                              <TabsContent value="all" className="max-h-[300px] overflow-y-auto">
                                {isLoadingChargeables ? (
                                  <div className="p-4 text-sm text-center text-muted-foreground">
                                    Loading items...
                                  </div>
                                ) : filteredChargeables.length === 0 ? (
                                  <div className="p-4 text-sm text-center text-muted-foreground">
                                    No items found
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {filteredChargeables.map((item) => (
                                      <div
                                        key={item.id}
                                        onClick={() => addLineItem(item)}
                                        className="flex items-center justify-between px-3 py-2 cursor-pointer rounded-md hover:bg-accent"
                                      >
                                        <div>
                                          <p className="font-medium">{item.name}</p>
                                          {item.description && (
                                            <p className="text-sm text-muted-foreground">
                                              {item.description}
                                            </p>
                                          )}
                                        </div>
                                        <p className="text-sm font-medium">
                                          ${item.unitPrice.toFixed(2)}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </TabsContent>
                              <TabsContent value="landing" className="max-h-[300px] overflow-y-auto">
                                {isLoadingChargeables ? (
                                  <div className="p-4 text-sm text-center text-muted-foreground">
                                    Loading items...
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {filteredChargeables
                                      .filter(item => item.type === 'LANDING_FEE')
                                      .map((item) => (
                                        <div
                                          key={item.id}
                                          onClick={() => addLineItem(item)}
                                          className="flex items-center justify-between px-3 py-2 cursor-pointer rounded-md hover:bg-accent"
                                        >
                                          <div>
                                            <p className="font-medium">{item.name}</p>
                                            {item.description && (
                                              <p className="text-sm text-muted-foreground">
                                                {item.description}
                                              </p>
                                            )}
                                          </div>
                                          <p className="text-sm font-medium">
                                            ${item.unitPrice.toFixed(2)}
                                          </p>
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </TabsContent>
                              <TabsContent value="airways" className="max-h-[300px] overflow-y-auto">
                                {isLoadingChargeables ? (
                                  <div className="p-4 text-sm text-center text-muted-foreground">
                                    Loading items...
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {filteredChargeables
                                      .filter(item => item.type === 'AIRWAYS_FEE')
                                      .map((item) => (
                                        <div
                                          key={item.id}
                                          onClick={() => addLineItem(item)}
                                          className="flex items-center justify-between px-3 py-2 cursor-pointer rounded-md hover:bg-accent"
                                        >
                                          <div>
                                            <p className="font-medium">{item.name}</p>
                                            {item.description && (
                                              <p className="text-sm text-muted-foreground">
                                                {item.description}
                                              </p>
                                            )}
                                          </div>
                                          <p className="text-sm font-medium">
                                            ${item.unitPrice.toFixed(2)}
                                          </p>
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </TabsContent>
                            </Tabs>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-gray-50/50">
                  <tr className="border-t">
                    <td colSpan={3} />
                    <td className="py-3 px-4 text-sm font-medium text-right">Subtotal:</td>
                    <td className="py-3 px-4 text-sm font-medium text-right">
                      ${form.watch("subtotal", 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} />
                    <td className="py-3 px-4 text-sm font-medium text-right">Tax (15%):</td>
                    <td className="py-3 px-4 text-sm font-medium text-right">
                      ${form.watch("tax", 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td colSpan={3} />
                    <td className="py-3 px-4 text-sm font-bold text-right">Total:</td>
                    <td className="py-3 px-4 text-sm font-bold text-right">
                      ${form.watch("total", 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end">
          <Button 
            type="submit"
            disabled={disabled || isSubmitting || lineItems.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Creating Invoice...
              </>
            ) : (
              'Create Invoice'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
} 