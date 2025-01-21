import { useQuery } from "@tanstack/react-query";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface Member {
  id: string;
  name: string | null;
  email: string;
  memberNumber?: string;
}

export function useMembers() {
  const supabase = createClientComponentClient();

  return useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session) return [];

        const { data: userData } = await supabase
          .from('User')
          .select('organizationId')
          .eq('id', session.session.user.id)
          .single();

        if (!userData?.organizationId) return [];

        const { data } = await supabase
          .from('User')
          .select('id, name, email, memberNumber')
          .eq('organizationId', userData.organizationId)
          .order('name');

        return data || [];
      } catch (error) {
        console.error('Error fetching members:', error);
        return [];
      }
    },
    initialData: []
  });
} 