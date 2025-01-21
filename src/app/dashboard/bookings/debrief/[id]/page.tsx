"use client";

import { useState } from "react";
import { useRedirectIfNotAuthenticated } from "@/hooks/useRedirectIfNotAuthenticated";
import Loading from "@/components/Loading";
import { useBooking } from "@/hooks/useBooking";
import { BookingProgress } from "@/components/booking/BookingProgress";
import LessonHeader from "@/components/LessonHeader"
import GradingTable from "@/components/GradingTable"
import OverallComments from "@/components/OverallComments"
import LessonStatus from "@/components/LessonStatus"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CheckCircle } from "lucide-react";

export default function DebriefPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, isLoading: authLoading } = useRedirectIfNotAuthenticated(
    ["OWNER", "ADMIN", "INSTRUCTOR"],
    "/unauthorized"
  );
  const { basicInfo: booking, loading, error } = useBooking(params.id);

  const handleSubmitDebrief = async () => {
    try {
      setIsSubmitting(true);
      
      // Update booking status to complete
      const { error: updateError } = await supabase
        .from('Booking')
        .update({ status: 'complete' })
        .eq('id', params.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Flight debrief completed successfully.",
      });

      router.push(`/dashboard/bookings/check-in/${params.id}`);
    } catch (error) {
      console.error('Error submitting debrief:', error);
      toast({
        title: "Error",
        description: "Failed to submit debrief. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <h1 className="text-3xl font-bold">Flight Debrief</h1>
      </div>

      <div className="py-8">
        <BookingProgress currentStage="debrief" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Lesson Header */}
        <Card>
          <CardHeader>
            <CardTitle>Lesson Details</CardTitle>
          </CardHeader>
          <CardContent>
            <LessonHeader
              title="Circuit Training"
              objective="Practice touch-and-go landings and circuit procedures"
              status="complete"
            />
          </CardContent>
        </Card>

        {/* Grading Table */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <GradingTable />
          </CardContent>
        </Card>

        {/* Lesson Status */}
        <Card>
          <CardHeader>
            <CardTitle>Lesson Status</CardTitle>
          </CardHeader>
          <CardContent>
            <LessonStatus />
          </CardContent>
        </Card>

        {/* Overall Comments */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <OverallComments />
          </CardContent>
        </Card>

        {/* Complete Debrief Button */}
        <div className="flex justify-end mt-6">
          <Button 
            size="lg"
            className="bg-purple-600 hover:bg-purple-700"
            onClick={handleSubmitDebrief}
            disabled={isSubmitting}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            {isSubmitting ? "Completing..." : "Complete Debrief"}
          </Button>
        </div>
      </div>
    </div>
  );
} 