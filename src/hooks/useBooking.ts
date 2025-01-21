import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  getBasicBookingInfo, 
  getFlightTimesInfo, 
  getPeopleInfo, 
  getLessonInfo, 
  getBookingDetails,
  getApplicableRate,
  type BasicBookingInfo,
  type FlightTimes,
  type PeopleInfo,
  type LessonInfo,
  type BookingDetails
} from '@/utils/booking-queries';

interface UseBookingOptions {
  includeFlightTimes?: boolean;
}

interface UseBookingResult {
  basicInfo: BasicBookingInfo | null;
  flightTimes: FlightTimes | null;
  people: PeopleInfo | null;
  lesson: LessonInfo | null;
  bookingDetails: BookingDetails | null;
  applicableRate: number | null;
  loading: {
    basic: boolean;
    flightTimes: boolean;
    people: boolean;
    lesson: boolean;
    bookingDetails: boolean;
  };
  error: {
    basic: string | null;
    flightTimes: string | null;
    people: string | null;
    lesson: string | null;
    bookingDetails: string | null;
  };
}

const defaultOptions: UseBookingOptions = {
  includeFlightTimes: false
};

export function useBooking(
  bookingId: string,
  options: UseBookingOptions = defaultOptions
): UseBookingResult {
  const [basicInfo, setBasicInfo] = useState<BasicBookingInfo | null>(null);
  const [flightTimes, setFlightTimes] = useState<FlightTimes | null>(null);
  const [people, setPeople] = useState<PeopleInfo | null>(null);
  const [lesson, setLesson] = useState<LessonInfo | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [applicableRate, setApplicableRate] = useState<number | null>(null);

  const [loading, setLoading] = useState({
    basic: true,
    flightTimes: false,
    people: true,
    lesson: true,
    bookingDetails: true,
  });

  const [error, setError] = useState<{
    basic: string | null;
    flightTimes: string | null;
    people: string | null;
    lesson: string | null;
    bookingDetails: string | null;
  }>({
    basic: null,
    flightTimes: null,
    people: null,
    lesson: null,
    bookingDetails: null,
  });

  useEffect(() => {
    const supabase = createClientComponentClient();
    let isMounted = true;

    async function fetchData() {
      try {
        // Reset flight times related state when includeFlightTimes changes
        if (!options.includeFlightTimes) {
          setFlightTimes(null);
          setError(prev => ({ ...prev, flightTimes: null }));
          setLoading(prev => ({ ...prev, flightTimes: false }));
        }

        // Fetch basic info first
        const { data: basicData, error: basicError } = await getBasicBookingInfo(supabase, bookingId);
        if (isMounted) {
          setBasicInfo(basicData);
          // Calculate applicable rate whenever basic info changes
          if (basicData) {
            setApplicableRate(getApplicableRate(basicData));
          }
          setLoading(prev => ({ ...prev, basic: false }));
          if (basicError) setError(prev => ({ ...prev, basic: basicError.message }));
        }

        // Type the promises array
        type PromiseResults = [
          { data: PeopleInfo | null; error: any },
          { data: LessonInfo | null; error: any },
          { data: BookingDetails | null; error: any }
        ];

        // Prepare promises array
        const promises: [
          Promise<{ data: PeopleInfo | null; error: any }>,
          Promise<{ data: LessonInfo | null; error: any }>,
          Promise<{ data: BookingDetails | null; error: any }>
        ] = [
          getPeopleInfo(supabase, bookingId),
          getLessonInfo(supabase, bookingId),
          getBookingDetails(supabase, bookingId),
        ];

        // Only fetch flight times if requested
        if (options.includeFlightTimes) {
          setLoading(prev => ({ ...prev, flightTimes: true }));
          const { data: flightTimesData, error: flightTimesError } = await getFlightTimesInfo(supabase, bookingId);
          
          if (isMounted) {
            setFlightTimes(flightTimesData);
            setLoading(prev => ({ ...prev, flightTimes: false }));
            if (flightTimesError) {
              setError(prev => ({ ...prev, flightTimes: flightTimesError.message }));
            } else {
              setError(prev => ({ ...prev, flightTimes: null }));
            }
          }
        }

        // Fetch other data with proper typing
        const [
          { data: peopleData, error: peopleError },
          { data: lessonData, error: lessonError },
          { data: bookingDetailsData, error: bookingDetailsError }
        ] = await Promise.all(promises) as PromiseResults;

        if (isMounted) {
          setPeople(peopleData);
          setLesson(lessonData);
          setBookingDetails(bookingDetailsData);

          setLoading(prev => ({
            ...prev,
            people: false,
            lesson: false,
            bookingDetails: false,
          }));

          setError(prev => ({
            ...prev,
            people: peopleError?.message || null,
            lesson: lessonError?.message || null,
            bookingDetails: bookingDetailsError?.message || null,
          }));
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'An error occurred';
          setError(prev => ({
            ...prev,
            basic: errorMessage
          }));
          setLoading(prev => ({ ...prev, basic: false }));
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [bookingId, options.includeFlightTimes]);

  return {
    basicInfo,
    flightTimes,
    people,
    lesson,
    bookingDetails,
    applicableRate,
    loading,
    error,
  };
} 