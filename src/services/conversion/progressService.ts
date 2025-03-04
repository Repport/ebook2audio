
import { supabase } from "@/integrations/supabase/client";
import { ChunkProgressData } from "./types/chunks";

/**
 * Updates the conversion progress in Supabase
 */
export const updateConversionProgress = async (
  conversionId: string, 
  data: ChunkProgressData
): Promise<void> => {
  try {
    console.log('Updating conversion progress in Supabase:', {
      conversionId, 
      processed: data.processedChunks, 
      total: data.totalChunks,
      progress: data.progress
    });
    
    const updateData = {
      conversion_id: conversionId,
      processed_chunks: data.processedChunks,
      total_chunks: data.totalChunks,
      processed_characters: data.processedCharacters,
      total_characters: data.totalCharacters,
      current_chunk: data.currentChunk || null,
      progress: data.progress,
      status: data.isCompleted ? 'completed' : (data.error ? 'error' : 'converting'),
      error_message: data.error || null,
      warning_message: data.warning || null,
      updated_at: new Date().toISOString()
    };

    // Use upsert to handle both insert and update
    const { error } = await supabase
      .from('conversion_progress')
      .upsert(updateData, { onConflict: 'conversion_id' });

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
          processedChunks: newData.processed_chunks || 0,
          totalChunks: newData.total_chunks || 0,
          processedCharacters: newData.processed_characters || 0,
          totalCharacters: newData.total_characters || 0,
          currentChunk: newData.current_chunk || '',
          progress: newData.progress || 0,
          error: newData.error_message,
          warning: newData.warning_message,
          isCompleted: newData.status === 'completed'
        };
        
        console.log('Received realtime progress update:', progressData);
        callback(progressData);
      }
    )
    .subscribe();

  console.log(`Subscribed to progress updates for conversion ${conversionId}`);

  // Also fetch the initial state
  const fetchInitialState = async () => {
    try {
      const { data, error } = await supabase
        .from('conversion_progress')
        .select('*')
        .eq('conversion_id', conversionId)
        .maybeSingle();

      if (!error && data) {
        const progressData: ChunkProgressData = {
          processedChunks: data.processed_chunks || 0,
          totalChunks: data.total_chunks || 0,
          processedCharacters: data.processed_characters || 0,
          totalCharacters: data.total_characters || 0,
          currentChunk: data.current_chunk || '',
          progress: data.progress || 0,
          error: data.error_message,
          warning: data.warning_message,
          isCompleted: data.status === 'completed'
        };
        
        console.log('Found initial progress state:', progressData);
        callback(progressData);
      } else if (error) {
        console.error('Error fetching initial progress state:', error);
      }
    } catch (e) {
      console.error('Exception during initial progress fetch:', e);
    }
  };
  
  fetchInitialState();
  
  return {
    unsubscribe: () => {
      console.log(`Unsubscribing from progress updates for conversion ${conversionId}`);
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
    console.log('Fetching progress for conversion:', conversionId);
    
    const { data, error } = await supabase
      .from('conversion_progress')
      .select('*')
      .eq('conversion_id', conversionId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching conversion progress:', error);
      return null;
    }

    if (!data) {
      console.log('No progress data found for conversion:', conversionId);
      return null;
    }

    console.log('Found progress data:', data);

    return {
      processedChunks: data.processed_chunks || 0,
      totalChunks: data.total_chunks || 0,
      processedCharacters: data.processed_characters || 0,
      totalCharacters: data.total_characters || 0,
      currentChunk: data.current_chunk || '',
      progress: data.progress || 0,
      error: data.error_message,
      warning: data.warning_message,
      isCompleted: data.status === 'completed'
    };
  } catch (e) {
    console.error('Failed to get conversion progress:', e);
    return null;
  }
};
