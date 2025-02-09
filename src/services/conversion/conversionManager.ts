
import { supabase } from "@/integrations/supabase/client";
import { retryOperation } from "./utils";

export async function createConversion(
  textHash: string, 
  fileName: string | undefined, 
  userId: string | undefined
): Promise<string> {
  try {
    // Try to fetch existing conversion first
    const { data: existingConversion, error: fetchError } = await supabase
      .from('text_conversions')
      .select()
      .eq('text_hash', textHash)
      .gt('expires_at', new Date().toISOString())
      .eq('status', 'completed')
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching existing conversion:', fetchError);
      throw fetchError;
    }

    // If we found an existing valid conversion, return its ID
    if (existingConversion) {
      console.log('Found existing valid conversion:', existingConversion.id);
      return existingConversion.id;
    }

    // If no existing conversion, try to create a new one with upsert
    const { data: newConversion, error: insertError } = await supabase
      .from('text_conversions')
      .upsert(
        {
          text_hash: textHash,
          file_name: fileName,
          user_id: userId,
          status: 'pending',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        },
        { 
          onConflict: 'text_hash',
          ignoreDuplicates: false // We want to update if exists
        }
      )
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating conversion:', insertError);
      throw insertError;
    }

    if (!newConversion) {
      throw new Error('Failed to create conversion record');
    }

    console.log('Created/updated conversion record:', newConversion.id);
    return newConversion.id;
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
