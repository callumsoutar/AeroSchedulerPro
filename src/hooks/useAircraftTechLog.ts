import { useQuery } from '@tanstack/react-query';
import { AircraftTechLog } from '@/types';

async function fetchTechLog(aircraftId: string): Promise<AircraftTechLog> {
  const response = await fetch(`/api/aircraft/tech-log?aircraftId=${aircraftId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch tech log');
  }
  return response.json();
}

export function useAircraftTechLog(aircraftId: string | null) {
  return useQuery<AircraftTechLog, Error>({
    queryKey: ['aircraftTechLog', aircraftId],
    queryFn: () => fetchTechLog(aircraftId!),
    enabled: !!aircraftId, // Only fetch if aircraftId is provided
  });
} 