
import { supabase } from "@/integrations/supabase/client";
import { retryOperation } from "./utils";

export async function createConversion(
  textHash: string, 
  fileName: string | undefined, 
  userId: string | undefined
): Promise<string> {
  // Check if conversion record already exists and is not expired
  const { data: existingConversions, error: existingError } = await supabase
    .from('text_conversions')
    .select()
    .eq('text_hash', textHash)
    .gt('expires_at', new Date().toISOString())
    .eq('status', 'completed')  // Only consider completed conversions
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

  // Create new conversion record
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
    .single();
  
  if (insertError) {
    console.error('Error creating conversion:', insertError);
    throw insertError;
  }
  
  if (!newConversion) {
    throw new Error('Failed to create conversion record');
  }
  
  console.log('Created new conversion record:', newConversion.id);
  return newConversion.id;
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
