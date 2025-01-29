'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SchedulerBooking } from '@/types/scheduler';
import { Booking } from '@/types';

export function useSchedulerBookings(selectedDate: Date) {
  const [bookings, setBookings] = useState<SchedulerBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create date range for the selected date
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('Booking')
        .select(`
          *,
          aircraft:aircraft_id (
            id,
            registration
          ),
          instructor:instructor_id (
            id,
            name
          ),
          user:user_id (
            id,
            name
          )
        `)
        .gte('startTime', startOfDay.toISOString())
        .lte('startTime', endOfDay.toISOString());

      if (bookingsError) throw bookingsError;

      console.log('Raw bookings data:', bookingsData);

      // Transform bookings into scheduler format
      const schedulerBookings: SchedulerBooking[] = (bookingsData || []).map((booking: any) => {
        console.log('Processing booking:', { id: booking.id, status: booking.status });
        
        const transformedStatus = transformBookingStatus(booking.status);
        console.log('Transformed status:', { original: booking.status, transformed: transformedStatus });
        
        return {
          uuid: booking.id,
          instructor_uuid: booking.instructor_id || '',
          aircraft_uuid: booking.aircraft_id || '',
          start_date_time: booking.startTime,
          end_date_time: booking.endTime,
          title: booking.description || 'Untitled Booking',
          status: transformedStatus,
          user: booking.user ? {
            name: booking.user.name
          } : undefined,
          aircraft: booking.aircraft ? {
            registration: booking.aircraft.registration
          } : null,
          instructor: booking.instructor ? {
            name: booking.instructor.name
          } : null
        };
      });

      setBookings(schedulerBookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, selectedDate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    isLoading,
    error,
    mutate: fetchBookings
  };
}

// Helper function to transform booking status
function transformBookingStatus(status: string): 'confirmed' | 'pending' | 'flying' | 'complete' | 'cancelled' {
  console.log('Transforming booking status:', { 
    originalStatus: status,
    originalType: typeof status,
    isUpperCase: status === status.toUpperCase(),
    possibleMatch: status.toUpperCase(),
  });
  
  // Normalize the status to uppercase for comparison
  const normalizedStatus = status.toUpperCase();
  
  switch (normalizedStatus) {
    case 'CONFIRMED':
      return 'confirmed';
    case 'PENDING':
      return 'pending';
    case 'IN_PROGRESS':
    case 'FLYING':
      return 'flying';
    case 'COMPLETED':
    case 'COMPLETE':
      return 'complete';
    case 'CANCELLED':
      return 'cancelled';
    default:
      console.log('Status not matched, defaulting to pending. Available cases:', {
        expectedCases: ['CONFIRMED', 'PENDING', 'IN_PROGRESS', 'FLYING', 'COMPLETED', 'COMPLETE', 'CANCELLED'],
        receivedStatus: status,
        normalizedStatus: normalizedStatus
      });
      return 'pending';
  }
} 