
import { supabase } from "@/integrations/supabase/client";
import { ChunkProgressData } from "./types/chunks";

interface ProgressUpdate {
  conversion_id: string;
  processed_chunks: number;
  total_chunks: number;
  processed_characters: number;
  total_characters: number;
  current_chunk: string | null;
  progress: number;
  status: 'converting' | 'completed' | 'error';
  error_message?: string;
  warning_message?: string;
}

/**
 * Updates the conversion progress in Supabase
 */
export const updateConversionProgress = async (
  conversionId: string, 
  data: ChunkProgressData
): Promise<void> => {
  try {
    const update: ProgressUpdate = {
      conversion_id: conversionId,
      processed_chunks: data.processedChunks,
      total_chunks: data.totalChunks,
      processed_characters: data.processedCharacters,
      total_characters: data.totalCharacters,
      current_chunk: data.currentChunk || null,
      progress: data.progress,
      status: data.isCompleted ? 'completed' : (data.error ? 'error' : 'converting'),
      error_message: data.error,
      warning_message: data.warning
    };

    const { error } = await supabase
      .from('conversion_progress')
      .upsert(update, { onConflict: 'conversion_id' });

    if (error) {
      console.error('Error updating conversion progress:', error);
    }
  } catch (e) {
    console.error('Failed to update conversion progress:', e);
  }
};

/**
 * Subscribes to progress updates for a specific conversion
 */
export const subscribeToProgress = (
  conversionId: string,
  callback: (data: ChunkProgressData) => void
) => {
  const channel = supabase
    .channel(`progress:${conversionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversion_progress',
        filter: `conversion_id=eq.${conversionId}`
      },
      (payload) => {
        const { new: newData } = payload;
        if (!newData) return;
        
        // Map from DB format to ChunkProgressData
        const progressData: ChunkProgressData = {
          processedChunks: newData.processed_chunks,
          totalChunks: newData.total_chunks,
          processedCharacters: newData.processed_characters,
          totalCharacters: newData.total_characters,
          currentChunk: newData.current_chunk || '',
          progress: newData.progress,
          error: newData.error_message,
          warning: newData.warning_message,
          isCompleted: newData.status === 'completed'
        };
        
        callback(progressData);
      }
    )
    .subscribe();

  // Also fetch the initial state
  const fetchInitialState = async () => {
    const { data, error } = await supabase
      .from('conversion_progress')
      .select('*')
      .eq('conversion_id', conversionId)
      .maybeSingle();

    if (!error && data) {
      const progressData: ChunkProgressData = {
        processedChunks: data.processed_chunks,
        totalChunks: data.total_chunks,
        processedCharacters: data.processed_characters,
        totalCharacters: data.total_characters,
        currentChunk: data.current_chunk || '',
        progress: data.progress,
        error: data.error_message,
        warning: data.warning_message,
        isCompleted: data.status === 'completed'
      };
      
      callback(progressData);
    }
  };
  
  fetchInitialState();
  
  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
};

/**
 * Gets the latest progress for a conversion
 */
export const getConversionProgress = async (
  conversionId: string
): Promise<ChunkProgressData | null> => {
  try {
    const { data, error } = await supabase
      .from('conversion_progress')
      .select('*')
      .eq('conversion_id', conversionId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching conversion progress:', error);
      return null;
    }

    if (!data) return null;

    return {
      processedChunks: data.processed_chunks,
      totalChunks: data.total_chunks,
      processedCharacters: data.processed_characters,
      totalCharacters: data.total_characters,
      currentChunk: data.current_chunk || '',
      progress: data.progress,
      error: data.error_message,
      warning: data.warning_message,
      isCompleted: data.status === 'completed'
    };
  } catch (e) {
    console.error('Failed to get conversion progress:', e);
    return null;
  }
};
