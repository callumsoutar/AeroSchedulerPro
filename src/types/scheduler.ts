export type ResourceType = 'staff' | 'aircraft';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
}

export interface TimeSlot {
  hour: number;
  time: string;
}

export type BookingStatus = 'confirmed' | 'pending' | 'flying' | 'complete' | 'cancelled';

export interface User {
  id?: string;
  name: string;
}

export interface Aircraft {
  registration: string;
}

export interface Instructor {
  name: string;
}

export interface SchedulerBooking {
  uuid: string;
  instructor_uuid: string;
  aircraft_uuid: string;
  start_date_time: string;
  end_date_time: string;
  title: string;
  status: BookingStatus;
  user?: User;
  aircraft: {
    registration: string;
  } | null;
  instructor: {
    name: string;
  } | null;
  flight_type_id?: string;
  lesson_id?: string;
} 