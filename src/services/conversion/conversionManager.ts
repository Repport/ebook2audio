
import { supabase } from "@/integrations/supabase/client";
import { retryOperation } from "./utils";

export async function createConversion(
  textHash: string, 
  fileName: string | undefined, 
  userId: string | undefined
): Promise<string> {
  try {
    // Check if conversion record already exists and is not expired
    const { data: existingConversions, error: existingError } = await supabase
      .from('text_conversions')
      .select()
      .eq('text_hash', textHash)
      .gt('expires_at', new Date().toISOString())
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingError) {
      console.error('Error checking existing conversions:', existingError);
      throw existingError;
    }

    if (existingConversions && existingConversions.length > 0) {
      console.log('Found existing valid conversion');
      return existingConversions[0].id;
    }

    // Try to create new conversion record
    try {
      const { data: newConversion, error: insertError } = await supabase
        .from('text_conversions')
        .insert({
          text_hash: textHash,
          file_name: fileName,
          user_id: userId,
          status: 'pending',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
        .select()
        .maybeSingle();
      
      if (insertError) {
        // Check if it's a unique constraint violation
        if (insertError.code === '23505') {
          // If it is, try to fetch the existing record again (race condition handling)
          const { data: existingConversion, error: fetchError } = await supabase
            .from('text_conversions')
            .select()
            .eq('text_hash', textHash)
            .maybeSingle();

          if (fetchError) throw fetchError;
          if (!existingConversion) throw new Error('Failed to find or create conversion record');
          
          return existingConversion.id;
        }
        throw insertError;
      }
      
      if (!newConversion) {
        throw new Error('Failed to create conversion record');
      }
      
      console.log('Created new conversion record:', newConversion.id);
      return newConversion.id;
    } catch (error) {
      console.error('Error in conversion creation:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in createConversion:', error);
    throw error;
  }
}

export async function updateConversionStatus(
  conversionId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  errorMessage?: string
): Promise<void> {
  await retryOperation(async () => {
    const { error } = await supabase
      .from('text_conversions')
      .update({ 
        status,
        ...(errorMessage && { error_message: errorMessage })
      })
      .eq('id', conversionId);

    if (error) {
      console.error('Error updating conversion status:', error);
      throw error;
    }
  });
}
