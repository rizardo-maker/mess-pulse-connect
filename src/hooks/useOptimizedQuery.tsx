
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OptimizedQueryConfig {
  table: string;
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  pagination?: { offset: number; limit: number };
  enableRealtime?: boolean;
}

export const useOptimizedQuery = ({
  table,
  select = '*',
  filters = {},
  orderBy,
  pagination,
  enableRealtime = true
}: OptimizedQueryConfig) => {
  return useQuery({
    queryKey: [table, select, filters, orderBy, pagination],
    queryFn: async () => {
      let query = supabase
        .from(table)
        .select(select, { count: 'exact' });

      // Apply filters efficiently
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      // Apply pagination
      if (pagination) {
        query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);
      }

      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return { data, count };
    },
    staleTime: 30000, // 30 seconds - reduce API calls
    gcTime: 300000, // 5 minutes - keep data in cache longer
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};
