"use client";

import { useRedirectIfNotAuthenticated } from "@/hooks/useRedirectIfNotAuthenticated";
import Loading from "@/components/Loading";
import { BookingProgress } from "@/components/booking/BookingProgress";
import { useBooking } from "@/hooks/useBooking";
import LessonHeader from "@/components/LessonHeader";
import LessonDescription from "@/components/LessonDescription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";

export default function BriefingPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { user, isLoading: authLoading } = useRedirectIfNotAuthenticated(
    ["OWNER", "ADMIN", "MEMBER"],
    "/unauthorized"
  );
  const { basicInfo: booking, lesson, loading, error } = useBooking(params.id);

  const handleCheckOut = async () => {
    try {
      const { error: updateError } = await supabase
        .from('Booking')
        .update({ briefing_completed: true })
        .eq('id', params.id);

      if (updateError) {
        throw updateError;
      }

      toast.success("Briefing completed successfully");
      router.push(`/dashboard/bookings/check-out/${params.id}`);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error("Failed to complete briefing");
    }
  };

  if (authLoading || loading.basic || loading.lesson) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting...</div>
      </div>
    );
  }

  if (error.basic || error.lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Error: {error.basic || error.lesson}
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
        <h1 className="text-3xl font-bold">Pre-flight Briefing</h1>
        <Button 
          onClick={handleCheckOut}
          variant="outline"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Check Flight Out
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="py-8">
        <BookingProgress 
          currentStage="briefing" 
          bookingStatus={booking.status} 
          briefing_completed={booking.briefing_completed}
          debrief_completed={booking.debrief_completed}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lesson Details</CardTitle>
          </CardHeader>
          <CardContent>
            <LessonHeader lesson={lesson} status="in-progress" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lesson Description</CardTitle>
          </CardHeader>
          <CardContent>
            <LessonDescription lesson={lesson} studentId={booking.user?.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 