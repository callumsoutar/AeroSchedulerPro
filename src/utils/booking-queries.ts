import { SupabaseClient } from '@supabase/supabase-js';

// Define interfaces for each data structure
export interface FlightType {
  id: string;
  name: string;
  description?: string;
}

export interface AircraftRate {
  id: string;
  rate: number;
  flight_type_id: string;
  flight_type: FlightType;
}

export interface BasicBookingInfo {
  id: string;
  status: 'confirmed' | 'unconfirmed' | 'cancelled' | 'flying' | 'inProgress' | 'complete';
  startTime: string;
  endTime: string;
  description?: string;
  flight_type_id: string;
  flight_type: FlightType;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  aircraft?: {
    id: string;
    registration: string;
    record_hobbs: boolean;
    record_tacho: boolean;
    aircraft_type: {
      type: string;
      model: string;
    };
    aircraft_rates: AircraftRate[];
  }
}

export interface FlightTimes {
  flight_times: {
    start_hobbs?: number;
    end_hobbs?: number;
    start_tacho?: number;
    end_tacho?: number;
    flight_time?: number;
  }
}

export interface PeopleInfo {
  instructor?: {
    id: string;
    name: string;
    email: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  }
}

export interface LessonInfo {
  lesson?: {
    id: string;
    name: string;
    description?: string;
    duration?: number;
  }
}

export interface BookingDetails {
  booking_details?: {
    route?: string;
    comments?: string;
    instructor_comment?: string;
    passengers?: number;
  }
}

// Add return type definitions to your queries
export const getBasicBookingInfo = async (
  supabase: SupabaseClient, 
  bookingId: string
): Promise<{ data: BasicBookingInfo | null; error: any }> => {
  return supabase
    .from('Booking')
    .select(`
      id,
      status,
      startTime,
      endTime,
      description,
      flight_type_id,
      flight_type:flight_type_id (
        id,
        name,
        description
      ),
      user:user_id (
        id,
        name,
        email
      ),
      aircraft:aircraft_id (
        id,
        registration,
        record_hobbs,
        record_tacho,
        aircraft_type:type_id (
          type,
          model
        ),
        aircraft_rates:AircraftRates (
          id,
          rate,
          flight_type_id,
          flight_type:flight_type_id (
            id,
            name,
            description
          )
        )
      )
    `)
    .eq('id', bookingId)
    .single();
};

export const getFlightTimesInfo = async (
  supabase: SupabaseClient, 
  bookingId: string
): Promise<{ data: FlightTimes | null; error: any }> => {
  return supabase
    .from('Booking')
    .select(`
      flight_times:booking_flight_times_id (
        start_hobbs,
        end_hobbs,
        start_tacho,
        end_tacho,
        flight_time
      )
    `)
    .eq('id', bookingId)
    .single();
};

export const getPeopleInfo = async (
  supabase: SupabaseClient, 
  bookingId: string
): Promise<{ data: PeopleInfo | null; error: any }> => {
  return supabase
    .from('Booking')
    .select(`
      instructor:instructor_id (
        id,
        name,
        email
      ),
      user:user_id (
        id,
        name,
        email
      )
    `)
    .eq('id', bookingId)
    .single();
};

export const getLessonInfo = async (
  supabase: SupabaseClient, 
  bookingId: string
): Promise<{ data: LessonInfo | null; error: any }> => {
  return supabase
    .from('Booking')
    .select(`
      lesson:lesson_id (
        id,
        name,
        description,
        duration
      )
    `)
    .eq('id', bookingId)
    .single();
};

export const getBookingDetails = async (
  supabase: SupabaseClient, 
  bookingId: string
): Promise<{ data: BookingDetails | null; error: any }> => {
  return supabase
    .from('Booking')
    .select(`
      booking_details:booking_details_id (
        route,
        comments,
        instructor_comment,
        passengers
      )
    `)
    .eq('id', bookingId)
    .single();
};

// Helper function to get the applicable rate for a booking
export const getApplicableRate = (booking: BasicBookingInfo): number | null => {
  if (!booking.aircraft?.aircraft_rates || !booking.flight_type_id) {
    return null;
  }

  const applicableRate = booking.aircraft.aircraft_rates.find(
    rate => rate.flight_type_id === booking.flight_type_id
  );

  return applicableRate?.rate || null;
};