import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LessonDebrief, LessonDebriefPerformance } from "@/types";

export function useDebrief(debriefId?: string) {
  const supabase = createClientComponentClient();
  const queryClient = useQueryClient();

  // Fetch debrief details
  const { data: debrief, isLoading, error } = useQuery({
    queryKey: ['debrief', debriefId],
    queryFn: async () => {
      if (!debriefId) return null;
      
      const { data, error } = await supabase
        .from('lesson_debriefs')
        .select(`
          *,
          booking:Booking (
            *,
            lesson:Lesson (*)
          ),
          performances:lesson_debrief_performances (*)
        `)
        .eq('id', debriefId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!debriefId
  });

  // Create new debrief
  const createDebrief = useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await supabase
        .from('lesson_debriefs')
        .insert([{ booking_id: bookingId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debrief'] });
    }
  });

  // Add performance grade
  const addPerformance = useMutation({
    mutationFn: async (performance: Omit<LessonDebriefPerformance, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('lesson_debrief_performances')
        .insert([performance])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debrief', debriefId] });
    }
  });

  // Update performance grade
  const updatePerformance = useMutation({
    mutationFn: async ({ id, ...performance }: Partial<LessonDebriefPerformance> & { id: string }) => {
      const { data, error } = await supabase
        .from('lesson_debrief_performances')
        .update(performance)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debrief', debriefId] });
    }
  });

  return {
    debrief,
    isLoading,
    error,
    createDebrief,
    addPerformance,
    updatePerformance
  };
} 