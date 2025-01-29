'use client';

import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBookingFormData } from "@/hooks/useBookingFormData";
import { bookingFormSchema, type BookingFormValues } from "@/types/booking";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import React from 'react';

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return {
    value: `${hour}:00`,
    label: `${hour}:00`
  };
});

interface BookingFormProps {
  bookingType: 'member' | 'trial';
}

export function BookingForm({ bookingType }: BookingFormProps) {
  const searchParams = useSearchParams();
  const {
    isLoading,
    error,
    members,
    instructors,
    aircraft,
    flightTypes,
    lessons
  } = useBookingFormData(bookingType);

  // Get pre-filled values from URL
  const dateParam = searchParams.get('date');
  const startTimeParam = searchParams.get('startTime');
  const endTimeParam = searchParams.get('endTime');
  const resourceIdParam = searchParams.get('resourceId');
  const resourceTypeParam = searchParams.get('resourceType');

  // Parse the date parameter properly using useMemo
  const parsedDate = useMemo(() => {
    if (!dateParam) return new Date();
    
    // Split the date string into parts
    const [year, month, day] = dateParam.split('-').map(Number);
    
    // Create date using local timezone
    const date = new Date(year, month - 1, day);
    
    // Ensure we're working with the correct day regardless of timezone
    date.setHours(12, 0, 0, 0);
    
    return date;
  }, [dateParam]);
  
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Create form with default values
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      startDate: parsedDate,
      endDate: parsedDate,
      startTime: startTimeParam || "09:00",
      endTime: endTimeParam || "10:00",
      member: "",
      aircraft: resourceTypeParam === 'aircraft' && resourceIdParam ? resourceIdParam : "",
      flightType: "",
      instructor: resourceTypeParam === 'staff' && resourceIdParam ? resourceIdParam : undefined,
      lesson: undefined,
      description: ""
    }
  });

  // Debug log when component mounts
  useEffect(() => {
    console.log('Component mounted with:', {
      resourceType: resourceTypeParam,
      resourceId: resourceIdParam,
      availableAircraft: aircraft,
      formValues: form.getValues(),
      defaultAircraftValue: resourceTypeParam === 'aircraft' ? resourceIdParam : null
    });
  }, [aircraft, form, resourceIdParam, resourceTypeParam]);

  // Update form when resources load
  useEffect(() => {
    if (!isLoading && resourceIdParam && resourceTypeParam === 'aircraft') {
      const matchingAircraft = aircraft.find(a => a.id === resourceIdParam);
      console.log('Checking aircraft match:', {
        resourceId: resourceIdParam,
        matchingAircraft,
        allAircraft: aircraft,
        currentFormValue: form.getValues('aircraft')
      });

      if (matchingAircraft) {
        console.log('Setting aircraft value to:', resourceIdParam);
        form.setValue('aircraft', resourceIdParam);
      }
    }
  }, [isLoading, resourceIdParam, resourceTypeParam, aircraft, form]);

  // Debug log form values on any change
  useEffect(() => {
    const subscription = form.watch((value) => {
      console.log('Form values changed:', value);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Modify the Aircraft FormField to log its value
  const AircraftField = () => (
    <FormField
      control={form.control}
      name="aircraft"
      render={({ field }) => {
        console.log('Aircraft field render:', {
          fieldValue: field.value,
          availableOptions: aircraft
        });
        return (
          <FormItem>
            <FormLabel>Aircraft</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value}
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select aircraft" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {aircraft.map((ac) => (
                  <SelectItem key={ac.id} value={ac.id}>
                    {ac.registration} - {ac.aircraft_type ? `${ac.aircraft_type.type} ${ac.aircraft_type.model}` : 'Unknown Type'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredMembers = members.filter((member) => {
    if (!searchValue) return true;
    const searchStr = searchValue.toLowerCase();
    const memberStr = `${member.name || ''} ${member.email || ''} ${member.memberNumber || ''}`.toLowerCase();
    return memberStr.includes(searchStr);
  });

  async function onSubmit(values: BookingFormValues) {
    try {
      setIsSubmitting(true);
      console.log('Starting booking submission with values:', values);

      // Check if we have a session
      const supabase = createClientComponentClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('Auth session check:', {
        hasSession: !!session,
        userId: session?.user?.id,
        sessionError
      });

      if (!session) {
        throw new Error('No authentication session found');
      }

      // Get user's organization ID
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('organizationId, role, email')
        .eq('id', session.user.id)
        .single();

      console.log('User data fetch:', {
        userData,
        userError,
        userId: session.user.id,
        hasOrgId: !!userData?.organizationId,
        query: `User table query for id: ${session.user.id}`
      });

      if (userError) {
        console.error('Error fetching user data:', userError);
        throw new Error(`Failed to fetch user data: ${userError.message}`);
      }

      if (!userData?.organizationId) {
        console.error('No organization ID found for user:', {
          userId: session.user.id,
          email: userData?.email,
          fetchedData: userData
        });
        throw new Error('No organization ID found for user');
      }

      // Create a new object with properly formatted dates and include organization_id
      const payload = {
        ...values,
        startDate: values.startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        endDate: values.endDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        organization_id: userData.organizationId, // Convert from camelCase to snake_case
        startTime: values.startTime,
        endTime: values.endTime,
        type: 'flight',
        status: 'confirmed'
      };

      console.log('Sending booking request with payload:', {
        ...payload,
        organization_id: payload.organization_id // Log the snake_case version
      });

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Booking API response:', {
        status: response.status,
        ok: response.ok,
        data,
        organization_id: payload.organization_id
      });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      toast({
        title: "Success",
        description: "Booking created successfully",
      });

      // Redirect to the booking view page
      router.push(`/dashboard/bookings/view/${data.id}`);
    } catch (error) {
      console.error('Failed to create booking:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create booking',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Date & Time Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Date & Time</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Start Date */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
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
                        disabled={(date) =>
                          date < new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Time */}
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End Date */}
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
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
                        disabled={(date) =>
                          date < form.getValues().startDate
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End Time */}
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Booking Details Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Booking Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Member/Customer Field */}
            <FormField
              control={form.control}
              name="member"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{bookingType === 'member' ? 'Member' : 'Customer'}</FormLabel>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? members.find((member) => member.id === field.value)?.name ||
                              members.find((member) => member.id === field.value)?.email ||
                              "Select member"
                            : `Select ${bookingType === 'member' ? 'member' : 'customer'}`}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <div className="flex flex-col">
                        <div className="flex items-center border-b px-3">
                          <input
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Search members..."
                            value={searchValue}
                            onChange={(e) => {
                              setSearchValue(e.target.value);
                              setHighlightedIndex(-1);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setHighlightedIndex((prev) => 
                                  prev < filteredMembers.length - 1 ? prev + 1 : prev
                                );
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setHighlightedIndex((prev) => 
                                  prev > 0 ? prev - 1 : prev
                                );
                              } else if (e.key === 'Enter' && highlightedIndex >= 0) {
                                e.preventDefault();
                                const selectedMember = filteredMembers[highlightedIndex];
                                if (selectedMember) {
                                  form.setValue('member', selectedMember.id);
                                  setOpen(false);
                                  setSearchValue("");
                                  setHighlightedIndex(-1);
                                }
                              } else if (e.key === 'Escape') {
                                setOpen(false);
                                setSearchValue("");
                                setHighlightedIndex(-1);
                              }
                            }}
                          />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                          {filteredMembers.map((member, index) => (
                            <div
                              key={member.id}
                              className={cn(
                                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                member.id === field.value && "bg-accent text-accent-foreground",
                                highlightedIndex === index && "bg-accent text-accent-foreground"
                              )}
                              onClick={() => {
                                form.setValue('member', member.id);
                                setOpen(false);
                                setSearchValue("");
                                setHighlightedIndex(-1);
                              }}
                              onMouseEnter={() => setHighlightedIndex(index)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  member.id === field.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div>
                                <div>{member.name || member.email}</div>
                                {member.memberNumber && (
                                  <div className="text-muted-foreground text-xs">
                                    #{member.memberNumber}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {filteredMembers.length === 0 && (
                            <div className="p-4 text-sm text-muted-foreground text-center">
                              No members found.
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

            {/* Instructor Field */}
            <FormField
              control={form.control}
              name="instructor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select instructor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {instructors.map((instructor) => (
                        <SelectItem key={instructor.id} value={instructor.id}>
                          {instructor.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Aircraft Field */}
            <AircraftField />

            {/* Flight Type Field */}
            <FormField
              control={form.control}
              name="flightType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flight Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select flight type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {flightTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lesson Field - Only show for member bookings */}
            {bookingType === 'member' && (
              <FormField
                control={form.control}
                name="lesson"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Lesson (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select lesson" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lessons.map((lesson) => (
                          <SelectItem key={lesson.id} value={lesson.id}>
                            {lesson.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes or details about the booking"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button 
            variant="outline" 
            type="button"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Creating...
              </>
            ) : (
              'Create Booking'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
} 