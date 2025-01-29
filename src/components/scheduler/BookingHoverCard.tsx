'use client';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Plane, User, MessageSquare, Clock } from "lucide-react";
import { SchedulerBooking } from "@/types/scheduler";
import { formatTime } from "@/utils/time";

interface BookingHoverCardProps {
  children: React.ReactNode;
  booking: SchedulerBooking;
  aircraft?: { registration: string } | null;
  instructor?: { name: string } | null;
}

export function BookingHoverCard({ 
  children, 
  booking,
  aircraft,
  instructor
}: BookingHoverCardProps) {
  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-80 p-4" 
        side="right"
        align="start"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">
              {formatTime(booking.start_date_time)} - {formatTime(booking.end_date_time)}
            </span>
          </div>
          {aircraft && (
            <div className="flex items-center gap-2">
              <Plane className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">{aircraft.registration}</span>
            </div>
          )}
          {instructor && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">{instructor.name}</span>
            </div>
          )}
          {booking.user && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">{booking.user.name}</span>
            </div>
          )}
          {booking.title && (
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-sm">{booking.title}</span>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
} 