
import { supabase } from "@/integrations/supabase/client";
import { StoredConversionState } from './types';

/**
 * Updates conversion state in Supabase
 */
export const updateSupabaseConversion = async (state: StoredConversionState): Promise<void> => {
  if (!state.conversionId) return;

  try {
    const { data: existingConversion, error } = await supabase
      .from('text_conversions')
      .select('text_hash, status')
      .eq('id', state.conversionId)
      .maybeSingle();

    if (error) {
      console.error('Error checking conversion:', error);
      return;
    }

    // Only update if:
    // 1. The conversion exists
    // 2. We're not trying to change a completed conversion to another state
    if (existingConversion?.text_hash && 
        !(existingConversion.status === 'completed' && state.status !== 'completed')) {
      
      console.log('🔄 Updating conversion state:', {
        id: state.conversionId,
        status: state.status,
        progress: state.progress,
        fileName: state.fileName,
        elapsedTime: state.elapsedTime
      });

      const updateData: any = {
        status: state.status,
        progress: state.progress,
        file_name: state.fileName,
      };

      // Only update time if defined
      if (state.elapsedTime !== undefined) {
        // First check if the column exists to avoid errors
        const { data: columns, error: columnError } = await supabase
          .from('text_conversions')
          .select('elapsed_time')
          .limit(1);

        if (!columnError && columns) {
          updateData.elapsed_time = state.elapsedTime;
        }
      }

      // If starting conversion, save start time
      if (state.status === 'converting' && state.conversionStartTime) {
        // Check if started_at column exists
        const { data: columns, error: columnError } = await supabase
          .from('text_conversions')
          .select('started_at')
          .limit(1);

        if (!columnError && columns) {
          updateData.started_at = new Date(state.conversionStartTime).toISOString();
        }
      }

      const { error: updateError } = await supabase
        .from('text_conversions')
        .update(updateData)
        .eq('id', state.conversionId);

      if (updateError) {
        console.error('❌ Error updating conversion:', updateError);
      }
    } else {
      console.warn('⚠️ Conversion not updated:', {
        reason: existingConversion ? 'conversion already completed' : 'text_hash not found',
        conversionId: state.conversionId
      });
    }
  } catch (error) {
    console.error('❌ Error updating Supabase conversion:', error);
  }
};

/**
 * Fetches latest conversion state from Supabase
 */
export const fetchSupabaseConversion = async (conversionId: string, state: StoredConversionState): Promise<StoredConversionState> => {
  try {
    console.log('🔍 Looking for conversion in Supabase:', conversionId);
    
    // First make a basic query that should always work
    const { data: basicData, error: basicError } = await supabase
      .from('text_conversions')
      .select('status, progress, storage_path')
      .eq('id', conversionId)
      .maybeSingle();

    if (basicError) {
      console.error('❌ Error loading basic conversion state:', basicError);
      return state;
    }

    if (basicData) {
      console.log('✅ Basic conversion state found:', basicData);
      
      // Update state with basic data - THIS IS WHERE THE TYPE ERROR WAS
      // Fix: Cast the status to the correct union type
      state.status = basicData.status as 'idle' | 'converting' | 'completed' | 'error';
      state.progress = basicData.progress;
      
      // Now try to get time data
      try {
        const { data, error } = await supabase
          .from('text_conversions')
          .select('elapsed_time, started_at')
          .eq('id', conversionId)
          .maybeSingle();
          
        if (!error && data) {
          // Time data available
          if (data.elapsed_time) {
            state.elapsedTime = data.elapsed_time;
          }
          
          if (data.started_at && state.status === 'converting') {
            const startTime = new Date(data.started_at).getTime();
            state.conversionStartTime = startTime;
            
            // If no elapsed_time, calculate it
            if (!state.elapsedTime) {
              state.elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            }
          }
        }
      } catch (timeError) {
        // Time columns may not exist yet, so handle silently
        console.log('Time columns possibly not available:', timeError);
      }
    } else {
      console.warn('⚠️ Conversion not found:', conversionId);
      // If conversion not found, reset state
      state.status = 'idle';
      state.progress = 0;
      state.conversionId = undefined;
    }
    
    return state;
  } catch (error) {
    console.error('❌ Error fetching Supabase conversion:', error);
    return state;
  }
};
