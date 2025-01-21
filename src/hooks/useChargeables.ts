import { useQuery } from "@tanstack/react-query";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Chargeable } from "@/types";

export function useChargeables() {
  const supabase = createClientComponentClient();

  return useQuery({
    queryKey: ['chargeables'],
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
          .from('Chargeable')
          .select('*')
          .eq('organizationId', userData.organizationId)
          .eq('isActive', true)
          .order('name');

        return data || [];
      } catch (error) {
        console.error('Error fetching chargeables:', error);
        return [];
      }
    },
    initialData: []
  });
} 