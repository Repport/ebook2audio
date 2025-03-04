
import { supabase } from "@/integrations/supabase/client";
import { StoredConversionState } from './types';

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
      
      // Log error to system_logs
      await supabase.from('system_logs').insert({
        event_type: 'conversion_fetch',
        entity_id: conversionId,
        details: {
          error: basicError.message
        },
        status: 'error'
      });
      
      return state;
    }

    if (basicData) {
      console.log('✅ Basic conversion state found:', basicData);
      
      // Update state with basic data
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
      
      // Log to system_logs
      await supabase.from('system_logs').insert({
        event_type: 'conversion_fetch',
        entity_id: conversionId,
        details: {
          error: 'Conversion not found'
        },
        status: 'warning'
      });
    }
    
    return state;
  } catch (error) {
    console.error('❌ Error fetching Supabase conversion:', error);
    
    // Log error to system_logs
    await supabase.from('system_logs').insert({
      event_type: 'conversion_fetch',
      entity_id: conversionId,
      details: {
        error: error.message,
        stack: error.stack
      },
      status: 'error'
    });
    
    return state;
  }
};
