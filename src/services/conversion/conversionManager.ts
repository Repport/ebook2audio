
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
    // First, get the current status and error message
    const { data: existingConversion, error: fetchError } = await supabase
      .from('text_conversions')
      .select('status, error_message')
      .eq('id', conversionId)
      .single();

    if (fetchError) {
      console.error('Error fetching conversion status:', fetchError);
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
        console.error('Error updating conversion status:', updateError);
        throw updateError;
      }

      console.log('Successfully updated conversion status:', updateData);
    }
  });
}
