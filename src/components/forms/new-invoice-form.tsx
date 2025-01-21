"use client";

import { useState, useEffect, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, ChevronDownIcon, ChevronUpIcon, PlusIcon, SearchIcon, CheckIcon, XIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Chargeable } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { useChargeables } from "@/hooks/useChargeables";
import { useMembers, Member } from "@/hooks/useMembers";

const formSchema = z.object({
  memberId: z.string().min(1, "Please select a member"),
  reference: z.string().optional(),
  invoiceDate: z.date(),
  dueDate: z.date(),
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
  additionalInfo: z.string().optional(),
});

type LineItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export default function NewInvoiceForm() {
  const [isAdditionalInfoOpen, setIsAdditionalInfoOpen] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [open, setOpen] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const supabase = createClientComponentClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { data: members = [], isLoading } = useMembers();
  const { data: chargeables = [], isLoading: isLoadingChargeables } = useChargeables();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoiceDate: new Date(),
      dueDate: new Date(),
      lineItems: [],
      additionalInfo: "",
    },
  });

  const filteredMembers = (members || []).filter((member) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      (member.name?.toLowerCase() || "").includes(search) ||
      member.email.toLowerCase().includes(search) ||
      (member.memberNumber || "").toLowerCase().includes(search)
    );
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

  const addLineItem = (chargeable: Chargeable) => {
    const newItem: LineItem = {
      id: chargeable.id,
      name: chargeable.name,
      quantity: 1,
      unitPrice: chargeable.unitPrice,
      subtotal: chargeable.unitPrice // Initial subtotal with quantity 1
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);

      const payload = {
        invoice_data: {
          memberId: values.memberId,
          dueDate: values.dueDate,
          subtotal: values.subtotal,
          tax: values.tax,
          total: values.total,
          reference: values.reference || null,
          notes: values.additionalInfo || null,
          status: 'DRAFT'
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

      router.push(`/dashboard/invoices/view/${data.invoice_id}`);

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-white shadow-lg rounded-lg p-8">
        {/* Invoice Details */}
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>
            <div className="grid gap-6">
              {/* Member Selection and Reference */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="memberId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-2">
                      <FormLabel>Select Member</FormLabel>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={open}
                              className="w-full justify-between h-10"
                            >
                              {field.value && selectedMember ? (
                                <span className="flex items-center">
                                  <span className="font-medium">{selectedMember.name}</span>
                                  <span className="ml-2 text-sm text-muted-foreground">
                                    {selectedMember.memberNumber && `#${selectedMember.memberNumber}`}
                                  </span>
                                </span>
                              ) : (
                                "Search members..."
                              )}
                              <SearchIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <div className="flex flex-col">
                            <div className="flex items-center border-b px-3">
                              <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                              <input
                                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Search members..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                              />
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                              {isLoading ? (
                                <div className="p-4 text-sm text-muted-foreground text-center">
                                  Loading members...
                                </div>
                              ) : filteredMembers.length === 0 ? (
                                <div className="p-4 text-sm text-muted-foreground text-center">
                                  No members found
                                </div>
                              ) : (
                                <div className="py-2">
                                  {filteredMembers.map((member) => (
                                    <div
                                      key={member.id}
                                      className={cn(
                                        "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent",
                                        field.value === member.id && "bg-accent"
                                      )}
                                      onClick={() => {
                                        form.setValue("memberId", member.id);
                                        setSelectedMember(member);
                                        setOpen(false);
                                        setSearchQuery("");
                                      }}
                                    >
                                      <div>
                                        <p className="font-medium">{member.name || member.email}</p>
                                        {member.memberNumber && (
                                          <p className="text-sm text-muted-foreground">
                                            #{member.memberNumber}
                                          </p>
                                        )}
                                      </div>
                                      {field.value === member.id && (
                                        <CheckIcon className="h-4 w-4 text-primary" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-2">
                      <FormLabel>Reference (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Flight Training, Membership" 
                          className="h-10" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="invoiceDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Invoice Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Line Items</h2>
              <p className="text-sm text-gray-500">Add items to your invoice</p>
            </div>

            {/* Add Items Button */}
            <Popover open={itemsOpen} onOpenChange={setItemsOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start mb-4"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Search for items to add...
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
                      <TabsTrigger value="membership" className="flex items-center">
                        <span className="mr-1">🎫</span> Membership Fee
                      </TabsTrigger>
                      <TabsTrigger value="equipment" className="flex items-center">
                        <span className="mr-1">⚙️</span> Equipment
                      </TabsTrigger>
                      <TabsTrigger value="other" className="flex items-center">
                        <span className="mr-1">📦</span> Other
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" className="max-h-[300px] overflow-y-auto">
                      {isLoadingChargeables ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          Loading items...
                        </div>
                      ) : filteredChargeables.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          No items found
                        </div>
                      ) : (
                        <div className="py-2">
                          {filteredChargeables.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent"
                              onClick={() => addLineItem(item)}
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
                    <TabsContent value="membership" className="max-h-[300px] overflow-y-auto">
                      {isLoadingChargeables ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          Loading items...
                        </div>
                      ) : (
                        <div className="py-2">
                          {filteredChargeables
                            .filter(item => item.type === 'MEMBERSHIP_FEE')
                            .map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent"
                                onClick={() => addLineItem(item)}
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
                    <TabsContent value="equipment" className="max-h-[300px] overflow-y-auto">
                      {isLoadingChargeables ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          Loading items...
                        </div>
                      ) : (
                        <div className="py-2">
                          {filteredChargeables
                            .filter(item => item.type === 'EQUIPMENT')
                            .map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent"
                                onClick={() => addLineItem(item)}
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
                    <TabsContent value="other" className="max-h-[300px] overflow-y-auto">
                      {isLoadingChargeables ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          Loading items...
                        </div>
                      ) : (
                        <div className="py-2">
                          {filteredChargeables
                            .filter(item => item.type === 'OTHER')
                            .map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent"
                                onClick={() => addLineItem(item)}
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

        {/* Additional Information */}
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <Collapsible
              open={isAdditionalInfoOpen}
              onOpenChange={setIsAdditionalInfoOpen}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Additional Information</h2>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {isAdditionalInfoOpen ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="mt-4">
                <FormField
                  control={form.control}
                  name="additionalInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes or information..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline"
            disabled={isSubmitting}
          >
            Save as Draft
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
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