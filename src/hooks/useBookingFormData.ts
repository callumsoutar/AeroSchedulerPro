import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Member, Instructor, Aircraft, FlightType, Lesson, AircraftType, AircraftStatus } from '@/types/booking';
import { useMembers } from '@/hooks/useMembers';

// Add type definitions for the database response
type AircraftResponse = {
  id: string;
  registration: string;
  type_id: string;
  status: AircraftStatus;
  organization_id: string;
  aircraft_type: {
    id: string;
    type: string;
    model: string;
    year: string;
  } | null;
}

export function useBookingFormData(bookingType: 'member' | 'trial') {
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { data: members = [], isLoading: isMembersLoading } = useMembers();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [flightTypes, setFlightTypes] = useState<FlightType[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Get user's session and organization
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session) {
          throw new Error('No authenticated session found');
        }

        const { data: userData } = await supabase
          .from('User')
          .select('organizationId')
          .eq('id', session.session.user.id)
          .single();

        if (!userData?.organizationId) {
          throw new Error('No organization found for user');
        }

        // Fetch instructors from User table where isStaff is true
        const { data: instructorsData, error: instructorsError } = await supabase
          .from('User')
          .select('id, name, email')
          .eq('organizationId', userData.organizationId)
          .eq('isStaff', true)
          .eq('memberStatus', 'ACTIVE');

        if (instructorsError) throw new Error('Failed to fetch instructors');
        
        // Transform the instructor data
        const transformedInstructors = instructorsData.map(user => ({
          id: user.id,
          fullName: user.name || user.email,
          email: user.email,
          qualifications: []
        }));
        
        setInstructors(transformedInstructors);

        // First fetch aircraft types
        const { data: aircraftTypesData, error: aircraftTypesError } = await supabase
          .from('AircraftTypes')
          .select('*');

        if (aircraftTypesError) {
          throw new Error('Failed to fetch aircraft types');
        }

        // Then fetch aircraft with proper type handling
        const { data: aircraftData, error: aircraftError } = await supabase
          .from('Aircraft')
          .select(`
            id,
            registration,
            type_id,
            status,
            organization_id,
            aircraft_type:type_id (
              id,
              type,
              model,
              year
            )
          `)
          .eq('organization_id', userData.organizationId)
          .eq('status', 'active' as AircraftStatus);

        if (aircraftError) {
          throw new Error('Failed to fetch aircraft');
        }

        // Transform aircraft data to match the Aircraft type
        const transformedAircraft: Aircraft[] = ((aircraftData || []) as unknown as AircraftResponse[]).map(ac => ({
          id: ac.id,
          registration: ac.registration,
          type_id: ac.type_id,
          status: ac.status,
          organizationId: ac.organization_id,
          aircraft_type: ac.aircraft_type ? {
            id: ac.aircraft_type.id,
            type: ac.aircraft_type.type,
            model: ac.aircraft_type.model,
            year: ac.aircraft_type.year
          } : null
        }));
        
        setAircraft(transformedAircraft);

        // Fetch flight types based on booking type for the organization
        const { data: flightTypesData, error: flightTypesError } = await supabase
          .from('FlightTypes')
          .select('id, name, description, duration, organization_id')
          .eq('organization_id', userData.organizationId);

        if (flightTypesError) {
          throw new Error('Failed to fetch flight types');
        }

        // Transform flight types data to match the FlightType interface
        const transformedFlightTypes: FlightType[] = (flightTypesData || []).map(ft => ({
          id: ft.id,
          name: ft.name,
          description: ft.description,
          duration: ft.duration || 0
        }));

        setFlightTypes(transformedFlightTypes);

        // Fetch lessons (only for member bookings)
        if (bookingType === 'member') {
          const { data: lessonsData, error: lessonsError } = await supabase
            .from('Lesson')
            .select(`
              id,
              name,
              description,
              duration,
              created_at,
              updated_at,
              briefing_url,
              air_exercise,
              prerequisites,
              objective
            `)
            .eq('organization_id', userData.organizationId);

          if (lessonsError) {
            throw new Error('Failed to fetch lessons');
          }
          setLessons(lessonsData || []);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [bookingType, supabase]);

  return {
    isLoading: isLoading || isMembersLoading,
    error,
    members: bookingType === 'member' ? members : [],
    instructors,
    aircraft,
    flightTypes,
    lessons
  };
} 