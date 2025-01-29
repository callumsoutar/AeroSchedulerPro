"use client";

import { useState } from 'react';
import { useRedirectIfNotAuthenticated } from "@/hooks/useRedirectIfNotAuthenticated";
import { useResources } from "@/hooks/useResources";
import { useSchedulerBookings } from "@/hooks/useSchedulerBookings";
import Loading from "@/components/Loading";
import { 
  DndContext, 
  DragEndEvent,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
} from '@dnd-kit/core';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { DraggableBooking } from "@/components/scheduler/DraggableBooking";
import { RescheduleConfirmDialog } from "@/components/scheduler/RescheduleConfirmDialog";
import { generateTimeSlots } from "@/utils/time";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { TimeSlot } from "@/components/scheduler/TimeSlot";
import { toast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

export default function SchedulerPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [pendingReschedule, setPendingReschedule] = useState<{
    bookingId: string;
    newStartTime: string;
    newEndTime: string;
  } | null>(null);
  
  const timeSlots = generateTimeSlots();
  const supabase = createClientComponentClient();
  
  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10, // 10px of movement required before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms delay on touch devices
        tolerance: 5, // 5px of movement allowed during delay
      },
    })
  );
  
  const { user, isLoading: isAuthLoading } = useRedirectIfNotAuthenticated(
    ["OWNER", "ADMIN", "INSTRUCTOR"],
    "/unauthorized"
  );

  const { 
    staffResources, 
    aircraftResources, 
    isLoading: isResourcesLoading,
    error: resourcesError 
  } = useResources();

  const {
    bookings,
    isLoading: isBookingsLoading,
    error: bookingsError,
    mutate: mutateBookings
  } = useSchedulerBookings(selectedDate);

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event;
    if (!active) return;

    const booking = bookings.find(b => b.uuid === active.id);
    if (!booking) return;

    // Calculate new times based on drag distance
    const hoursDelta = Math.round(delta.x / 100); // 100px = 1 hour
    if (hoursDelta === 0) return; // No change in time

    const startDate = new Date(booking.start_date_time);
    const endDate = new Date(booking.end_date_time);
    
    const newStartDate = new Date(startDate.setHours(startDate.getHours() + hoursDelta));
    const newEndDate = new Date(endDate.setHours(endDate.getHours() + hoursDelta));

    // Format times for display
    const newStartTime = `${newStartDate.getHours().toString().padStart(2, '0')}:00`;
    const newEndTime = `${newEndDate.getHours().toString().padStart(2, '0')}:00`;

    // Set pending reschedule
    setPendingReschedule({
      bookingId: booking.uuid,
      newStartTime,
      newEndTime,
    });
  };

  const handleRescheduleConfirm = async () => {
    if (!pendingReschedule) return;

    try {
      const booking = bookings.find(b => b.uuid === pendingReschedule.bookingId);
      if (!booking) return;

      // Get the current booking's data
      const response = await fetch(`/api/bookings/${pendingReschedule.bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: selectedDate,
          endDate: selectedDate,
          startTime: pendingReschedule.newStartTime,
          endTime: pendingReschedule.newEndTime,
          member: booking.user?.id || '',
          aircraft: booking.aircraft_uuid,
          instructor: booking.instructor_uuid,
          flightType: booking.flight_type_id || '',
          lesson: booking.lesson_id || '',
          description: booking.title || ''
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update booking');
      }

      // Show success message
      toast({
        title: "Success",
        description: "Booking rescheduled successfully",
      });

      // Refresh bookings
      mutateBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update booking',
        variant: "destructive",
      });
    }

    setPendingReschedule(null);
  };

  const handleRescheduleCancel = () => {
    setPendingReschedule(null);
  };

  console.log('Resources loaded:', {
    staff: staffResources.map(r => ({ id: r.id, name: r.name })),
    aircraft: aircraftResources.map(r => ({ id: r.id, name: r.name }))
  });

  if (isAuthLoading || isResourcesLoading || isBookingsLoading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting...</div>
      </div>
    );
  }

  if (resourcesError || bookingsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">
          {resourcesError || bookingsError}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Scheduler</h1>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDateChange(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDateChange(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            onClick={() => setSelectedDate(new Date())}
          >
            Today
          </Button>
        </div>
      </div>

      <DndContext 
        sensors={sensors}
        onDragEnd={handleDragEnd}
      >
        <div className="border rounded-lg bg-white">
          {/* Timeline Header */}
          <div className="flex border-b sticky top-0 bg-white z-20">
            <div className="w-48 shrink-0 border-r p-4 font-medium">
              Resource
            </div>
            <div className="flex-1 flex">
              {timeSlots.map((slot) => (
                <div
                  key={slot.hour}
                  className="w-[100px] shrink-0 border-r p-4 text-center text-sm font-medium"
                >
                  {slot.time}
                </div>
              ))}
            </div>
          </div>

          {/* Resource Rows */}
          <div>
            {/* Staff Section */}
            <div className="border-b">
              <div className="bg-gray-50 px-4 py-2 font-semibold">
                STAFF
              </div>
              {staffResources.map((resource) => {
                console.log('Rendering staff resource:', {
                  id: resource.id,
                  name: resource.name,
                  type: 'staff'
                });
                return (
                  <div key={resource.id} className="flex border-b hover:bg-gray-50">
                    <div className="w-48 shrink-0 border-r p-4 font-medium">
                      {resource.name}
                    </div>
                    <div className="flex-1 h-16 relative">
                      {/* Hour columns */}
                      <div className="absolute inset-0 flex">
                        {timeSlots.map((slot) => (
                          <TimeSlot
                            key={slot.hour}
                            hour={slot.hour}
                            date={selectedDate}
                            resourceId={resource.id}
                            resourceType="staff"
                          />
                        ))}
                      </div>
                      {/* Bookings */}
                      {bookings
                        .filter(booking => booking.instructor_uuid === resource.id)
                        .map(booking => (
                          <DraggableBooking
                            key={booking.uuid}
                            booking={booking}
                            selectedDate={selectedDate}
                            aircraft={booking.aircraft}
                            instructor={booking.instructor}
                          />
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Aircraft Section */}
            <div>
              <div className="bg-gray-50 px-4 py-2 font-semibold">
                AIRCRAFT
              </div>
              {aircraftResources.map((resource) => {
                console.log('Rendering aircraft resource:', {
                  id: resource.id,
                  name: resource.name,
                  type: 'aircraft'
                });
                return (
                  <div key={resource.id} className="flex border-b hover:bg-gray-50">
                    <div className="w-48 shrink-0 border-r p-4 font-medium">
                      {resource.name}
                    </div>
                    <div className="flex-1 h-16 relative">
                      {/* Hour columns */}
                      <div className="absolute inset-0 flex">
                        {timeSlots.map((slot) => (
                          <TimeSlot
                            key={slot.hour}
                            hour={slot.hour}
                            date={selectedDate}
                            resourceId={resource.id}
                            resourceType="aircraft"
                          />
                        ))}
                      </div>
                      {/* Bookings */}
                      {bookings
                        .filter(booking => booking.aircraft_uuid === resource.id)
                        .map(booking => (
                          <DraggableBooking
                            key={booking.uuid}
                            booking={booking}
                            selectedDate={selectedDate}
                            aircraft={booking.aircraft}
                            instructor={booking.instructor}
                          />
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DndContext>

      {/* Reschedule Confirmation Dialog */}
      {pendingReschedule && (
        <RescheduleConfirmDialog
          isOpen={true}
          onConfirm={handleRescheduleConfirm}
          onCancel={handleRescheduleCancel}
          newStartTime={pendingReschedule.newStartTime}
          newEndTime={pendingReschedule.newEndTime}
          bookingId={pendingReschedule.bookingId}
          bookingDate={selectedDate}
          onSuccess={mutateBookings}
        />
      )}
    </div>
  );
} 