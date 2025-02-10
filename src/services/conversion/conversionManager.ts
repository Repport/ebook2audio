
import { supabase } from "@/integrations/supabase/client";
import { retryOperation } from "./utils";

const checkTableSchema = async () => {
  try {
    const { data, error } = await supabase
      .from('text_conversions')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error fetching table schema:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('Table Schema Columns:', Object.keys(data[0]));
    } else {
      console.log('No records found to check schema');
    }
  } catch (error) {
    console.error('Error in checkTableSchema:', error);
  }
};

export async function createConversion(
  textHash: string, 
  fileName: string | undefined, 
  userId: string | undefined
): Promise<string> {
  try {
    // Log table schema in development
    if (process.env.NODE_ENV === 'development') {
      await checkTableSchema();
    }

    // Create a new conversion record
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
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching conversion status:', {
        error: fetchError,
        context: { conversionId, status, errorMessage }
      });
      throw fetchError;
    }

    // Check if an update is actually needed
    const needsUpdate = 
      !existingConversion ||
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

    if (!existingConversion || existingConversion.status !== status) {
      updateData.status = status;
    }

    if (errorMessage && (!existingConversion || existingConversion.error_message !== errorMessage)) {
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

