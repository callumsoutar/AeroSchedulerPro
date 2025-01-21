"use client";

import { useState } from "react";
import { useRedirectIfNotAuthenticated } from "@/hooks/useRedirectIfNotAuthenticated";
import Loading from "@/components/Loading";
import { useBooking } from "@/hooks/useBooking";
import { OptimizedBookingView } from "@/components/booking/OptimizedBookingView";
import { OptimizedPeopleView } from "@/components/booking/OptimizedPeopleView";
import { BookingDetails } from "@/components/booking/BookingDetails";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { CheckoutModal } from "@/components/modals/CheckoutModal";
import { BookingProgress } from "@/components/booking/BookingProgress";

export default function CheckOutPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    route: '',
    passengers: '',
    eta: ''
  });

  const { user, isLoading: authLoading } = useRedirectIfNotAuthenticated(
    ["OWNER", "ADMIN", "INSTRUCTOR"],
    "/unauthorized"
  );
  const { basicInfo: booking, loading, error } = useBooking(params.id);

  const handleCheckOut = async () => {
    try {
      setIsSubmitting(true);
      setShowModal(true);

      // First create the booking details record
      const { data: bookingDetails, error: detailsError } = await supabase
        .from('BookingDetails')
        .insert([{
          route: formData.route || '',
          passengers: formData.passengers || null,
          eta: formData.eta || null
        }])
        .select()
        .single();

      if (detailsError) throw detailsError;

      // Then update booking with both status and booking_details_id
      const { error: updateError } = await supabase
        .from('Booking')
        .update({ 
          status: 'flying',
          booking_details_id: bookingDetails.id 
        })
        .eq('id', params.id);

      if (updateError) throw updateError;

      // Don't close modal or redirect immediately - let user enjoy the animation
      setTimeout(() => {
        router.push(`/dashboard/bookings/view/${params.id}`);
      }, 3000);

    } catch (error) {
      console.error('Error checking out flight:', error);
      toast({
        title: "Error",
        description: "Failed to check out flight. Please try again.",
        variant: "destructive",
      });
      setShowModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting...</div>
      </div>
    );
  }

  if (loading.basic) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500" />
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

  // Redirect if booking is not in confirmed status
  if (booking.status !== "confirmed") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">
          This booking cannot be checked out. Only confirmed bookings can be checked out.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Check-out Flight</h1>
        <Button 
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
          onClick={handleCheckOut}
          disabled={isSubmitting}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {isSubmitting ? "Checking Out..." : "Check Flight Out"}
        </Button>
      </div>

      <div className="py-8">
        <BookingProgress currentStage="checkout" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        {/* Booking Details */}
        <OptimizedBookingView bookingId={params.id} />

        {/* People Details */}
        <OptimizedPeopleView bookingId={params.id} />

        {/* Flight Details Form */}
        <BookingDetails 
          bookingId={params.id}
          onFormChange={setFormData}
        />
      </div>

      <CheckoutModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
} 