
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProgressUpdateData {
  progress: number;
  processed_characters?: number | null;
  total_characters?: number | null;
}

export const useProgressUpdates = (
  setProgress: (value: number | ((prev: number) => number)) => void,
  setProcessedChunks: (value: number | ((prev: number) => number)) => void,
  setTotalChunks: (value: number) => void,
  lastUpdateRef: React.MutableRefObject<number>,
  calculatedTotalChunks: number
) => {
  return useCallback(async (data: ProgressUpdateData) => {
    const currentTime = Date.now();
    const timeSinceLastUpdate = (currentTime - lastUpdateRef.current) / 1000;
    
    console.log('⚡ Progress update received:', { 
      ...data, 
      timeSinceLastUpdate,
      calculatedTotalChunks,
      timestamp: new Date(currentTime).toISOString()
    });
    
    const { progress: newProgress, processed_characters, total_characters } = data;
    lastUpdateRef.current = currentTime;
    
    if (processed_characters && total_characters) {
      const calculatedProgress = Math.min((processed_characters / total_characters) * 100, 99);
      console.log(`📊 Progress from characters: ${processed_characters}/${total_characters} (${calculatedProgress.toFixed(1)}%)`);
      
      // Actualizar la base de datos con el progreso
      const { error: updateError } = await supabase
        .from('text_conversions')
        .update({
          progress: calculatedProgress,
          processed_characters: processed_characters,
          total_characters: total_characters,
          updated_at: new Date().toISOString()
        })
        .eq('status', 'processing');

      if (updateError) {
        console.error('Error updating conversion progress:', updateError);
      }

      setProgress(calculatedProgress);
    } else if (typeof newProgress === 'number' && newProgress >= 0) {
      setProgress((prev) => {
        const nextProgress = Math.max(prev, Math.min(newProgress, 99));
        if (nextProgress !== prev) {
          console.log(`📈 Progress update: ${prev.toFixed(1)}% -> ${nextProgress.toFixed(1)}%`);
        }
        return nextProgress;
      });
    }

    if (total_characters) {
      const estimatedChunks = Math.ceil(total_characters / 4800);
      setTotalChunks(estimatedChunks);
      if (processed_characters) {
        const processedChunks = Math.ceil(processed_characters / 4800);
        console.log(`🔄 Chunks progress: ${processedChunks}/${estimatedChunks}`);
        
        // Actualizar chunks procesados en la base de datos
        const { error: chunksUpdateError } = await supabase
          .from('text_conversions')
          .update({
            processed_chunks: processedChunks,
            total_chunks: estimatedChunks
          })
          .eq('status', 'processing');

        if (chunksUpdateError) {
          console.error('Error updating chunks progress:', chunksUpdateError);
        }

        setProcessedChunks(processedChunks);
      }
    }
  }, [setProgress, setProcessedChunks, setTotalChunks, lastUpdateRef, calculatedTotalChunks]);
};
