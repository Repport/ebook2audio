
import { supabase } from "@/integrations/supabase/client";
import { retryOperation } from "./utils";

export async function createConversion(
  textHash: string, 
  fileName: string | undefined, 
  userId: string | undefined
): Promise<string> {
  try {
    // Set statement timeout before any database operations
    await supabase.rpc('set_statement_timeout');

    // Try to fetch existing conversion first - with a single query to avoid race conditions
    const { data: conversion, error: upsertError } = await supabase
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
          ignoreDuplicates: false // This will return the existing record if there's a conflict
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('Error in upsert operation:', upsertError);
      throw upsertError;
    }

    if (!conversion) {
      throw new Error('Failed to create or retrieve conversion');
    }

    console.log('Conversion record:', conversion.id);
    return conversion.id;
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
