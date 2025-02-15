
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeSubscription = (
  conversionId: string | null | undefined,
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  handleProgressUpdate: (data: any) => void,
  calculatedTotalChunks: number,
  textLength?: number
) => {
  useEffect(() => {
    let channel;
    
    if (conversionId && (status === 'converting' || status === 'processing')) {
      console.log('🔌 Setting up realtime updates:', {
        conversionId,
        calculatedTotalChunks,
        textLength
      });
      
      supabase
        .from('text_conversions')
        .select('progress, processed_chunks, total_chunks')
        .eq('id', conversionId)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('❌ Error fetching initial state:', error);
            return;
          }
          if (data) {
            console.log('📝 Initial state:', data);
            handleProgressUpdate(data);
          }
        });
      
      channel = supabase
        .channel(`conversion-${conversionId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'text_conversions',
            filter: `id=eq.${conversionId}`,
          },
          (payload: any) => {
            console.log('⚡ Realtime update received:', payload);
            if (payload.new) {
              handleProgressUpdate(payload.new);
            }
          }
        )
        .subscribe((status) => {
          console.log(`📡 Channel status (${conversionId}):`, status);
        });
    }

    return () => {
      if (channel) {
        console.log('🔌 Cleaning up realtime subscription');
        supabase.removeChannel(channel);
      }
    };
  }, [conversionId, status, handleProgressUpdate, calculatedTotalChunks, textLength]);
};
