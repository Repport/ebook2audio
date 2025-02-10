
import { supabase } from "@/integrations/supabase/client";
import { retryOperation } from "./utils";

export async function createConversion(
  textHash: string, 
  fileName: string | undefined, 
  userId: string | undefined
): Promise<string> {
  try {
    // Attempt to upsert the conversion
    const { data: conversion, error: upsertError } = await supabase
      .from('text_conversions')
      .upsert({
        text_hash: textHash,
        file_name: fileName,
        user_id: userId,
        status: 'pending',
        progress: 0,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      }, {
        onConflict: 'text_hash',
        ignoreDuplicates: false
      })
      .select('id')
      .single();

    if (upsertError) {
      console.error('Error upserting conversion:', upsertError);
      throw upsertError;
    }

    if (!conversion) {
      throw new Error('Failed to create conversion');
    }

    console.log('Created/retrieved conversion record:', conversion.id);
    return conversion.id;
  } catch (error) {
    console.error('Error in createConversion:', error);
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
    const updateData: {
      status: string;
      error_message?: string;
      progress?: number;
    } = {
      status,
      ...(errorMessage && { error_message: errorMessage }),
      ...(typeof progress === 'number' && { progress })
    };

    const { error } = await supabase
      .from('text_conversions')
      .update(updateData)
      .eq('id', conversionId);

    if (error) {
      console.error('Error updating conversion status:', error);
      throw error;
    }
  });
}
