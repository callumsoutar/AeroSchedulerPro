'use client';

import { SchedulerBooking } from "@/types/scheduler";
import { calculateBookingPosition, formatTime } from "@/utils/time";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { BookingHoverCard } from "./BookingHoverCard";
import { Plane } from "lucide-react";
import { useRouter } from "next/navigation";

interface DraggableBookingProps {
  booking: SchedulerBooking;
  selectedDate: Date;
  aircraft?: { registration: string } | null;
  instructor?: { name: string } | null;
}

export function DraggableBooking({ 
  booking, 
  selectedDate,
  aircraft,
  instructor
}: DraggableBookingProps) {
  const router = useRouter();

  // Add debug logging for the booking status
  console.log('Booking status debug:', {
    bookingId: booking.uuid,
    status: booking.status,
    rawStatus: booking.status,
    isConfirmed: booking.status === "confirmed",
    isFlying: booking.status === "flying",
    isComplete: booking.status === "complete",
    isCancelled: booking.status === "cancelled",
    isPending: booking.status === "pending"
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: booking.uuid,
    data: booking,
  });

  const { left, width } = calculateBookingPosition(
    booking.start_date_time,
    booking.end_date_time
  );

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.8 : undefined,
      }
    : undefined;

  const handleClick = (e: React.MouseEvent) => {
    // Only navigate if not dragging
    if (!isDragging) {
      e.stopPropagation(); // Prevent event bubbling
      router.push(`/dashboard/bookings/view/${booking.uuid}`);
    }
  };

  const bookingContent = (
    <Card 
      className={cn(
        "p-1.5 pl-3 h-full flex flex-col overflow-hidden text-white border-0 cursor-pointer",
        booking.status === "confirmed" && "bg-blue-600",
        booking.status === "flying" && "bg-purple-600",
        booking.status === "complete" && "bg-emerald-600",
        booking.status === "cancelled" && "bg-destructive",
        booking.status === "pending" && "bg-yellow-500"
      )}
      onClick={handleClick}
    >
      <div className="flex items-center gap-1 h-full">
        {booking.status === "flying" && (
          <Plane className="h-3 w-3 text-white/90 rotate-45 shrink-0" />
        )}
        {booking.user && (
          <div className="text-base font-medium truncate text-white">
            {booking.user.name}
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        left: `${left}px`,
        width: `${width}px`,
        top: '2px',
        bottom: '2px',
        touchAction: 'none',
        ...style,
      }}
      {...attributes}
      {...listeners}
      className={cn(
        "z-10 transition-shadow",
        isDragging && "shadow-lg cursor-grabbing",
        !isDragging && "cursor-grab"
      )}
    >
      <BookingHoverCard 
        booking={booking}
        aircraft={aircraft}
        instructor={instructor}
      >
        {bookingContent}
      </BookingHoverCard>
    </div>
  );
} 