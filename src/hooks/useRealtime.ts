import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useRealtime = <T,>(
  table: string,
  filter?: { column: string; value: string }
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from(table).select('*');

      if (filter) {
        query = query.eq(filter.column, filter.value);
      }

      const { data: result, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setData(result || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [table, filter]);

  // Subscribe to real-time updates
  useEffect(() => {
    fetchData();

    const filterConfig = filter
      ? `${filter.column}=eq.${filter.value}`
      : undefined;

    const realtimeChannel = supabase
      .channel(`${table}:${filter?.value || '*'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: filterConfig,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData((prev) => [payload.new as T, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setData((prev) =>
              prev.map((item: any) =>
                item.id === (payload.new as any).id
                  ? (payload.new as T)
                  : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setData((prev) =>
              prev.filter((item: any) => item.id !== (payload.old as any).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [table, filter, fetchData]);

  return { data, loading, error, refetch: fetchData };
};
