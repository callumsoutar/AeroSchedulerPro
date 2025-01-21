"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  FileText, 
  Send,
  MoreVertical,
  LogIn,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRedirectIfNotAuthenticated } from "@/hooks/useRedirectIfNotAuthenticated";
import Loading from "@/components/Loading";
import SimplifiedFlyingBadge from "@/components/flying-badge";
import { OptimizedBookingView } from "@/components/booking/OptimizedBookingView";
import { OptimizedPeopleView } from "@/components/booking/OptimizedPeopleView";
import { BookingTabs } from "@/components/booking/BookingTabs";
import { useBooking } from "@/hooks/useBooking";
import { BookingProgress } from "@/components/booking/BookingProgress";

export default function BookingViewPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useRedirectIfNotAuthenticated(
    ["OWNER", "ADMIN", "MEMBER"],
    "/unauthorized"
  );
  const { basicInfo: booking, loading, error } = useBooking(params.id);

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

  const handleCheckIn = () => {
    if (booking.status === "flying") {
      router.push(`/dashboard/bookings/check-in/${params.id}`);
    } else if (booking.status === "confirmed") {
      router.push(`/dashboard/bookings/check-out/${params.id}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Flight Details</h1>
            {booking.status === "flying" ? (
              <SimplifiedFlyingBadge />
            ) : (
              <Badge
                className={`px-4 py-2 text-base ${
                  booking.status === "confirmed"
                    ? "bg-green-50 text-green-700"
                    : booking.status === "unconfirmed"
                    ? "bg-yellow-50 text-yellow-700"
                    : booking.status === "cancelled"
                    ? "bg-red-50 text-red-700"
                    : booking.status === "inProgress"
                    ? "bg-purple-50 text-purple-700"
                    : booking.status === "complete"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-gray-50 text-gray-700"
                }`}
              >
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {booking.status === "flying" ? (
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleCheckIn}>
                <LogIn className="w-4 h-4 mr-2" />
                Check-in Flight
              </Button>
            ) : booking.status === "confirmed" ? (
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCheckIn}>
                <LogOut className="w-4 h-4 mr-2" />
                Check Flight Out
              </Button>
            ) : null}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <FileText className="w-4 h-4 mr-2" />
                  Print Checkout Sheet
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Send className="w-4 h-4 mr-2" />
                  Send Booking Confirmation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Add Progress Bar */}
      <div className="py-8">
        <BookingProgress currentStage={booking.status === 'flying' ? 'flying' : 'none'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        {/* Optimized Booking Details Component */}
        <OptimizedBookingView bookingId={params.id} />

        {/* Optimized People Component */}
        <OptimizedPeopleView bookingId={params.id} />

        {/* Booking Tabs Component */}
        <BookingTabs bookingId={params.id} />
      </div>
    </div>
  );
} 