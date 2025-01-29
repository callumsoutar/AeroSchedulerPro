import { TimeSlot } from "@/types/scheduler";

export function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = 8; hour <= 19; hour++) {
    slots.push({
      hour,
      time: `${hour.toString().padStart(2, '0')}:00`
    });
  }
  return slots;
}

export function calculateBookingPosition(startTime: string, endTime: string): {
  left: number;
  width: number;
} {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;
  
  // Each hour is 100px wide
  const left = (startHour - 8) * 100; // 8 is the start hour
  const width = (endHour - startHour) * 100;
  
  return { left, width };
}

export function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function isSameDay(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
} 