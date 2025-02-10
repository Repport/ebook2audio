
import { supabase } from "@/integrations/supabase/client";
import { retryOperation } from "./utils";

export async function createConversion(
  textHash: string, 
  fileName: string | undefined, 
  userId: string | undefined
): Promise<string> {
  try {
    await supabase.rpc('set_statement_timeout');

    // Try to fetch existing conversion first
    const { data: existingConversion, error: fetchError } = await supabase
      .from('text_conversions')
      .select('id, text_hash, status, expires_at, storage_path, compressed_storage_path')
      .eq('text_hash', textHash)
      .eq('status', 'completed')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching existing conversion:', fetchError);
      throw fetchError;
    }

    if (existingConversion) {
      console.log('Found existing valid conversion:', existingConversion.id);
      return existingConversion.id;
    }

    const conversionId = crypto.randomUUID();

    try {
      const { data: newConversion, error: insertError } = await supabase
        .from('text_conversions')
        .insert({
          id: conversionId,
          text_hash: textHash,
          file_name: fileName,
          user_id: userId,
          status: 'pending',
          storage_path: null,
          compressed_storage_path: null,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .maybeSingle();

      if (insertError) {
        console.error('Error creating conversion:', insertError);
        throw insertError;
      }

      if (!newConversion) {
        throw new Error('Failed to create conversion record');
      }

      console.log('Created conversion record:', newConversion.id);
      return newConversion.id;
    } catch (insertError: any) {
      if (insertError.code === '23505') {
        console.log('Duplicate detected, checking for existing conversion again');
        const { data: retryConversion, error: retryError } = await supabase
          .from('text_conversions')
          .select('id, text_hash, status, expires_at, storage_path, compressed_storage_path')
          .eq('text_hash', textHash)
          .eq('status', 'completed')
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (retryError) throw retryError;
        if (retryConversion) {
          console.log('Found existing conversion on retry:', retryConversion.id);
          return retryConversion.id;
        }
      }
      throw insertError;
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
    await supabase.rpc('set_statement_timeout');

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
