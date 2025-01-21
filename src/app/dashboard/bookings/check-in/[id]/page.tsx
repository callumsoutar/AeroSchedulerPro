"use client";

import { useRedirectIfNotAuthenticated } from "@/hooks/useRedirectIfNotAuthenticated";
import Loading from "@/components/Loading";
import { useBooking } from "@/hooks/useBooking";
import BookingInvoiceForm from "@/components/forms/booking-invoice-form";
import { useRouter } from "next/navigation";
import { CheckInTimes } from "@/components/check-in/check-in-times";
import { useState, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { BookingProgress } from "@/components/booking/BookingProgress";

interface FlightTimes {
  start_hobbs: number | null;
  end_hobbs: number | null;
  start_tacho: number | null;
  end_tacho: number | null;
  flight_time: number | null;
  isValid: boolean;
}

export default function CheckInPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { user, isLoading: authLoading } = useRedirectIfNotAuthenticated(
    ["OWNER", "ADMIN", "INSTRUCTOR"],
    "/unauthorized"
  );
  const { basicInfo: booking, loading, error } = useBooking(params.id);
  const [flightCharges, setFlightCharges] = useState<any>(null);
  const [flightTimes, setFlightTimes] = useState<FlightTimes | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFlightChargesCalculated = useCallback((charges: any) => {
    setFlightCharges(charges);
  }, []);

  const handleFlightTimesValidated = useCallback((times: FlightTimes) => {
    setFlightTimes(times);
  }, []);

  const handleInvoiceCreated = useCallback(async (invoiceId: string) => {
    try {
      setIsSubmitting(true);

      if (!flightTimes?.isValid) {
        toast({
          title: "Invalid Flight Times",
          description: "Please ensure flight times are correctly entered and calculated.",
          variant: "destructive"
        });
        return;
      }

      // First create BookingFlightTimes record
      const { data: flightTimesData, error: flightTimesError } = await supabase
        .from('BookingFlightTimes')
        .insert([{
          start_hobbs: flightTimes.start_hobbs,
          end_hobbs: flightTimes.end_hobbs,
          start_tacho: flightTimes.start_tacho,
          end_tacho: flightTimes.end_tacho,
          flight_time: flightTimes.flight_time
        }])
        .select()
        .single();

      if (flightTimesError) {
        throw new Error(`Failed to create flight times: ${flightTimesError.message}`);
      }

      // CHANGE: Update booking BEFORE the trigger runs
      const { error: bookingError } = await supabase
        .from('Booking')
        .update({ 
          booking_flight_times_id: flightTimesData.id,
          status: 'complete'
        })
        .eq('id', params.id);

      if (bookingError) {
        throw new Error(`Failed to update booking: ${bookingError.message}`);
      }

      // Now trigger the tech log entry creation
      const { error: techLogError } = await supabase
        .rpc('create_tech_log_entry', { 
          p_booking_flight_times_id: flightTimesData.id 
        });

      if (techLogError) {
        throw new Error(`Failed to create tech log entry: ${techLogError.message}`);
      }

      // Success - navigate to invoice
      toast({
        title: "Flight Checked In",
        description: "Flight times recorded and invoice created successfully.",
      });
      
      router.push(`/dashboard/invoices/view/${invoiceId}`);
    } catch (error) {
      console.error('Error during check-in:', error);
      toast({
        title: "Check-in Failed",
        description: error instanceof Error ? error.message : "Failed to complete check-in process",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [flightTimes, params.id, router, supabase]);

  if (authLoading || loading.basic) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting...</div>
      </div>
    );
  }

  if (error.basic) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Error: {error.basic}
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Booking not found
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Check-in Flight</h1>
      </div>

      {/* Add Progress Bar */}
      <div className="py-8">
        <BookingProgress currentStage="checkin" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left side - Flight check-in form */}
        <div className="space-y-6">
          <CheckInTimes 
            bookingId={params.id} 
            onFlightChargesCalculated={handleFlightChargesCalculated}
            onFlightTimesValidated={handleFlightTimesValidated}
          />
          {/* Additional flight check-in form components will go here */}
        </div>

        {/* Right side - Invoice form */}
        <div>
          <BookingInvoiceForm 
            userId={booking.user?.id || ''} 
            bookingId={params.id}
            onInvoiceCreated={handleInvoiceCreated}
            flightCharges={flightCharges}
            disabled={isSubmitting || !flightTimes?.isValid}
          />
        </div>
      </div>
    </div>
  );
} 