import { useQuery } from "@tanstack/react-query";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LessonGrading } from "@/types";

export function useLessonGradings(lessonId?: string) {
  const supabase = createClientComponentClient();

  return useQuery({
    queryKey: ['lessonGradings', lessonId],
    queryFn: async () => {
      if (!lessonId) return [];

      const { data, error } = await supabase
        .from('lesson_gradings')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as LessonGrading[];
    },
    enabled: !!lessonId
  });
} 