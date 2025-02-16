
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
    let intervalId: number;
    
    if (conversionId && (status === 'converting' || status === 'processing')) {
      console.log('🔌 Setting up realtime updates:', {
        conversionId,
        calculatedTotalChunks,
        textLength
      });
      
      // Consulta manual inicial
      supabase
        .from('text_conversions')
        .select('progress, processed_characters, total_characters')
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
      
      // Configurar la suscripción en tiempo real
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
            console.log('⚡ Realtime update received:', {
              old: payload.old,
              new: payload.new,
              diff: {
                progress: payload.new.progress - (payload.old?.progress || 0),
                processed_characters: payload.new.processed_characters - (payload.old?.processed_characters || 0)
              }
            });
            if (payload.new) {
              handleProgressUpdate(payload.new);
            }
          }
        )
        .subscribe((status) => {
          console.log(`📡 Channel status (${conversionId}):`, status);
        });

      // Refetch manual cada 5 segundos como respaldo
      intervalId = window.setInterval(async () => {
        console.log('🔄 Manual refetch triggered');
        const { data, error } = await supabase
          .from('text_conversions')
          .select('progress, processed_characters, total_characters')
          .eq('id', conversionId)
          .single();

        if (error) {
          console.error('❌ Error in manual refetch:', error);
          return;
        }

        if (data) {
          console.log('📊 Manual refetch data:', data);
          handleProgressUpdate(data);
        }
      }, 5000);
    }

    return () => {
      if (channel) {
        console.log('🔌 Cleaning up realtime subscription');
        supabase.removeChannel(channel);
      }
      if (intervalId) {
        console.log('⏱️ Clearing refetch interval');
        clearInterval(intervalId);
      }
    };
  }, [conversionId, status, handleProgressUpdate, calculatedTotalChunks, textLength]);
};
