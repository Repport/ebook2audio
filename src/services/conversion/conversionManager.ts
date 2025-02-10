
import { supabase } from "@/integrations/supabase/client";
import { retryOperation } from "./utils";

export async function createConversion(
  textHash: string, 
  fileName: string | undefined, 
  userId: string | undefined
): Promise<string> {
  try {
    // First check if there's an existing completed conversion
    const { data: existingConversion, error: fetchError } = await supabase
      .from('text_conversions')
      .select('id')
      .eq('text_hash', textHash)
      .maybeSingle();

    if (fetchError) {
      console.error('Error checking existing conversion:', {
        error: fetchError,
        context: { textHash, fileName, userId }
      });
      throw fetchError;
    }

    if (existingConversion?.id) {
      console.log('Found existing conversion:', existingConversion.id);
      return existingConversion.id;
    }

    // If no existing conversion, create a new one
    const { data: newConversion, error: insertError } = await supabase
      .from('text_conversions')
      .insert({
        text_hash: textHash,
        file_name: fileName,
        user_id: userId,
        status: 'pending',
        progress: 0,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating conversion:', {
        error: insertError,
        context: { textHash, fileName, userId }
      });
      throw insertError;
    }

    if (!newConversion) {
      throw new Error('Failed to create conversion: No data returned');
    }

    console.log('Created new conversion record:', newConversion.id);
    return newConversion.id;
  } catch (error) {
    console.error('Error in createConversion:', {
      error,
      context: { textHash, fileName, userId }
    });
    throw error;
  }
}

export async function updateConversionStatus(
  conversionId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  errorMessage?: string,
  progress?: number
): Promise<void> {
  await retryOperation(async () => {
    // First, get the current status and error message, selecting only necessary fields
    const { data: existingConversion, error: fetchError } = await supabase
      .from('text_conversions')
      .select('status, error_message')
      .eq('id', conversionId)
      .single();

    if (fetchError) {
      console.error('Error fetching conversion status:', {
        error: fetchError,
        context: { conversionId, status, errorMessage }
      });
      throw fetchError;
    }

    // Check if an update is actually needed
    const needsUpdate = 
      existingConversion.status !== status ||
      (errorMessage && existingConversion.error_message !== errorMessage) ||
      typeof progress === 'number';

    if (!needsUpdate) {
      console.log('No update needed - current state matches desired state');
      return;
    }

    // Build update object with only the fields that need to change
    const updateData: {
      status?: string;
      error_message?: string | null;
      progress?: number;
    } = {};

    if (existingConversion.status !== status) {
      updateData.status = status;
    }

    if (errorMessage && existingConversion.error_message !== errorMessage) {
      updateData.error_message = errorMessage;
    }

    if (typeof progress === 'number') {
      updateData.progress = progress;
    }

    // Only perform update if there are changes to make
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('text_conversions')
        .update(updateData)
        .eq('id', conversionId);

      if (updateError) {
        console.error('Error updating conversion status:', {
          error: updateError,
          context: { conversionId, updateData }
        });
        throw updateError;
      }

      console.log('Successfully updated conversion status:', {
        conversionId,
        updates: updateData
      });
    }
  });
}
