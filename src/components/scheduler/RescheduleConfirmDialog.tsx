'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatTime } from "@/utils/time";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface RescheduleConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  newStartTime: string;
  newEndTime: string;
  bookingId: string;
  bookingDate: Date;
  onSuccess?: () => void;
}

export function RescheduleConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  newStartTime,
  newEndTime,
  bookingId,
  bookingDate,
  onSuccess,
}: RescheduleConfirmDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Format the display time
  const formatDisplayTime = (time: string) => {
    const [hours] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${ampm}`;
  };

  const handleConfirm = async () => {
    try {
      setIsUpdating(true);

      // First, fetch the existing booking data
      console.log('Fetching booking data for:', bookingId);
      const getResponse = await fetch(`/api/bookings/${bookingId}`);
      const responseData = await getResponse.json();
      
      if (!getResponse.ok) {
        throw new Error(responseData.error || 'Failed to fetch existing booking data');
      }
      
      const existingBooking = responseData;
      console.log('Fetched existing booking:', existingBooking);

      // Create the date objects for the new times
      const [startHour, startMinute] = newStartTime.split(':').map(Number);
      const [endHour, endMinute] = newEndTime.split(':').map(Number);

      // Create dates for the start and end times
      const startDateTime = new Date(bookingDate);
      startDateTime.setHours(startHour, startMinute, 0, 0);

      const endDateTime = new Date(bookingDate);
      endDateTime.setHours(endHour, endMinute, 0, 0);

      // Create dates for the date portion (midnight)
      const startDate = new Date(bookingDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(bookingDate);
      endDate.setHours(0, 0, 0, 0);

      console.log('Updating booking with data:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startTime: newStartTime,
        endTime: newEndTime,
        bookingId,
        userId: existingBooking.user_id,
        aircraftId: existingBooking.aircraft_id,
        flightTypeId: existingBooking.flight_type_id
      });

      // Prepare the update data, keeping all existing fields and only updating times
      const updateData = {
        startDate: startDate.toISOString(),  // Send as ISO string
        endDate: endDate.toISOString(),      // Send as ISO string
        startTime: newStartTime,
        endTime: newEndTime,
        // Preserve existing required fields
        member: existingBooking.user_id,
        aircraft: existingBooking.aircraft_id,
        flightType: existingBooking.flight_type_id,
        instructor: existingBooking.instructor_id,
        description: existingBooking.description,
        lesson: existingBooking.lesson_id
      };

      console.log('Sending update data:', updateData);

      // Make the API call to update the booking
      const response = await fetch(`/api/bookings?id=${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update booking');
      }

      toast({
        title: "Success",
        description: "Booking time updated successfully",
      });

      // Call onSuccess to refresh the data
      onSuccess?.();
      
      // Call the original onConfirm to close the dialog
      onConfirm();
    } catch (error) {
      console.error('Failed to update booking:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update booking',
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Reschedule</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to reschedule this booking to {formatDisplayTime(newStartTime)} - {formatDisplayTime(newEndTime)}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Updating...
              </>
            ) : (
              'Confirm'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 