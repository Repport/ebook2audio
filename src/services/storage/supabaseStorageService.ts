
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
      
      // Log error to system_logs
      await supabase.from('system_logs').insert({
        event_type: 'conversion_update',
        entity_id: state.conversionId,
        details: {
          error: error.message,
          attempted_status: state.status
        },
        status: 'error'
      });
      
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
        updateData.elapsed_time = state.elapsedTime;
      }

      // If starting conversion, save start time
      if (state.status === 'converting' && state.conversionStartTime) {
        updateData.started_at = new Date(state.conversionStartTime).toISOString();
      }

      const { error: updateError } = await supabase
        .from('text_conversions')
        .update(updateData)
        .eq('id', state.conversionId);

      if (updateError) {
        console.error('❌ Error updating conversion:', updateError);
        
        // Log error to system_logs
        await supabase.from('system_logs').insert({
          event_type: 'conversion_update',
          entity_id: state.conversionId,
          details: {
            error: updateError.message,
            attempted_status: state.status,
            attempted_progress: state.progress
          },
          status: 'error'
        });
      } else {
        // Log successful update to system_logs if it's a significant state change
        if (state.status === 'completed' || state.status === 'error' || state.status === 'converting') {
          await supabase.from('system_logs').insert({
            event_type: 'conversion_update',
            entity_id: state.conversionId,
            details: {
              new_status: state.status,
              progress: state.progress,
              elapsed_time: state.elapsedTime
            },
            status: state.status
          });
        }
      }
    } else {
      console.warn('⚠️ Conversion not updated:', {
        reason: existingConversion ? 'conversion already completed' : 'text_hash not found',
        conversionId: state.conversionId
      });
    }
  } catch (error) {
    console.error('❌ Error updating Supabase conversion:', error);
    
    // Log unexpected errors
    if (state.conversionId) {
      await supabase.from('system_logs').insert({
        event_type: 'conversion_update',
        entity_id: state.conversionId,
        details: {
          error: error.message,
          stack: error.stack
        },
        status: 'error'
      });
    }
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
