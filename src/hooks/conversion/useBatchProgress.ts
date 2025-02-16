
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useBatchProgress = (
  conversionId: string | null | undefined,
  processedCharactersRef: React.MutableRefObject<number>,
  totalCharacters: number
) => {
  return useCallback(async () => {
    if (conversionId && processedCharactersRef.current > 0) {
      console.log('📝 Batch updating progress in Supabase:', {
        processed: processedCharactersRef.current,
        total: totalCharacters
      });

      const calculatedProgress = Math.min(
        (processedCharactersRef.current / totalCharacters) * 100,
        99
      );

      await supabase
        .from('text_conversions')
        .update({
          processed_characters: processedCharactersRef.current,
          progress: calculatedProgress,
        })
        .eq('id', conversionId);
    }
  }, [conversionId, totalCharacters, processedCharactersRef]);
};
