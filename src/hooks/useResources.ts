'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Resource } from '@/types/scheduler';

export function useResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchResources() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch staff (users where isStaff is true)
        const { data: staffData, error: staffError } = await supabase
          .from('User')
          .select('id, name')
          .eq('isStaff', true);

        if (staffError) throw staffError;

        // Fetch aircraft
        const { data: aircraftData, error: aircraftError } = await supabase
          .from('Aircraft')
          .select('id, registration, type_id');

        if (aircraftError) throw aircraftError;

        // Transform the data into Resource format
        const staffResources: Resource[] = (staffData || []).map(staff => ({
          id: staff.id,
          name: staff.name || 'Unknown Staff',
          type: 'staff' as const
        }));

        const aircraftResources: Resource[] = (aircraftData || []).map(aircraft => ({
          id: aircraft.id,
          name: aircraft.registration,
          type: 'aircraft' as const
        }));

        // Combine and set resources
        setResources([...staffResources, ...aircraftResources]);
      } catch (err) {
        console.error('Error fetching resources:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch resources');
      } finally {
        setIsLoading(false);
      }
    }

    fetchResources();
  }, [supabase]);

  return {
    resources,
    isLoading,
    error,
    staffResources: resources.filter(r => r.type === 'staff'),
    aircraftResources: resources.filter(r => r.type === 'aircraft')
  };
} 