"use client";

import { useState, useCallback, useEffect } from "react";
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
import { DebriefPerformanceJSON } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export default function DebriefPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [performancesJson, setPerformancesJson] = useState<DebriefPerformanceJSON[]>([]);
  const [overallComments, setOverallComments] = useState<string>('');
  const [lessonStatus, setLessonStatus] = useState<'PASS' | 'FAIL' | 'INCOMPLETE'>('INCOMPLETE');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { user, isLoading: authLoading } = useRedirectIfNotAuthenticated(
    ["OWNER", "ADMIN", "INSTRUCTOR"],
    "/unauthorized"
  );
  
  const { basicInfo: booking, lesson, loading, error } = useBooking(params.id);

  const validateDebrief = useCallback((): { isValid: boolean; message?: string } => {
    const hasGrades = performancesJson.some(p => p.grade > 0);
    if (!hasGrades) {
      return { isValid: false, message: "Please grade at least one performance item" };
    }
    if (!lessonStatus) {
      return { isValid: false, message: "Please select a lesson status" };
    }
    return { isValid: true };
  }, [performancesJson, lessonStatus]);

  const handleGradingsChange = useCallback((gradings: DebriefPerformanceJSON[]) => {
    setPerformancesJson(gradings);
  }, []);

  const handleConfirmSubmit = useCallback(() => {
    const validation = validateDebrief();
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }
    setShowConfirmDialog(true);
  }, [validateDebrief]);

  const handleSubmitDebrief = useCallback(async () => {
    if (!booking) return;
    
    try {
      setIsSubmitting(true);
      
      // First create the debrief record
      const { data: debrief, error: debriefError } = await supabase
        .from('lesson_debriefs')
        .insert([{
          booking_id: params.id,
          organizationId: booking.organization_id,
          performances_json: performancesJson,
          overall_comments: overallComments,
          lesson_status: lessonStatus
        }])
        .select()
        .single();

      if (debriefError) throw debriefError;

      // Update the booking to mark debrief as completed
      const { error: updateError } = await supabase
        .from('Booking')
        .update({ debrief_completed: true })
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
      setShowConfirmDialog(false);
    }
  }, [booking, params.id, performancesJson, overallComments, lessonStatus, supabase, router]);

  // Early return for loading states
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
        <BookingProgress 
          currentStage="debrief" 
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
            <LessonHeader
              lesson={lesson}
              status="complete"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <GradingTable 
              lessonId={lesson?.lesson?.id || null}
              onGradingsChange={handleGradingsChange}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lesson Status</CardTitle>
          </CardHeader>
          <CardContent>
            <LessonStatus onStatusChange={setLessonStatus} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overall Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <OverallComments onCommentsChange={setOverallComments} />
          </CardContent>
        </Card>

        <div className="flex justify-end mt-6">
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogTrigger asChild>
              <Button 
                size="lg"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                {isSubmitting ? "Completing..." : "Complete Debrief"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Debrief Submission</DialogTitle>
                <DialogDescription>
                  Are you sure you want to complete this debrief? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{performancesJson.filter(p => p.grade > 0).length} performances graded</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Lesson Status: {lessonStatus}</span>
                  </div>
                  {overallComments && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Overall comments provided</span>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitDebrief}
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isSubmitting ? "Submitting..." : "Confirm & Submit"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
} 