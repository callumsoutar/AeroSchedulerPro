import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface TimeSlotProps {
  hour: number;
  date: Date;
  resourceId: string;
  resourceType: 'staff' | 'aircraft';
}

export function TimeSlot({ hour, date, resourceId, resourceType }: TimeSlotProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    // Create a new date object for the selected time
    const selectedDate = new Date(date);
    selectedDate.setHours(hour);
    selectedDate.setMinutes(0);
    selectedDate.setSeconds(0);
    selectedDate.setMilliseconds(0);

    // Format the time for the URL
    const formattedTime = `${hour.toString().padStart(2, '0')}:00`;
    
    console.log('TimeSlot clicked:', {
      resourceId,
      resourceType,
      date: selectedDate.toISOString(),
      hour,
      formattedTime
    });
    
    // Create the URL with query parameters
    const queryParams = new URLSearchParams({
      date: selectedDate.toISOString().split('T')[0],
      startTime: formattedTime,
      endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
      resourceId: resourceId,
      resourceType: resourceType
    }).toString();

    console.log('Navigating to booking form with params:', {
      queryString: queryParams,
      parsedParams: Object.fromEntries(new URLSearchParams(queryParams))
    });

    // Navigate to the booking form with pre-filled values
    router.push(`/dashboard/bookings/new?${queryParams}`);
  };

  return (
    <div
      className={cn(
        "w-[100px] shrink-0 border-r h-full transition-colors duration-200",
        isHovered && "bg-blue-100 cursor-pointer"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    />
  );
} 