
import { supabase } from "@/integrations/supabase/client";
import { ChunkProgressData } from "./types/chunks";

// Define the database response type
interface ConversionProgressRow {
  conversion_id: string;
  processed_chunks: number;
  total_chunks: number;
  processed_characters: number;
  total_characters: number;
  current_chunk: string | null;
  progress: number;
  status: 'pending' | 'converting' | 'completed' | 'error';
  error_message: string | null;
  warning_message: string | null;
  updated_at: string;
}

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
        
        // Cast the payload data to our known type
        const rowData = newData as ConversionProgressRow;
        
        // Map from DB format to ChunkProgressData
        const progressData: ChunkProgressData = {
          processedChunks: rowData.processed_chunks || 0,
          totalChunks: rowData.total_chunks || 0,
          processedCharacters: rowData.processed_characters || 0,
          totalCharacters: rowData.total_characters || 0,
          currentChunk: rowData.current_chunk || '',
          progress: rowData.progress || 0,
          error: rowData.error_message || undefined,
          warning: rowData.warning_message || undefined,
          isCompleted: rowData.status === 'completed'
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
        // Cast to our known type
        const rowData = data as ConversionProgressRow;
        
        const progressData: ChunkProgressData = {
          processedChunks: rowData.processed_chunks || 0,
          totalChunks: rowData.total_chunks || 0,
          processedCharacters: rowData.processed_characters || 0,
          totalCharacters: rowData.total_characters || 0,
          currentChunk: rowData.current_chunk || '',
          progress: rowData.progress || 0,
          error: rowData.error_message || undefined,
          warning: rowData.warning_message || undefined,
          isCompleted: rowData.status === 'completed'
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
    
    // Cast to our known type
    const rowData = data as ConversionProgressRow;

    return {
      processedChunks: rowData.processed_chunks || 0,
      totalChunks: rowData.total_chunks || 0,
      processedCharacters: rowData.processed_characters || 0,
      totalCharacters: rowData.total_characters || 0,
      currentChunk: rowData.current_chunk || '',
      progress: rowData.progress || 0,
      error: rowData.error_message || undefined,
      warning: rowData.warning_message || undefined,
      isCompleted: rowData.status === 'completed'
    };
  } catch (e) {
    console.error('Failed to get conversion progress:', e);
    return null;
  }
};
