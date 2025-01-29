import { z } from "zod";

export interface Member {
  id: string;
  fullName: string;
  email: string;
  membershipStatus: string;
}

export interface Instructor {
  id: string;
  fullName: string;
  email: string;
  qualifications: string[];
}

export interface AircraftType {
  id: string;
  type: string;
  model: string;
  year: string;
}

export type AircraftStatus = 'active' | 'inactive' | 'maintenance';

export interface Aircraft {
  id: string;
  registration: string;
  type_id: string;
  status: AircraftStatus;
  organizationId: string;
  aircraft_type: AircraftType | null;
}

export interface FlightType {
  id: string;
  name: string;
  description: string;
  duration: number;
}

export interface Lesson {
  id: string;
  name: string;
  description: string;
  requiredQualification?: string;
}

export const bookingFormSchema = z.object({
  startDate: z.date({
    required_error: "A start date is required",
  }),
  endDate: z.date({
    required_error: "An end date is required",
  }),
  startTime: z.string({
    required_error: "A start time is required",
  }),
  endTime: z.string({
    required_error: "An end time is required",
  }),
  member: z.string({
    required_error: "A member is required",
  }),
  instructor: z.string().optional(),
  aircraft: z.string({
    required_error: "An aircraft is required",
  }),
  flightType: z.string({
    required_error: "A flight type is required",
  }),
  lesson: z.string().optional(),
  description: z.string().optional(),
}).refine(
  (data) => {
    const startDateTime = new Date(`${data.startDate.toISOString().split('T')[0]}T${data.startTime}:00`);
    const endDateTime = new Date(`${data.endDate.toISOString().split('T')[0]}T${data.endTime}:00`);
    return endDateTime > startDateTime;
  },
  {
    message: "End time must be after start time",
    path: ["endTime"],
  }
);

export type BookingFormValues = z.infer<typeof bookingFormSchema>; 