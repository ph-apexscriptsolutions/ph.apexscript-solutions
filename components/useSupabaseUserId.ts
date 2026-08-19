import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';

export default function useSupabaseUserId() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return userId;
}
